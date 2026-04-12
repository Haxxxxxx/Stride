import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Scanline } from "./Scanline";
import svgPaths from "../../imports/svg-oe8cws8da9";
import { containsDelayLanguage, containsResetLanguage, detectMode } from "../utils/agentLayer";
import { shouldDeliverFriction } from "../utils/frictionEngine";
import { recordAgentInteraction, recordDelayLanguage, recordResetEvent, recordFrictionDelivered, getBehaviorState, calculateAlignmentScore } from "../utils/behaviorStore";
import { buildSystemPrompt, getAgentWelcome, type AgentId, type AgentContext } from "../../services/agentPrompts";
import { useAuth } from "../contexts/AuthContext";
import { getDocument, setDocument, updateDocument, deleteDocument, queryCollection, subscribeToCollection, where, orderBy, limit, increment } from "../../services/firestore";
import { createAgentModel, createChatModel, startAgentChat, needsTools, type ChatSession } from "../../services/gemini";
import { executeAction, AGENT_TOOL_NAMES, type ActionProposal } from "../../services/agentActions";
import type { Program, Week } from "../../services/programGenerator";
import { getTodayDayIndex, getCurrentProgramWeek } from "../utils/dateUtils";
import type { EnhancedGenerateContentResponse } from "firebase/ai";

/** Safely extract text from a Gemini response — returns empty string on failure */
function safeText(response: EnhancedGenerateContentResponse): string {
  try {
    return response.text()?.trim() || "";
  } catch {
    return "";
  }
}

interface Message {
  type: 'system' | 'ai' | 'user' | 'plan' | 'friction' | 'pattern' | 'proposal';
  text: string;
  timestamp: string;
  mode?: string;
  planData?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: number | string;
      rest: string;
      changed?: boolean;
      replacing?: boolean;
      dayLabel?: string;
    }>;
  };
  programData?: {
    name: string;
    weeks: Week[];
  };
  proposalId?: string;
  bonusWorkout?: {
    dayNumber: number;
    name: string;
    exercises: Array<{ name: string; sets: number; reps: number | string; rest: string }>;
  };
}

type Agent = "atlas" | "orion" | "kade";

interface AgentInfo {
  name: string;
  title: string;
  description: string;
  personality: string;
}

const agentData: Record<Agent, AgentInfo> = {
  atlas: {
    name: "Atlas",
    title: "The Enforcer",
    description: "A calm and firm guardian of discipline that establishes a non-negotiable baseline to protect your streaks against hesitation and rationalization.",
    personality: "firm and disciplined"
  },
  orion: {
    name: "Orion",
    title: "The Navigator",
    description: "A warm and strategic guide that intelligently adapts your training trajectory in real-time to navigate stress, injury, or schedule changes without breaking your flow.",
    personality: "adaptive and strategic"
  },
  kade: {
    name: "Kade",
    title: "The Rival",
    description: "A bold and playful competitor that gamifies your daily execution with high-stakes dares, challenges and benchmarks to shatter complacency and drive momentum.",
    personality: "competitive and bold"
  }
};

function CheckCircle() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p1e46b900} fill="#ff6600" />
      </svg>
    </div>
  );
}

function EmptyCircle() {
  return (
    <div className="flex items-center justify-center relative shrink-0 size-[20px]">
      <div className="relative rounded-full shrink-0 size-[16px] border-2 border-[#ff6600]" />
    </div>
  );
}

// ============================================================
// Chat History Persistence (localStorage + Firestore backup)
// ============================================================

const CHAT_STORAGE_KEY = "stride_chat_history";
const MAX_PERSISTED_MESSAGES = 50;
const MAX_IN_MEMORY_MESSAGES = 60; // Cap in-memory messages to prevent unbounded growth
const MAX_GEMINI_HISTORY = 20; // Last N user+ai turns to pass as Gemini conversation history
const FIRESTORE_SAVE_DEBOUNCE = 15000; // Debounce Firestore writes (15s reduces cost ~70%)

/** Load chat history from localStorage (fast, synchronous) */
function loadChatHistoryLocal(): Message[] | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages: Message[]; agent: string; savedAt: number };
    // Discard if older than 24h
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
    return parsed.messages;
  } catch {
    return null;
  }
}

/** Load chat history from Firestore (cross-device, async) */
async function loadChatHistoryFirestore(uid: string): Promise<{ messages: Message[]; agent: string; savedAt: number } | null> {
  try {
    const doc = await getDocument<{ messages: Message[]; agent: string; savedAt: number }>(
      `users/${uid}/chatHistory/latest`
    );
    if (!doc || !doc.messages?.length) return null;
    // Discard if older than 24h
    if (Date.now() - doc.savedAt > 24 * 60 * 60 * 1000) return null;
    return doc;
  } catch {
    return null;
  }
}

/** Resolve best chat history: pick the most recent between localStorage and Firestore */
async function loadChatHistory(uid?: string): Promise<Message[] | null> {
  const local = loadChatHistoryLocal();
  if (!uid) return local;

  const remote = await loadChatHistoryFirestore(uid);
  if (!local && !remote) return null;
  if (!remote) return local;
  if (!local) return remote.messages;

  // Both exist — pick the one with the most recent savedAt
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const localSavedAt = raw ? (JSON.parse(raw) as { savedAt: number }).savedAt : 0;
    return remote.savedAt > localSavedAt ? remote.messages : local;
  } catch {
    return local;
  }
}

/** Build Gemini-compatible conversation history from recent messages */
function buildGeminiHistory(messages: Message[]): { role: "user" | "model"; parts: [{ text: string }] }[] {
  const history: { role: "user" | "model"; parts: [{ text: string }] }[] = [];
  // Only take the last MAX_GEMINI_HISTORY pairs of user+ai messages
  const relevant = messages
    .filter(m => m.type === "user" || m.type === "ai" || m.type === "pattern" || m.type === "friction")
    .slice(-(MAX_GEMINI_HISTORY * 2));

  for (const msg of relevant) {
    const role = msg.type === "user" ? "user" as const : "model" as const;
    // Avoid consecutive same-role entries (Gemini requirement)
    if (history.length > 0 && history[history.length - 1].role === role) {
      history[history.length - 1].parts[0].text += "\n" + msg.text;
    } else {
      history.push({ role, parts: [{ text: msg.text }] });
    }
  }

  // Gemini requires history to start with "user" role
  while (history.length > 0 && history[0].role !== "user") {
    history.shift();
  }
  // Gemini requires history to end with "model" role
  while (history.length > 0 && history[history.length - 1].role !== "model") {
    history.pop();
  }

  return history;
}

