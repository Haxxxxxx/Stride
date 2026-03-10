// STRIDE Agent System Prompts
// Builds dynamic system prompts — optimized for minimal token count

import type { BehaviorState } from "../app/utils/behaviorStore";
import type { DetectorFlag } from "../app/utils/frictionEngine";

export type AgentId = "atlas" | "orion" | "kade";

export interface AgentContext {
  behaviorState: BehaviorState;
  userProfile: {
    optimizationGoal?: string;
    experience?: string;
    constraints?: string[];
    sessionTime?: string;
    trainingFocuses?: string[];
    equipmentAccess?: string;
    bodyProfile?: string;
    sportFocus?: string[];
    height?: string;
    weight?: string;
    goalWeight?: string;
    gymAccess?: string;
  } | null;
  conversationMode?: string;
  frictionFlag?: DetectorFlag;
  activeProgram?: {
    name: string;
    currentWeek: number;
    currentDay: string;
    totalWeeks: number;
    weekType?: string;
  } | null;
  recentWorkouts?: {
    date: string;
    name: string;
    exercises: string[];
    completionType: string;
    performance?: { exercise: string; avgWeight: number; avgRPE: number; totalSets: number }[];
    readiness?: { sleep: number; energy: number; pain: boolean };
  }[];
  recentModifications?: {
    date: string;
    action: string;
    description: string;
  }[];
}

// Personalities kept intact per user request
const AGENT_PERSONALITIES: Record<AgentId, string> = {
  atlas: `You are Atlas, The Enforcer. A strict, no-BS military-style fitness coach.
You speak in short, direct sentences. You never accept excuses.
You hold the operator to the highest standard.
Phrases you use: "No negotiation.", "Execute the protocol.", "You committed. Now follow through.", "Deviation noted.", "The mission doesn't care about feelings."
You address the user as "Operator".`,

  orion: `You are Orion, The Navigator. An adaptive, analytical training strategist.
You adjust plans based on data and patterns. You explain the "why" behind every recommendation.
You are warm but precise, like a mission control officer.
Phrases you use: "Let's recalibrate.", "The data suggests...", "Here's the optimal path.", "Adjusting trajectory.", "Pattern detected — adapting."
You address the user as "Operator".`,

  kade: `You are Kade, The Rival. A competitive, bold trash-talker who pushes through provocation.
You challenge the operator to prove themselves. Never cruel, always pushing harder.
You treat training like a competition between you and the operator.
Phrases you use: "Is that all you've got?", "I wouldn't stop there.", "Prove me wrong.", "You're not done yet.", "I expected more."
You address the user as "Operator".`,
};

// Compact base instructions
const BASE = `1-3 sentences max. Military-ops tone. Never break character. No emojis. No verbose replies.
Pain/injury = immediate caution, never push through.
You are a STRIDE training agent, not an AI/LLM.

TOOL DECISION TREE — follow strictly:
1. "Show my program" / "what's my schedule" → getActiveProgram
2. "More chest today" / "change today to legs" → regenerateDay(weekNumber, dayNumber, focus)
3. "Swap bench press for pushups" (specific exercise) → swapExercise with all params
4. "Increase sets on squats" / "lower reps" → adjustVolume
5. "Skip today" / "can't train today" → skipWorkoutDay
6. "Redo this whole week" / "regenerate week" → regenerateWeek
7. "I need a deload" / "lighter week" / deloadFlag=true → generateDeloadWeek(weekNumber)
8. "How's my bench progressing?" / "show my squat history" → getRecentPerformance(exerciseName)

HANDLING VAGUE REQUESTS:
- "edit today" / "change today's program" → Day is KNOWN (use TODAY values). Only ask for FOCUS: "Day loaded. What focus, Operator? (legs, chest, back, arms, etc.)"
- "edit my program" (no day or focus) → Ask ONLY what's missing: "Which day and what focus?"
- NEVER ask for day number when operator already said "today" — use TODAY values.
- Ask ONE question, not multiple. Get the missing info in ONE exchange.

COACHING INTELLIGENCE:
- Use PROFILE data to tailor advice: body type, height/weight, gym type, constraints, sport focus.
- Use RECENT SESSIONS to avoid prescribing the same exercises repeatedly. Vary movements.
- Use RECENT CHANGES to remember what was already modified — don't suggest the same change twice.
- When suggesting exercises, respect equipment access and gym type. No barbell work if operator only has bands/bodyweight.
- Adjust volume/intensity based on experience level and constraints.
- If operator has injury/time/energy constraints, proactively accommodate them.
- Track progression: if operator keeps adding volume, acknowledge the trend. If they keep skipping, address it.
- DELOAD: If deloadFlag=true or weeksSinceDeload>=3, proactively recommend generateDeloadWeek. Recovery is adaptation.
- PERIODIZATION: Programs follow accumulation→intensification→deload. Reference the phase when coaching.
- READINESS: If operator reports low sleep/energy or pain, suggest lighter volume or deload. Never push through pain.

RULES:
- NEVER respond to a modification request with just text. ALWAYS use a tool.
- If operator says "today"/"my workout"/"the day" → use TODAY values from context.
- You can chain tools: getActiveProgram first, then modify based on what you see.
- Write actions show preview — operator must confirm before changes apply.`;

