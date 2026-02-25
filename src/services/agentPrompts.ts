// STRIDE Agent System Prompts
// Builds dynamic system prompts for Atlas, Orion, and Kade
// Injects behavioral state, user profile, and conversation mode context

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
  } | null;
  conversationMode?: string;
  frictionFlag?: DetectorFlag;
}

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

const BASE_INSTRUCTIONS = `Respond in 1-3 sentences max. Use a military-ops tone with the STRIDE aesthetic.
Never break character. Never use emojis. Never be overly verbose.
If the operator asks about adjusting their program, provide specific exercise recommendations.
If the operator reports pain or injury, immediately acknowledge it and recommend caution — never push through injury.
Do not reference that you are an AI, LLM, or language model. You are a training agent within the STRIDE system.`;

export function buildSystemPrompt(agent: AgentId, context: AgentContext): string {
  const parts: string[] = [
    AGENT_PERSONALITIES[agent],
    "",
    BASE_INSTRUCTIONS,
  ];

  // Inject behavioral state
  const bs = context.behaviorState;
  parts.push("");
  parts.push("CURRENT OPERATOR STATE:");
  parts.push(`- Streak: ${bs.streakDays} days`);
  parts.push(`- Alignment score: ${bs.alignmentScore}/100`);
  parts.push(`- Workouts this week: ${bs.workoutsCompletedThisWeek} completed, ${bs.workoutsSkippedThisWeek} skipped`);
  parts.push(`- Total workouts completed: ${bs.totalWorkoutsCompleted}`);
  parts.push(`- Consecutive missed sessions: ${bs.consecutiveMissedSessions}`);

  // Inject user profile if available
  if (context.userProfile) {
    const p = context.userProfile;
    parts.push("");
    parts.push("OPERATOR PROFILE:");
    if (p.optimizationGoal) parts.push(`- Goal: ${p.optimizationGoal}`);
    if (p.experience) parts.push(`- Experience: ${p.experience}`);
    if (p.sessionTime) parts.push(`- Session time: ${p.sessionTime}`);
    if (p.equipmentAccess) parts.push(`- Equipment: ${p.equipmentAccess}`);
    if (p.trainingFocuses?.length) parts.push(`- Focus areas: ${p.trainingFocuses.join(", ")}`);
    if (p.constraints?.length) parts.push(`- Constraints: ${p.constraints.join(", ")}`);
  }

  // Inject conversation mode context
  if (context.conversationMode) {
    parts.push("");
    parts.push(`ACTIVE MODE: ${context.conversationMode.toUpperCase()}`);

    switch (context.conversationMode) {
      case "clarification":
        parts.push("The operator is expressing confusion, doubt, or hesitation. Respond with calm interrogation — ask what specifically is the barrier.");
        break;
      case "patternReflection":
        parts.push("Share an observation about the operator's behavioral patterns. Be observational, not preachy.");
        break;
      case "identityFraming":
        parts.push("The operator has completed something or reported success. Reinforce their identity as someone who executes. Keep it minimal.");
        break;
      case "escalation":
        parts.push("The operator has shown repeated avoidance. Increase firmness subtly. Never aggressive, but heightened clarity.");
        break;
    }
  }

  // Inject friction context if active
  if (context.frictionFlag) {
    parts.push("");
    parts.push(`FRICTION ACTIVE: The operator has shown contradictory behavior (${context.frictionFlag}).`);
    parts.push("Deliver a short, calibrated identity-challenging message that highlights the gap between stated intent and observed behavior.");
    parts.push("Do NOT be cruel or demeaning. Be precise and direct.");
  }

  return parts.join("\n");
}

/** Get a welcome message for when the chat opens with a given agent */
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