function saveChatHistory(
  messages: Message[], agent: string, uid?: string,
  timerRef?: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
) {
  // Only persist text-based messages, skip proposals (non-serializable execute fn)
  const toSave = messages
    .filter(m => m.type !== "proposal")
    .slice(-MAX_PERSISTED_MESSAGES);
  const payload = { messages: toSave, agent, savedAt: Date.now() };

  // localStorage — immediate (fast cache)
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  } catch { /* quota exceeded — ignore */ }

  // Firestore — debounced (cross-device backup)
  if (uid && timerRef) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDocument(`users/${uid}/chatHistory/latest`, payload).catch(() => {});
    }, FIRESTORE_SAVE_DEBOUNCE);
  }
}

export default function AIAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent>("atlas");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(currentAgent);
  const [userProfile, setUserProfile] = useState<AgentContext["userProfile"]>(null);
  const [callsign, setCallsign] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>(() => {
    // Fast restore from localStorage on mount (Firestore checked async in useEffect)
    const saved = loadChatHistoryLocal();
    if (saved && saved.length > 0) return saved;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return [
      { type: "system", text: "COMMAND CHANNEL ESTABLISHED", timestamp: now },
      { type: "ai", text: "Initializing agent...", timestamp: now },
    ];
  });

  // Gemini state — two-tier: chatSession (no tools, cheap) + toolSession (with tools, for program actions)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [toolSession, setToolSession] = useState<ChatSession | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ActionProposal | null>(null);
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<(Program & { id: string }) | null>(null);
  const lastSendRef = useRef(0); // rate limiting
  const firestoreSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  // Stable refs so the unmount effect never closes over stale state
  const messagesRef = useRef(messages);
  const currentAgentRef = useRef(currentAgent);
  const callsignRef = useRef(callsign);
  const recentWorkoutsRef = useRef<AgentContext["recentWorkouts"]>([]);
  const recentModificationsRef = useRef<AgentContext["recentModifications"]>([]);
  /** Track behavior state snapshot to detect changes (e.g., workout completed mid-conversation) */
  const lastBehaviorKeyRef = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep refs in sync — direct assignment (no useEffect needed for refs)
  messagesRef.current = messages;
  currentAgentRef.current = currentAgent;
  callsignRef.current = callsign;

  // Real-time listener for active program — stays in sync with Firestore at all times
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<Program & { id: string; active: boolean }>(
      `users/${user.uid}/programs`,
      [where("active", "==", true), limit(1)],
      (programs) => {
        if (programs.length > 0) {
          setActiveProgram(programs[0]);
        } else {
          setActiveProgram(null);
        }
      }
    );
    return unsub;
  }, [user]);

  // Escape key closes the agent selection modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAgentModal(false); };
    if (showAgentModal) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showAgentModal]);

  // Persist chat history + cap in-memory messages
  useEffect(() => {
    if (messages.length > 2) {
      saveChatHistory(messages, currentAgent, user?.uid, firestoreSaveTimerRef);
    }
    // Window: keep only last MAX_IN_MEMORY_MESSAGES to prevent unbounded growth
    if (messages.length > MAX_IN_MEMORY_MESSAGES) {
      setMessages(prev => prev.slice(-MAX_IN_MEMORY_MESSAGES));
    }
  }, [messages, currentAgent]);

  // Flush pending Firestore save immediately on unmount (captures last message before close)
  // Uses refs so this effect only registers/unregisters when user.uid changes — not on every message
  useEffect(() => {
    return () => {
      if (firestoreSaveTimerRef.current && user?.uid) {
        clearTimeout(firestoreSaveTimerRef.current);
        firestoreSaveTimerRef.current = null;
        const toSave = messagesRef.current.filter(m => m.type !== "proposal").slice(-MAX_PERSISTED_MESSAGES);
        if (toSave.length > 2) {
          setDocument(`users/${user.uid}/chatHistory/latest`, {
            messages: toSave, agent: currentAgentRef.current, savedAt: Date.now()
          }).catch(() => {});
        }
      }
    };
  }, [user?.uid]);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Build context and initialize both Gemini sessions (chat + tools)
  const initializeGemini = useCallback((
    agent: Agent,
    profile: AgentContext["userProfile"],
    program: (Program & { id: string }) | null,
    recentWorkouts?: AgentContext["recentWorkouts"],
    recentModifications?: AgentContext["recentModifications"],
    currentMessages?: Message[],
    agentCallsign?: string,
  ) => {
    try {
      const behaviorState = getBehaviorState();
      const behaviorKey = `${behaviorState.streakDays}-${behaviorState.totalWorkoutsCompleted}-${behaviorState.alignmentScore}`;
      lastBehaviorKeyRef.current = behaviorKey;
      const context: AgentContext = {
        behaviorState,
        callsign: agentCallsign || callsignRef.current,
        userProfile: profile,
        activeProgram: program ? (() => {
          // Calculate current week + today using shared utilities (same formulas as Dashboard)
          const currentWeekNum = getCurrentProgramWeek(program.createdAt, program.weeks.length);
          const weekData = program.weeks[currentWeekNum - 1] ?? program.weeks[0];
          const totalDaysInWeek = weekData?.days.length ?? 0;
          const todayIdx = getTodayDayIndex();
          const isRestDay = totalDaysInWeek > 0 && todayIdx >= totalDaysInWeek;
          const todayDay = isRestDay ? null : weekData?.days[todayIdx];
          // Check if today's workout is completed — use lastWorkoutCompletedAt from behavior state
          const lastCompletedTs = behaviorState.lastWorkoutCompletedAt || 0;
          const todayCompleted = lastCompletedTs > 0 && new Date(lastCompletedTs).toDateString() === new Date().toDateString();
          return {
            name: program.name,
            currentWeek: currentWeekNum,
            currentDay: todayDay?.name ?? (isRestDay ? "Rest Day" : "Day 1"),
            totalWeeks: program.weeks.length,
            weekType: (weekData as { weekType?: string })?.weekType,
            todayDayNumber: todayDay?.dayNumber ?? 0,
            totalDaysInWeek,
            isRestDay,
            todayExercises: todayDay?.exercises?.map(e => ({ name: e.name, sets: e.sets, reps: String(e.reps) })),
            todayCompleted,
          };
        })() : null,
        recentWorkouts,
        recentModifications,
      };
      const systemPrompt = buildSystemPrompt(agent as AgentId, context);

      // Build conversation history from existing messages for continuity
      const geminiHistory = currentMessages ? buildGeminiHistory(currentMessages) : undefined;

      // Chat session: no tools, ~400-500 tokens cheaper per message
      const chatModel = createChatModel(systemPrompt);
      const chat = startAgentChat(chatModel, geminiHistory);
      setChatSession(chat);

      // Tool session: with function calling, for program actions
      const toolModel = createAgentModel(systemPrompt);
      const tools = startAgentChat(toolModel, geminiHistory);
      setToolSession(tools);

      return { chat, tools };
    } catch (err) {
      console.warn("[AIAgent] Gemini init failed:", err);
      setChatSession(null);
      setToolSession(null);
      return null;
    }
  }, []);

  // Load agent + profile + active program from Firestore on mount
  useEffect(() => {
    if (!user) return;
    // Reset initRef if user changed (shared device / re-login)
    if (initRef.current && user.uid !== (initRef as { current: string | boolean }).current) {
      initRef.current = false;
    }
    if (initRef.current) return;
    (initRef as { current: string | boolean }).current = user.uid;
    toolConversationRef.current = false; // Reset stale tool conversation state

    calculateAlignmentScore();

    const loadData = async () => {
      let profile: AgentContext["userProfile"] = null;
      let program: (Program & { id: string }) | null = null;
      let agent: Agent = "atlas";
      let userCallsign: string | undefined;

      // Load callsign from user doc
      try {
        const userDoc = await getDocument<{ callsign?: string }>(`users/${user.uid}`);
        if (userDoc?.callsign) {
          userCallsign = userDoc.callsign;
          setCallsign(userCallsign);
        }
      } catch { /* callsign is optional — proceed without it */ }

      try {
        const data = await getDocument<Record<string, unknown>>(`users/${user.uid}/personalization/data`);
        if (data) {
          // Format height/weight as compact strings (e.g. "180cm", "75kg", "5'9\"")
          const fmtMeasure = (m: unknown): string | undefined => {
            const measure = m as { value?: string; unit?: string } | undefined;
            if (!measure?.value) return undefined;
            // Feet values stored as "5'9" — display as 5'9" instead of "5'9ft"
            if (measure.unit === "ft" && measure.value.includes("'")) {
              return `${measure.value}"`;
            }
            return `${measure.value}${measure.unit || ""}`;
          };
          const equipRaw = data.equipmentAccess;
          const equipStr = Array.isArray(equipRaw) ? equipRaw.join(",") : (equipRaw as string);
          const sportRaw = data.sportFocus;
          const sportArr = Array.isArray(sportRaw) ? sportRaw as string[] : sportRaw ? [sportRaw as string] : undefined;

          profile = {
            optimizationGoal: data.optimizationGoal as string,
            experience: data.experience as string,
            constraints: data.constraints as string[],
            sessionTime: data.sessionTime as string,
            trainingFocuses: data.trainingFocuses as string[],
            equipmentAccess: equipStr,
            bodyProfile: data.bodyProfile as string,
            sportFocus: sportArr,
            height: fmtMeasure(data.height),
            weight: fmtMeasure(data.weight),
            goalWeight: fmtMeasure(data.goalWeight),
            gymAccess: data.gymAccess as string,
          };
          setUserProfile(profile);
          if (data.selectedAgent) {
            agent = data.selectedAgent as Agent;
            setCurrentAgent(agent);
            setSelectedAgent(agent);
          }
        }
      } catch (err) {
        console.warn("Failed to load personalization:", err);
      }

      // Query active program directly — the real-time listener may not have fired yet
      try {
        const programs = await queryCollection<Program & { id: string; active: boolean }>(
          `users/${user.uid}/programs`,
          [where("active", "==", true), limit(1)]
        );
        program = programs[0] ?? null;
      } catch (err) {
        console.warn("Failed to load active program:", err);
      }

      // Load recent workout logs (last 5) with performance data for coaching intelligence
      let recentWorkouts: AgentContext["recentWorkouts"] = [];
      try {
        const logs = await queryCollection<{
          workoutName: string;
          exercises: { name: string; actualSets?: { weight: number; repsCompleted: number; rpe: number; setNumber: number }[] }[];
          completedAt: string;
          completionType: string;
          readiness?: { sleepQuality: number; energyLevel: number; painReported: boolean };
        }>(
          `users/${user.uid}/workoutLogs`,
          [orderBy("completedAt", "desc"), limit(5)]
        );
        recentWorkouts = logs.map(l => {
          // Extract per-exercise performance summaries
          const performance = l.exercises
            ?.filter(e => e.actualSets && e.actualSets.length > 0)
            .map(e => {
              const sets = e.actualSets!;
              const avgWeight = Math.round(sets.reduce((s, d) => s + d.weight, 0) / sets.length);
              const avgRPE = Math.round(sets.reduce((s, d) => s + d.rpe, 0) / sets.length * 10) / 10;
              return { exercise: e.name, avgWeight, avgRPE, totalSets: sets.length };
            });

          return {
            date: new Date(l.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            name: l.workoutName || "Workout",
            exercises: l.exercises?.map(e => e.name) || [],
            completionType: l.completionType || "full",
            performance: performance?.length ? performance : undefined,
            readiness: l.readiness ? {
              sleep: l.readiness.sleepQuality,
              energy: l.readiness.energyLevel,
              pain: l.readiness.painReported,
            } : undefined,
          };
        });
      } catch (err) {
        console.warn("Failed to load workout logs:", err);
      }

      // Load recent program modifications (last 5)
      let recentModifications: AgentContext["recentModifications"] = [];
      try {
        const mods = await queryCollection<{
          action: string;
          description: string;
          timestamp: string;
        }>(
          `users/${user.uid}/programModifications`,
          [orderBy("timestamp", "desc"), limit(5)]
        );
        recentModifications = mods.map(m => ({
          date: new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          action: m.action,
          description: m.description,
        }));
      } catch (err) {
        console.warn("Failed to load modification history:", err);
      }

      // Persist to refs for reinitialization during tool session switches
      recentWorkoutsRef.current = recentWorkouts;
      recentModificationsRef.current = recentModifications;

      // Initialize Gemini with full context + conversation history (Firestore > localStorage)
      const savedHistory = await loadChatHistory(user.uid);
      initializeGemini(agent, profile, program, recentWorkouts, recentModifications, savedHistory || undefined, userCallsign);

      // If Firestore had newer history, update in-memory messages
      const localHistory = loadChatHistoryLocal();
      if (savedHistory && savedHistory !== localHistory && savedHistory.length > 0) {
        setMessages(savedHistory);
      }

      // Only set welcome messages if no history was restored
      if (!savedHistory || savedHistory.length === 0) {
        setMessages([
          { type: "system", text: "COMMAND CHANNEL ESTABLISHED", timestamp: getTimestamp() },
          { type: "ai", text: getAgentWelcome(agent, userCallsign), timestamp: getTimestamp() },
        ]);
      }

      // Auto-send pending prompt (e.g. from "Generate New Protocol" button on Dashboard)
      const pendingPrompt = localStorage.getItem("stride_agent_prompt");
      if (pendingPrompt) {
        localStorage.removeItem("stride_agent_prompt");
        // Small delay to let Gemini session initialize
        setTimeout(() => {
          setInput(pendingPrompt);
          // Trigger send on next tick after input is set
          setTimeout(() => {
            const sendBtn = document.querySelector("[data-agent-send]") as HTMLButtonElement;
            sendBtn?.click();
          }, 100);
        }, 500);
      }
    };

    loadData();
  }, [user, initializeGemini]);

  const handleSend = async () => {
    if (!input.trim() || isThinking || pendingProposal) return;

    // Rate limit: 2 seconds between messages
    const now = Date.now();
    if (now - lastSendRef.current < 2000) return;
    lastSendRef.current = now;

    // Daily message limit — Firestore-backed (enforced by security rules, max 100/day)
    const DAILY_LIMIT = 100;
    const todayKey = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local date
    if (user) {
      try {
        const rateLimitDoc = await getDocument<{ count: number }>(`users/${user.uid}/rateLimits/${todayKey}`);
        const currentCount = rateLimitDoc?.count ?? 0;
        if (currentCount >= DAILY_LIMIT) {
          setMessages(prev => [...prev, {
            type: "system" as const,
            text: "DAILY COMMS LIMIT REACHED — 100 transmissions per cycle. Resets at 0000.",
            timestamp: getTimestamp(),
          }]);
          return;
        }
        // Increment counter atomically (security rules enforce max 100 and +1 only)
        if (rateLimitDoc) {
          await updateDocument(`users/${user.uid}/rateLimits/${todayKey}`, { count: increment(1) });
        } else {
          await setDocument(`users/${user.uid}/rateLimits/${todayKey}`, { count: 1 }, false);
        }
      } catch {
        // If rate limit check fails, allow the message (don't block on infra issues)
      }
    }

    const userMessage: Message = {
      type: "user",
      text: input,
      timestamp: getTimestamp()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsThinking(true);

    // Record agent interaction + detect behavior patterns
    recordAgentInteraction();
    if (containsDelayLanguage(userInput)) recordDelayLanguage();
    if (containsResetLanguage(userInput)) recordResetEvent();

    try {
      await handleGeminiSend(userInput);
    } catch (geminiErr) {
      console.warn("[AIAgent] Gemini failed, using template fallback:", geminiErr);
      const errMsg = (geminiErr as { message?: string }).message || "";
      if (errMsg.includes("429") || errMsg.includes("quota")) {
        // Rate limited — fall back to template so user always gets a response
        setMessages(prev => [...prev, {
          type: "system",
          text: "NEURAL LINK REDUCED — switching to local protocol.",
          timestamp: getTimestamp(),
        }]);
        handleTemplateFallback(userInput);
      } else {
        handleTemplateFallback(userInput);
      }
    } finally {
      setIsThinking(false);
    }
  };

  /** Send a message with 30s timeout and up to 2 retries on 429 rate limit */
  const sendWithRetry = async (session: ChatSession, message: string | Parameters<ChatSession["sendMessage"]>[0]) => {
    const withTimeout = (promise: Promise<unknown>) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout — neural link lost.")), 30000)),
      ]);

    const MAX_RETRIES = 2;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await withTimeout(session.sendMessage(message)) as Awaited<ReturnType<ChatSession["sendMessage"]>>;
      } catch (err: unknown) {
        lastErr = err;
        const msg = (err as { message?: string }).message || "";
        if (msg.includes("429") && attempt < MAX_RETRIES) {
          // Exponential backoff: 5s → 10s (capped from suggested delay)
          const delayMatch = msg.match(/retry in ([\d.]+)s/i);
          const baseSec = delayMatch ? parseFloat(delayMatch[1]) : 5;
          const delaySec = Math.min(baseSec * (attempt + 1), 15);
          await new Promise((r) => setTimeout(r, delaySec * 1000));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };

  /** Handle a single function call result — may trigger chained calls */
  const handleFunctionCall = async (
    session: ChatSession,
    fc: { name: string; args: unknown },
    depth: number,
  ): Promise<void> => {
    const args = (fc.args as Record<string, unknown>) ?? {};
    const actionResult = await executeAction(fc.name, args, user!.uid);

    if (actionResult.type === "data") {
      // Read action — send result back to Gemini for summary (may trigger another tool call)
      const followUp = await sendWithRetry(session, [{
        functionResponse: {
          name: fc.name,
          response: actionResult.data,
        },
      }]);

      // Check if Gemini wants to chain another function call (e.g., getActiveProgram → swapExercise)
      const chainedCalls = followUp.response.functionCalls();
      if (chainedCalls && chainedCalls.length > 0) {
        // Show intermediate text if any
        const intermediateText = safeText(followUp.response);
        if (intermediateText) addAgentMessage(intermediateText);

        if (depth < 3) {
          await handleFunctionCall(session, chainedCalls[0], depth + 1);
          return;
        }
        // Chain limit reached — let Gemini's text response through
      }

      const text = safeText(followUp.response) || "Here's your current protocol data.";

      // For getActiveProgram, attach structured program data to the message
      const normalizedName = fc.name.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
      if (normalizedName === "getActiveProgram" && actionResult.data.found && actionResult.data.weeks) {
        const msg: Message = {
          type: "ai",
          text,
          timestamp: getTimestamp(),
          programData: {
            name: actionResult.data.name as string,
            weeks: actionResult.data.weeks as Week[],
          },
        };
        setMessages(prev => [...prev, msg]);
      } else if ((normalizedName === "generateBonusWorkout" || normalizedName === "loadDayWorkout") && actionResult.data.bonusWorkout) {
        const bonus = actionResult.data.bonusWorkout as Message["bonusWorkout"];
        // Immediately store so the Dashboard picks it up regardless of how the user navigates back
        try { localStorage.setItem("stride_bonus_workout", JSON.stringify(bonus)); } catch { /* quota */ }
        const msg: Message = {
          type: "ai",
          text,
          timestamp: getTimestamp(),
          bonusWorkout: bonus,
        };
        setMessages(prev => [...prev, msg]);
      } else {
        addAgentMessage(text);
      }
    } else {
      // Write action — show proposal for user confirmation
      const proposal = actionResult.proposal;
      const pid = `proposal-${Date.now()}`;
      setPendingProposal(proposal);
      setPendingProposalId(pid);

      const proposalMsg: Message = {
        type: "proposal",
        text: proposal.description,
        timestamp: getTimestamp(),
        planData: {
          exercises: proposal.preview.exercises.map(e => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
            changed: e.changed,
            replacing: e.replacing,
            dayLabel: e.dayLabel,
          })),
        },
        proposalId: pid,
      };
      setMessages(prev => [...prev, proposalMsg]);
    }
  };

  // Track whether we're mid-conversation about program modifications
  const toolConversationRef = useRef(false);

  /** Primary: Gemini via Firebase AI Logic — routes to chat or tool session */
  const handleGeminiSend = async (userInput: string) => {
    // Use tool session if: keyword match, OR we're mid-tool-conversation (follow-up like "back and arms")
    const useTools = needsTools(userInput) || toolConversationRef.current;

    // Check if behavior state changed since last init (e.g., workout completed between messages)
    const currentBehavior = getBehaviorState();
    const currentKey = `${currentBehavior.streakDays}-${currentBehavior.totalWorkoutsCompleted}-${currentBehavior.alignmentScore}`;
    let freshSessions: ReturnType<typeof initializeGemini> = null;
    if (currentKey !== lastBehaviorKeyRef.current) {
      // Behavior changed — reinit sessions with fresh context and use them immediately
      freshSessions = initializeGemini(currentAgent, userProfile, activeProgram, recentWorkoutsRef.current, recentModificationsRef.current, messagesRef.current);
    }

    // Pick the right session — prefer freshly initialized sessions over stale state
    let session = freshSessions
      ? (useTools ? freshSessions.tools : freshSessions.chat)
      : (useTools ? toolSession : chatSession);

    // Reinitialize if no session (pass current messages for history continuity)
    if (!session) {
      const sessions = initializeGemini(currentAgent, userProfile, activeProgram, recentWorkoutsRef.current, recentModificationsRef.current, messages);
      if (!sessions) throw new Error("Gemini init failed");
      session = useTools ? sessions.tools : sessions.chat;
    }

    // Inject conversation mode + friction context into the message for behavioral adaptation
    const mode = detectMode(userInput);
    const friction = shouldDeliverFriction();
    lastFrictionRef.current = friction; // cache for deliverFriction() — prevents double evaluation
    // Strip any bracket tags from user input to prevent prompt injection
    const sanitizedInput = userInput.replace(/\[(?:MODE|FRICTION|SYSTEM|ADMIN|TOOL):[^\]]*\]/gi, '');
    let enrichedInput = sanitizedInput;
    if (mode !== "clarification" || friction.eligible) {
      const tags: string[] = [];
      if (mode && mode !== "clarification") tags.push(`[MODE:${mode.toUpperCase()}]`);
      if (friction.eligible) tags.push(`[FRICTION:${friction.flag}]`);
      enrichedInput = `${tags.join(" ")} ${sanitizedInput}`;
    }

    const result = await sendWithRetry(session, enrichedInput);
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      toolConversationRef.current = true; // stay on tool session for follow-ups
      // Process all function calls (Gemini may return multiple in one response)
      for (const fc of functionCalls) {
        await handleFunctionCall(session, fc, 0);
      }
    } else {
      const text = safeText(response);
      if (!text) throw new Error("Empty Gemini response");

      // Detect if Gemini output a function call as text instead of using proper function calling.
      // Catches: functionName(, `functionName`, "Calling functionName", JSON {"tool_name":"functionName"}
      // Also catches: agent CLAIMING it did something ("I've generated", "loaded and ready", "created your workout")
      const KNOWN_TOOLS = AGENT_TOOL_NAMES.join("|");
      const textCallMatch = text.match(new RegExp(`\\b(${KNOWN_TOOLS})\\s*\\(`)) ||
        text.match(new RegExp(`\`(${KNOWN_TOOLS})\``)) ||
        text.match(new RegExp(`(?:calling|invoke|execute|use|run)\\s+\`?(${KNOWN_TOOLS})\`?`, "i")) ||
        text.match(new RegExp(`"(?:tool_name|tool_code)"\\s*:\\s*"(${KNOWN_TOOLS})"`));
      // Detect hallucinated action claims — agent says it did something without calling a tool
      const actionClaimMatch = !textCallMatch && useTools &&
        /\b(i('ve|\s+have)\s+(generated|created|built|loaded|modified|updated|swapped|replaced|adjusted|regenerated|added|removed)|it\s+is\s+loaded|loaded\s+and\s+ready|ready\s+for\s+execution|protocol\s+updated|changes?\s+applied)\b/i.test(text);
      if ((textCallMatch || actionClaimMatch) && toolSession) {
        // Re-send to tool session so it can make the actual function call
        // Use sanitized input (not raw userInput) to preserve prompt injection protection
        const retryResult = await sendWithRetry(toolSession, sanitizedInput);
        const retryFCs = retryResult.response.functionCalls();
        if (retryFCs && retryFCs.length > 0) {
          toolConversationRef.current = true;
          await handleFunctionCall(toolSession, retryFCs[0], 0);
          deliverFriction();
          return;
        }
        // If still no function call, strip the JSON/code block and show just the natural text
        const retryText = safeText(retryResult.response);
        if (retryText) {
          addAgentMessage(retryText);
          deliverFriction();
          return;
        }
      }

      // If agent asked a follow-up question (like "what focus?"), keep tool conversation alive
      // Otherwise reset — the agent gave a definitive text response without calling a tool
      if (text.includes("?") && useTools) {
        toolConversationRef.current = true;
      } else {
        toolConversationRef.current = false;
      }

      // Strip any leaked tool calls / JSON blocks from displayed text
      const toolNamePattern = AGENT_TOOL_NAMES.join("|");
      const cleanText = text
        .replace(/```json\s*\{[\s\S]*?"(?:tool_name|tool_code)"[\s\S]*?\}\s*```/g, "")
        .replace(/\{[\s\S]*?"(?:tool_name|tool_code)"[\s\S]*?\}/g, "")
        .replace(new RegExp(`(?:calling|invoke|execute|use|run)\\s+\`?(?:${toolNamePattern})\`?\\s*(?:with\\s+[^\\.]*\\.?)?`, "gi"), "")
        .replace(new RegExp(`\`(?:${toolNamePattern})\``, "g"), "")
        .trim();
      // Reuse `mode` from line above (already computed) — don't call detectMode again
      // (it uses Math.random() for pattern reflection, would produce different result)
      addAgentMessage(cleanText || text, mode);
    }

    // Friction delivery
    deliverFriction();
  };

  /** Fallback: template-based agentLayer */
  const handleTemplateFallback = (userInput: string) => {
    const { mode, response } = getAgentResponse(userInput);
    addAgentMessage(response, mode);
    deliverFriction();
  };

  const addAgentMessage = (text: string, mode?: string) => {
    const msgType = mode === "patternReflection" ? "pattern" : "ai";
    setMessages(prev => [...prev, {
      type: msgType,
      text,
      timestamp: getTimestamp(),
      mode,
    }]);
  };

  /** Cached friction result from the current message cycle — prevents double evaluation */
  const lastFrictionRef = useRef<ReturnType<typeof shouldDeliverFriction> | null>(null);

  const deliverFriction = () => {
    // Use pre-computed result if available (from handleGeminiSend), otherwise compute fresh
    const frictionDecision = lastFrictionRef.current ?? shouldDeliverFriction();
    lastFrictionRef.current = null; // clear for next cycle
    if (frictionDecision.eligible) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: "friction",
          text: frictionDecision.response,
          timestamp: getTimestamp(),
          mode: `friction:${frictionDecision.flag}`,
        }]);
        recordFrictionDelivered();

        if (frictionDecision.agent !== currentAgent) {
          setMessages(prev => [...prev, {
            type: "system",
            text: `ROUTING: ${agentData[frictionDecision.agent].name} — ${agentData[frictionDecision.agent].title}`,
            timestamp: getTimestamp(),
          }]);
        }
      }, 800);
    }
  };

  /** Confirm a pending write action proposal */
  const handleConfirmAction = async () => {
    if (!pendingProposal || !toolSession) return;
    setIsThinking(true);

    try {
      // Execute the Firestore write
      await pendingProposal.execute();

      // Update behavior state for specific actions
      if (pendingProposal.actionName === "skipWorkoutDay") {
        const { recordWorkoutSkipped } = await import("../utils/behaviorStore");
        recordWorkoutSkipped();
        // Write a skipped workoutLog so refreshWorkoutCounts can track it from Firestore
        if (user) {
          const { toLocalISO } = await import("../utils/dateUtils");
          setDocument(`users/${user.uid}/workoutLogs/skip_${Date.now()}`, {
            workoutName: "Skipped Day",
            exercises: [],
            duration: 0,
            completedAt: toLocalISO(new Date()),
            completedAtMs: Date.now(),
            completionType: "skipped",
          }).catch(console.warn);
        }
      } else if (pendingProposal.actionName === "generateDeloadWeek") {
        const { recordDeloadComplete } = await import("../utils/behaviorStore");
        recordDeloadComplete();
      }

      // Log the modification for future agent context
      if (user) {
        const modId = `mod_${Date.now()}`;
        setDocument(`users/${user.uid}/programModifications/${modId}`, {
          action: pendingProposal.actionName,
          description: pendingProposal.description,
          programId: pendingProposal.programId,
          timestamp: new Date().toISOString(),
        }).catch(console.warn);
      }

      // Send success back to Gemini so it can confirm in character
      // Use originalName if available (Gemini may have sent snake_case)
      const responseName = pendingProposal.originalName || pendingProposal.actionName;
      const followUp = await toolSession.sendMessage([{
        functionResponse: {
          name: responseName,
          response: { success: true, message: "Changes applied successfully." },
        },
      }]);

      const text = safeText(followUp.response) || "Protocol updated. Changes applied.";

      // Fetch updated program for inline display + Gemini reinit
      // (real-time listener also updates activeProgram state automatically)
      let updatedProgram: (Program & { id: string }) | null = null;
      if (user) {
        const programs = await queryCollection<Program & { id: string; active: boolean }>(
          `users/${user.uid}/programs`,
          [where("active", "==", true), limit(1)]
        );
        if (programs[0]) updatedProgram = programs[0];
      }

      // Extract the edited section from the proposal description to show updated data
      // Parse weekNumber/dayNumber from the proposal description
      const weekMatch = pendingProposal.description.match(/Week (\d+)/);
      const dayMatch = pendingProposal.description.match(/Day (\d+)/);
      const editedWeekNum = weekMatch ? parseInt(weekMatch[1]) : null;
      const editedDayNum = dayMatch ? parseInt(dayMatch[1]) : null;

      // Build programData showing only the edited section
      let editedProgramData: Message["programData"] | undefined;
      if (updatedProgram && editedWeekNum) {
        const editedWeek = updatedProgram.weeks.find(w => w.weekNumber === editedWeekNum);
        if (editedWeek) {
          // If a specific day was edited, show just that day; otherwise show the whole week
          const daysToShow = editedDayNum
            ? editedWeek.days.filter(d => d.dayNumber === editedDayNum)
            : editedWeek.days;

          editedProgramData = {
            name: `${updatedProgram.name} — Updated`,
            weeks: [{
              weekNumber: editedWeek.weekNumber,
              days: daysToShow.map(d => ({
                dayNumber: d.dayNumber,
                name: d.name,
                exercises: d.exercises.map(e => ({
                  name: e.name,
                  sets: e.sets,
                  reps: e.reps,
                  rest: e.rest,
                })),
              })),
            }],
          };
        }
      }

      // Add agent message with the edited program section attached
      const confirmMsg: Message = {
        type: "ai",
        text,
        timestamp: getTimestamp(),
        programData: editedProgramData,
      };
      setMessages(prev => [...prev, confirmMsg]);

      // System confirmation
      setMessages(prev => [...prev, {
        type: "system",
        text: "PROTOCOL UPDATED",
        timestamp: getTimestamp(),
      }]);

      // Re-initialize Gemini sessions with updated program so next messages use fresh context
      if (updatedProgram) {
        initializeGemini(currentAgent, userProfile, updatedProgram, recentWorkoutsRef.current, recentModificationsRef.current, messagesRef.current);
      }
    } catch (err) {
      console.warn("[AIAgent] Confirm action failed:", err);
      // Send failure response to keep tool session in valid state
      try {
        if (toolSession && pendingProposal) {
          const failName = pendingProposal.originalName || pendingProposal.actionName;
          await toolSession.sendMessage([{
            functionResponse: {
              name: failName,
              response: { success: false, message: "Execution failed." },
            },
          }]);
        }
      } catch { /* best effort recovery */ }
      setMessages(prev => [...prev, {
        type: "system",
        text: "ACTION FAILED — protocol unchanged",
        timestamp: getTimestamp(),
      }]);
    } finally {
      setPendingProposal(null);
      setPendingProposalId(null);
      setIsThinking(false);
    }
  };

  /** Reject a pending write action proposal */
  const handleRejectAction = async () => {
    if (!pendingProposal) return;

    try {
      if (toolSession) {
        const rejectName = pendingProposal.originalName || pendingProposal.actionName;
        const followUp = await toolSession.sendMessage([{
          functionResponse: {
            name: rejectName,
            response: { success: false, message: "Operator rejected the proposed changes." },
          },
        }]);
        const text = safeText(followUp.response) || "Understood. Protocol unchanged.";
        addAgentMessage(text);
      }
    } catch (err) {
      console.warn("[AIAgent] Reject follow-up failed:", err);
      addAgentMessage("Understood. Protocol unchanged.");
    } finally {
      setPendingProposal(null);
      setPendingProposalId(null);
    }
  };

  const handleQuickCommand = (command: string) => {
    if (isThinking || pendingProposal) return;
    setInput(command);
    inputRef.current?.focus();
  };

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const confirmAgentChange = () => {
    setCurrentAgent(selectedAgent);
    setShowAgentModal(false);
    setPendingProposal(null);
    setPendingProposalId(null);
    toolConversationRef.current = false;
    initializeGemini(selectedAgent, userProfile, activeProgram, recentWorkoutsRef.current, recentModificationsRef.current, messagesRef.current);
    // Add system message for agent switch
    setMessages(prev => [
      ...prev,
      { type: "system", text: `AGENT SWITCHED: ${agentData[selectedAgent].name} — ${agentData[selectedAgent].title}`, timestamp: getTimestamp() },
      { type: "ai", text: getAgentWelcome(selectedAgent, callsign), timestamp: getTimestamp() },
    ]);
    // Persist to Firestore
    if (user) {
      updateDocument(`users/${user.uid}/personalization/data`, { selectedAgent }).catch(console.warn);
    }
  };

  return (
    <div className="bg-black w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#ff6600] flex items-center justify-between shrink-0">
        <div className="flex-1">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
            Neural Interface
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[18px] text-[#ff6600] font-bold uppercase tracking-wider">
            Command Channel
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="mt-1 font-['JetBrains_Mono',monospace] text-[9px] text-white/60 hover:text-[#ff6600] uppercase tracking-wide transition-colors flex items-center gap-1"
          >
            <span>Agent: {agentData[currentAgent].name}</span>
            <span className="text-[#ff6600]">▸</span>
          </button>
        </div>
        <Link
          to="/app"
          className="size-10 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-3 border-b border-white/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 bg-[#ff6600] animate-pulse" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
              Online · {agentData[currentAgent].name} Active
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                setMessages([
                  { type: "system", text: "TERMINAL CLEARED — HISTORY PURGED", timestamp: now },
                  { type: "ai", text: getAgentWelcome(currentAgent, callsign), timestamp: now },
                ]);
                // Clear persisted history
                localStorage.removeItem("stride_chat_history");
                if (user) {
                  deleteDocument(`users/${user.uid}/chatHistory/latest`).catch(() => {});
                }
                // Re-initialize Gemini sessions (fresh context)
                if (userProfile) {
                  initializeGemini(currentAgent, userProfile, activeProgram, recentWorkoutsRef.current, recentModificationsRef.current);
                }
              }}
              className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase tracking-wide hover:text-[#ff6600] transition-colors"
              title="Clear chat history"
            >
              [CLR]
            </button>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
              Alignment: {getBehaviorState().alignmentScore}
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
            {message.type === 'system' && (
              <div className="border-l-2 border-[#ff6600] pl-3 py-2">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-1">
                  {message.timestamp} • SYS
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'ai' && (
              <div className="border border-white/20 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-2">
                  {message.timestamp} • AGENT
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed">
                  {message.text}
                </div>

                {/* Program data view */}
                {message.programData && (
                  <div className="border-t border-white/10 pt-3 mt-3 space-y-3">
                    <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
                      → {message.programData.name}
                    </div>
                    {message.programData.weeks.map((week) => (
                      <div key={week.weekNumber}>
                        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase tracking-wider mb-1.5">
                          Week {week.weekNumber}
                        </div>
                        {week.days.map((day) => (
                          <div key={day.dayNumber} className="mb-2 ml-2">
                            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600]/80 uppercase tracking-wide mb-1">
                              Day {day.dayNumber} — {day.name}
                            </div>
                            <div className="space-y-1">
                              {day.exercises.map((ex, i) => (
                                <div key={i} className="flex items-center justify-between text-[8px] border-b border-white/5 pb-0.5">
                                  <span className="font-['JetBrains_Mono',monospace] text-white/70">
                                    [{(i + 1).toString().padStart(2, '0')}] {ex.name}
                                  </span>
                                  <span className="font-['JetBrains_Mono',monospace] text-white/50">
                                    {ex.sets}x{ex.reps} • {ex.rest}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bonus workout preview + start button */}
                {message.bonusWorkout && (
                  <div className="border-t border-[#ff6600]/30 pt-3 mt-3">
                    <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider mb-2">
                      → {message.bonusWorkout.name}
                    </div>
                    <div className="space-y-1 mb-3">
                      {message.bonusWorkout.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-[8px] border-b border-white/5 pb-0.5">
                          <span className="font-['JetBrains_Mono',monospace] text-white/70">
                            [{(i + 1).toString().padStart(2, '0')}] {ex.name}
                          </span>
                          <span className="font-['JetBrains_Mono',monospace] text-white/50">
                            {ex.sets}x{ex.reps} • {ex.rest}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem("stride_bonus_workout", JSON.stringify(message.bonusWorkout));
                        navigate("/app");
                      }}
                      className="w-full border border-[#ff6600] bg-[#ff6600]/10 py-2 font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider hover:bg-[#ff6600] hover:text-black transition-colors"
                    >
                      Start Bonus Calibration →
                    </button>
                  </div>
                )}
              </div>
            )}

            {message.type === 'plan' && (
              <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-2">
                  {message.timestamp} • PROTOCOL GENERATED
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed mb-3">
                  {message.text}
                </div>

                {/* Next Day Preview */}
                <div className="border-t border-[#ff6600]/30 pt-3 mt-2">
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider mb-2">
                    → Tomorrow's Sequence
                  </div>
                  <div className="space-y-2">
                    {message.planData?.exercises.map((exercise, i) => (
                      <div key={i} className="flex items-center justify-between text-[9px] border-b border-white/10 pb-1.5">
                        <span className="font-['JetBrains_Mono',monospace] text-white/80">
                          [{(i + 1).toString().padStart(2, '0')}] {exercise.name}
                        </span>
                        <span className="font-['JetBrains_Mono',monospace] text-white/60">
                          {exercise.sets}x{exercise.reps} • {exercise.rest}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {message.type === 'proposal' && (
              <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-2">
                  {message.timestamp} • PROPOSED MODIFICATION
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed mb-3">
                  {message.text}
                </div>

                {/* Exercise preview table */}
                <div className="border-t border-[#ff6600]/30 pt-3 mt-2">
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider mb-2">
                    → Exercise Preview
                  </div>
                  <div className="space-y-2">
                    {message.planData?.exercises.map((exercise, i) => {
                      // Show day label header when it changes
                      const prevDay = i > 0 ? message.planData!.exercises[i - 1].dayLabel : null;
                      const showDayHeader = exercise.dayLabel && exercise.dayLabel !== prevDay;
                      return (
                        <div key={i}>
                          {showDayHeader && (
                            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600]/80 uppercase tracking-wide mt-2 mb-1 pt-1 border-t border-white/5">
                              {exercise.dayLabel}
                            </div>
                          )}
                          <div
                            className={`flex items-center justify-between text-[9px] border-b border-white/10 pb-1.5 ${
                              exercise.changed ? "border-l-2 border-l-[#ff6600] pl-2" : ""
                            } ${exercise.replacing ? "border-l-2 border-l-red-500/60 pl-2 opacity-70" : ""}`}
                          >
                            <span className="font-['JetBrains_Mono',monospace] text-white/80 flex items-center gap-1.5">
                              {exercise.name}
                              {exercise.changed && (
                                <span className="text-[7px] text-black bg-[#ff6600] px-1 py-0.5 font-bold">NEW</span>
                              )}
                              {exercise.replacing && (
                                <span className="text-[7px] text-white/50 bg-red-500/30 px-1 py-0.5 font-bold">REPLACE</span>
                              )}
                            </span>
                            <span className="font-['JetBrains_Mono',monospace] text-white/60">
                              {exercise.sets}x{exercise.reps} • {exercise.rest}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm/Reject buttons — only shown for the matching active proposal */}
                {pendingProposal && message.proposalId && message.proposalId === pendingProposalId && (
                  <div className="flex gap-3 pt-3 mt-3 border-t border-[#ff6600]/30">
                    <button
                      onClick={handleRejectAction}
                      disabled={isThinking}
                      className="flex-1 border border-white/30 py-2 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <span className="font-['JetBrains_Mono',monospace] text-[9px] text-white/70 uppercase tracking-wide">
                        Reject
                      </span>
                    </button>
                    <button
                      onClick={handleConfirmAction}
                      disabled={isThinking}
                      className="flex-1 border-2 border-[#ff6600] bg-[#ff6600]/10 py-2 hover:bg-[#ff6600]/20 transition-colors disabled:opacity-50"
                    >
                      <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide font-bold">
                        {isThinking ? "Executing..." : "Confirm"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {message.type === 'user' && (
              <div className="bg-[#ff6600]/10 border border-[#ff6600]/50 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600]/70 uppercase tracking-wider mb-2">
                  {message.timestamp} • INPUT
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'friction' && (
              <div className="border-l-[3px] border-[#ff6600] bg-[#ff6600]/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider mb-2">
                  {message.timestamp} • CALIBRATED FRICTION
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white leading-[1.6]">
                  {message.text}
                </div>
              </div>
            )}

            {message.type === 'pattern' && (
              <div className="border border-white/30 bg-white/5 p-3">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase tracking-wider mb-2">
                  {message.timestamp} • PATTERN ANALYSIS
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/90 leading-relaxed whitespace-pre-line">
                  {message.text}
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Thinking indicator */}
        {isThinking && (
          <div className="mr-6">
            <div className="border border-white/20 p-3">
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-2">
                {getTimestamp()} • AGENT
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] animate-pulse">
                Processing...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands - Compact */}
      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            "Show my program",
            "Recalibrate plan",
            "Report completion",
            "Check streak",
            "High fatigue",
            "Pain/injury"
          ].map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCommand(cmd)}
              className="border border-white/20 px-2.5 py-1.5 text-left hover:border-[#ff6600] hover:bg-[#ff6600]/10 transition-colors whitespace-nowrap shrink-0"
            >
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/70 flex items-center gap-1.5">
                <span className="text-[#ff6600]">&gt;</span>
                {cmd}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input - Fixed at Bottom */}
      <div className="p-4 border-t-2 border-[#ff6600] shrink-0 bg-black">
        <div className="flex items-center gap-2 border border-white/30 p-3">
          <span className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600]">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            placeholder="Enter command..."
            className="flex-1 bg-transparent font-['JetBrains_Mono',monospace] text-[11px] text-white outline-none placeholder:text-white/40"
            disabled={isThinking || !!pendingProposal}
          />
          <button
            data-agent-send
            onClick={handleSend}
            disabled={isThinking || !!pendingProposal}
            className="border border-[#ff6600] px-3 py-1 hover:bg-[#ff6600]/20 transition-colors disabled:opacity-50"
          >
            <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
              Send
            </span>
          </button>
        </div>
      </div>

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Scanline effect */}
          <Scanline />

          <div className="relative bg-black border-2 border-[#ff6600] p-6 w-full max-w-[340px] max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-white/20">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-1">
                System Configuration
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[16px] text-[#ff6600] font-bold uppercase tracking-wider">
                Select Training Agent
              </div>
            </div>

            {/* Agent Options */}
            <div className="space-y-4 mb-6">
              {Object.keys(agentData).map((agentKey) => {
                const agent = agentKey as Agent;
                const agentInfo = agentData[agent];
                return (
                  <button
                    key={agent}
                    onClick={() => handleAgentChange(agent)}
                    className={`relative w-full bg-white/5 border p-4 flex items-start gap-3 transition-all text-left ${
                      selectedAgent === agent
                        ? "border-[#ff6600] bg-[#ff6600]/10"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div className="shrink-0 mt-0.5">
                      {selectedAgent === agent ? <CheckCircle /> : <EmptyCircle />}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600] font-bold uppercase tracking-wide mb-1">
                        {agentInfo.name} - {agentInfo.title}
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/70 leading-relaxed">
                        {agentInfo.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => setShowAgentModal(false)}
                className="flex-1 border border-white/30 py-2.5 hover:bg-white/5 transition-colors"
              >
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white/70 uppercase tracking-wide">
                  Cancel
                </span>
              </button>
              <button
                onClick={confirmAgentChange}
                className="flex-1 border-2 border-[#ff6600] bg-[#ff6600]/10 py-2.5 hover:bg-[#ff6600]/20 transition-colors"
              >
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wide font-bold">
                  Confirm
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