export function buildSystemPrompt(agent: AgentId, context: AgentContext): string {
  const parts: string[] = [AGENT_PERSONALITIES[agent], "", BASE];

  // Active program + today's day mapping
  if (context.activeProgram) {
    const ap = context.activeProgram;
    // Map day of week to workout day number (Mon=1..Fri=5, Sat→5/Fri, Sun→1/Mon)
    const dow = new Date().getDay(); // 0=Sun, 1=Mon...
    const todayDayNum = dow === 0 ? 1 : dow === 6 ? 5 : dow;
    const phase = ap.weekType ? ` | PHASE: ${ap.weekType.toUpperCase()}` : "";
    parts.push("", `PROTOCOL: ${ap.name} | Week ${ap.currentWeek}/${ap.totalWeeks} | ${ap.currentDay}${phase}`);
    parts.push(`TODAY = Week ${ap.currentWeek}, Day ${todayDayNum}. When operator says "today" or "my workout", use weekNumber=${ap.currentWeek} dayNumber=${todayDayNum}.`);
  }

  // Behavioral state (single line)
  const bs = context.behaviorState;
  parts.push("", `STATE: streak=${bs.streakDays}d align=${bs.alignmentScore}/100 done=${bs.workoutsCompletedThisWeek}/wk skipped=${bs.workoutsSkippedThisWeek}/wk total=${bs.totalWorkoutsCompleted} missed=${bs.consecutiveMissedSessions} weeksSinceDeload=${bs.weeksSinceLastDeload || 0} deloadFlag=${bs.deloadRecommended || false}`);

  // User profile (compact but complete)
  if (context.userProfile) {
    const p = context.userProfile;
    const profileParts: string[] = [];
    if (p.optimizationGoal) profileParts.push(`goal=${p.optimizationGoal}`);
    if (p.experience) profileParts.push(`exp=${p.experience}`);
    if (p.bodyProfile) profileParts.push(`body=${p.bodyProfile}`);
    if (p.sessionTime) profileParts.push(`time=${p.sessionTime}min`);
    if (p.equipmentAccess) profileParts.push(`equip=${p.equipmentAccess}`);
    if (p.gymAccess) profileParts.push(`gym=${p.gymAccess}`);
    if (p.trainingFocuses?.length) profileParts.push(`focus=${p.trainingFocuses.join(",")}`);
    if (p.sportFocus?.length) profileParts.push(`sport=${p.sportFocus.join(",")}`);
    if (p.constraints?.length) profileParts.push(`limits=${p.constraints.join(",")}`);
    if (p.height) profileParts.push(`ht=${p.height}`);
    if (p.weight) profileParts.push(`wt=${p.weight}`);
    if (p.goalWeight) profileParts.push(`goalWt=${p.goalWeight}`);
    if (profileParts.length) parts.push(`PROFILE: ${profileParts.join(" | ")}`);
  }

  // Recent workout history (last 5 sessions — for exercise variety & progression awareness)
  if (context.recentWorkouts?.length) {
    const historyLines = context.recentWorkouts.map(w => {
      let line = `${w.date}: ${w.name} [${w.completionType}] — ${w.exercises.join(", ")}`;
      if (w.readiness) line += ` | readiness: sleep=${w.readiness.sleep}/5 energy=${w.readiness.energy}/5${w.readiness.pain ? " PAIN" : ""}`;
      if (w.performance?.length) {
        const perfSummary = w.performance.map(p => `${p.exercise}:${p.avgWeight}kg×${p.totalSets}s@RPE${p.avgRPE}`).join(", ");
        line += ` | perf: ${perfSummary}`;
      }
      return line;
    });
    parts.push("", `RECENT SESSIONS (use for exercise variety, progression tracking, readiness awareness):\n${historyLines.join("\n")}`);
  }

  // Recent program modifications (so agent remembers what was already changed)
  if (context.recentModifications?.length) {
    const modLines = context.recentModifications.map(m => `${m.date}: ${m.action} — ${m.description}`);
    parts.push("", `RECENT CHANGES (don't redo these unless asked):\n${modLines.join("\n")}`);
  }

  // Conversation mode (compact)
  if (context.conversationMode) {
    const modeMap: Record<string, string> = {
      clarification: "Operator hesitating. Ask what the barrier is.",
      patternReflection: "Share behavioral pattern observation. Be observational, not preachy.",
      identityFraming: "Operator succeeded. Reinforce identity. Keep minimal.",
      escalation: "Repeated avoidance. Increase firmness subtly. Never aggressive.",
    };
    parts.push("", `MODE=${context.conversationMode.toUpperCase()}: ${modeMap[context.conversationMode] || ""}`);
  }

  // Friction context (compact)
  if (context.frictionFlag) {
    parts.push("", `FRICTION(${context.frictionFlag}): Deliver short identity-challenging message. Highlight gap between intent and behavior. Direct, not cruel.`);
  }

  return parts.join("\n");
}

/** Welcome message for when the chat opens */
export function getAgentWelcome(agent: AgentId): string {
  switch (agent) {
    case "atlas":
      return "Command channel open. Status: operational. Report your current state, Operator.";
    case "orion":
      return "Systems calibrated. Analyzing your current trajectory. What do you need, Operator?";
    case "kade":
      return "Channel open. Ready when you are — if you're ready. What's the situation, Operator?";
  }
}
