import { Link } from "react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import svgPaths from "../../imports/svg-oe8cws8da9";
import { getAgentResponse, containsDelayLanguage, containsResetLanguage } from "../utils/agentLayer";
import { shouldDeliverFriction } from "../utils/frictionEngine";
import { recordAgentInteraction, recordDelayLanguage, recordResetEvent, getBehaviorState, calculateAlignmentScore } from "../utils/behaviorStore";
import { buildSystemPrompt, getAgentWelcome, type AgentId, type AgentContext } from "../../services/agentPrompts";
import { useAuth } from "../contexts/AuthContext";
import { getDocument, updateDocument, queryCollection, where } from "../../services/firestore";
import { detectMode } from "../utils/agentLayer";
import { createAgentModel, startAgentChat, type ChatSession, type GenerativeModel, type LLMMessage } from "../../services/gemini";
import { executeAction, type ActionProposal } from "../../services/agentActions";
import type { Program } from "../../services/programGenerator";
import type { EnhancedGenerateContentResponse } from "firebase/ai";

/** Safely extract text from a Gemini response — returns empty string on failure */
function safeText(response: EnhancedGenerateContentResponse): string {
  try {
    return response.text()?.trim() || "";
  } catch {
    return "";
  }
}

interface ProgramWeekData {
  weekNumber: number;
  days: Array<{
    dayNumber: number;
    name: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
    }>;
  }>;
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
    }>;
  };
  programData?: {
    name: string;
    weeks: ProgramWeekData[];
  };
  proposalId?: string;
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

export default function AIAgent() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent>("atlas");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(currentAgent);
  const [userProfile, setUserProfile] = useState<AgentContext["userProfile"]>(null);
  const [conversationHistory, setConversationHistory] = useState<LLMMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "system",
      text: "COMMAND CHANNEL ESTABLISHED",
      timestamp: "09:41"
    },
    {
      type: "ai",
      text: "Initializing agent...",
      timestamp: "09:41"
    }
  ]);

  // Gemini state
  const [geminiModel, setGeminiModel] = useState<GenerativeModel | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ActionProposal | null>(null);
  const [activeProgram, setActiveProgram] = useState<(Program & { id: string }) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Build context and initialize Gemini model
  const initializeGemini = useCallback((
    agent: Agent,
    profile: AgentContext["userProfile"],
    program: (Program & { id: string }) | null,
  ) => {
    try {
      const behaviorState = getBehaviorState();
      const context: AgentContext = {
        behaviorState,
        userProfile: profile,
        activeProgram: program ? {
          name: program.name,
          currentWeek: program.weeks[0]?.weekNumber ?? 1,
          currentDay: program.weeks[0]?.days[0]?.name ?? "Day 1",
          totalWeeks: program.weeks.length,
        } : null,
      };
      const systemPrompt = buildSystemPrompt(agent as AgentId, context);
      const model = createAgentModel(systemPrompt);
      const session = startAgentChat(model);
      setGeminiModel(model);
      setChatSession(session);
      return session;
    } catch (err) {
      console.warn("[AIAgent] Gemini init failed:", err);
      setGeminiModel(null);
      setChatSession(null);
      return null;
    }
  }, []);

  // Load agent + profile + active program from Firestore on mount
  useEffect(() => {
    if (!user || initRef.current) return;
    initRef.current = true;

    calculateAlignmentScore();

    const loadData = async () => {
      let profile: AgentContext["userProfile"] = null;
      let program: (Program & { id: string }) | null = null;
      let agent: Agent = "atlas";

      try {
        const data = await getDocument<Record<string, unknown>>(`users/${user.uid}/personalization/data`);
        if (data) {
          profile = {
            optimizationGoal: data.optimizationGoal as string,
            experience: data.experience as string,
            constraints: data.constraints as string[],
            sessionTime: data.sessionTime as string,
            trainingFocuses: data.trainingFocuses as string[],
            equipmentAccess: data.equipmentAccess as string,
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

      // Load active program
      try {
        const programs = await queryCollection<Program & { id: string; active: boolean }>(
          `users/${user.uid}/programs`,
          [where("active", "==", true)]
        );
        if (programs[0]) {
          program = programs[0];
          setActiveProgram(program);
        }
      } catch (err) {
        console.warn("Failed to load active program:", err);
      }

      // Initialize Gemini with full context
      initializeGemini(agent, profile, program);

      // Set welcome messages
      setMessages([
        { type: "system", text: "COMMAND CHANNEL ESTABLISHED", timestamp: getTimestamp() },
        { type: "ai", text: getAgentWelcome(agent), timestamp: getTimestamp() },
      ]);
    };

    loadData();
  }, [user, initializeGemini]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

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
      handleTemplateFallback(userInput);
    } finally {
      setIsThinking(false);
    }
  };

  /** Primary: Gemini via Firebase AI Logic with function calling */
  const handleGeminiSend = async (userInput: string) => {
    let session = chatSession;

    // Reinitialize if no session
    if (!session) {
      session = initializeGemini(currentAgent, userProfile, activeProgram);
      if (!session) throw new Error("Gemini init failed");
    }

    const result = await session.sendMessage(userInput);
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // Handle function call
      const fc = functionCalls[0];
      const args = (fc.args as Record<string, unknown>) ?? {};

      const actionResult = await executeAction(fc.name, args, user!.uid);

      if (actionResult.type === "data") {
        // Read action — send result back to Gemini for summary
        const followUp = await session.sendMessage([{
          functionResponse: {
            name: fc.name,
            response: actionResult.data,
          },
        }]);

        const text = safeText(followUp.response) || "Here's your current protocol data.";

        // For getActiveProgram, attach structured program data to the message
        if (fc.name === "getActiveProgram" && actionResult.data.found && actionResult.data.weeks) {
          const msg: Message = {
            type: "ai",
            text,
            timestamp: getTimestamp(),
            programData: {
              name: actionResult.data.name as string,
              weeks: actionResult.data.weeks as ProgramWeekData[],
            },
          };
          setMessages(prev => [...prev, msg]);
        } else {
          addAgentMessage(text);
        }
      } else {
        // Write action — show proposal for user confirmation
        const proposal = actionResult.proposal;
        setPendingProposal(proposal);

        // Add proposal message with exercise preview
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
            })),
          },
          proposalId: `proposal-${Date.now()}`,
        };
        setMessages(prev => [...prev, proposalMsg]);
      }
    } else {
      // Plain text response
      const text = safeText(response);
      if (!text) throw new Error("Empty Gemini response");
      const mode = detectMode(userInput);
      addAgentMessage(text, mode);
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

  const deliverFriction = () => {
    const frictionDecision = shouldDeliverFriction();
    if (frictionDecision.eligible) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: "friction",
          text: frictionDecision.response,
          timestamp: getTimestamp(),
          mode: `friction:${frictionDecision.flag}`,
        }]);

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
    if (!pendingProposal || !chatSession) return;
    setIsThinking(true);

    try {
      // Execute the Firestore write
      await pendingProposal.execute();

      // Send success back to Gemini so it can confirm in character
      const followUp = await chatSession.sendMessage([{
        functionResponse: {
          name: pendingProposal.actionName,
          response: { success: true, message: "Changes applied successfully." },
        },
      }]);

      const text = safeText(followUp.response) || "Protocol updated. Changes applied.";
      addAgentMessage(text);

      // System confirmation
      setMessages(prev => [...prev, {
        type: "system",
        text: "PROTOCOL UPDATED",
        timestamp: getTimestamp(),
      }]);

      // Refresh active program
      if (user) {
        const programs = await queryCollection<Program & { id: string; active: boolean }>(
          `users/${user.uid}/programs`,
          [where("active", "==", true)]
        );
        if (programs[0]) setActiveProgram(programs[0]);
      }
    } catch (err) {
      console.warn("[AIAgent] Confirm action failed:", err);
      setMessages(prev => [...prev, {
        type: "system",
        text: "ACTION FAILED — protocol unchanged",
        timestamp: getTimestamp(),
      }]);
    } finally {
      setPendingProposal(null);
      setIsThinking(false);
    }
  };

  /** Reject a pending write action proposal */
  const handleRejectAction = async () => {
    if (!pendingProposal) return;

    try {
      if (chatSession) {
        const followUp = await chatSession.sendMessage([{
          functionResponse: {
            name: pendingProposal.actionName,
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
    }
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
    inputRef.current?.focus();
  };

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const confirmAgentChange = () => {
    setCurrentAgent(selectedAgent);
    setShowAgentModal(false);
    // Clear conversation history + recreate Gemini session
    setConversationHistory([]);
    setPendingProposal(null);
    initializeGemini(selectedAgent, userProfile, activeProgram);
    // Add system message for agent switch
    setMessages(prev => [
      ...prev,
      { type: "system", text: `AGENT SWITCHED: ${agentData[selectedAgent].name} — ${agentData[selectedAgent].title}`, timestamp: getTimestamp() },
      { type: "ai", text: getAgentWelcome(selectedAgent), timestamp: getTimestamp() },
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
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
            Alignment: {getBehaviorState().alignmentScore}
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
                    {message.planData?.exercises.map((exercise, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between text-[9px] border-b border-white/10 pb-1.5 ${
                          exercise.changed ? "border-l-2 border-l-[#ff6600] pl-2" : ""
                        }`}
                      >
                        <span className="font-['JetBrains_Mono',monospace] text-white/80 flex items-center gap-1.5">
                          [{(i + 1).toString().padStart(2, '0')}] {exercise.name}
                          {exercise.changed && (
                            <span className="text-[7px] text-black bg-[#ff6600] px-1 py-0.5 font-bold">NEW</span>
                          )}
                        </span>
                        <span className="font-['JetBrains_Mono',monospace] text-white/60">
                          {exercise.sets}x{exercise.reps} • {exercise.rest}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm/Reject buttons — only shown for active proposal */}
                {pendingProposal && message.proposalId && (
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
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={isThinking}
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
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
              backgroundSize: "100% 4px",
            }}
          />

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
