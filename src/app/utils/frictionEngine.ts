// STRIDE Calibrated Friction Engine
// Detects contradictions between stated intent and observed behavior
// Delivers calibrated friction responses (10-15% of eligible cases)
// For agents Atlas, Orion, and Kade

import { getBehaviorState } from "./behaviorStore";

// ============================================================
// CONTRADICTION DETECTORS
// ============================================================

export type DetectorFlag = "GBC" | "DP" | "RL" | "CM" | "SB" | null;

export interface DetectionResult {
  flag: DetectorFlag;
  severity: "soft" | "hard" | null;
  description: string;
}

// A. Goal-Behavior Conflict (GBC)
function detectGoalBehaviorConflict(): DetectionResult {
  const state = getBehaviorState();
  const completionRate7d =
    state.workoutsCompletedThisWeek /
    Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1);
  const completionRate14d =
    state.workoutsCompleted14d /
    Math.max(state.workoutsCompleted14d + state.workoutsSkipped14d, 1);

  if (completionRate14d < 0.55 || state.workoutsSkipped14d >= 4) {
    return {
      flag: "GBC",
      severity: "hard",
      description: `Goal: ${state.primaryGoal}. 14-day completion rate: ${Math.round(completionRate14d * 100)}%.`,
    };
  }

  if (completionRate7d < 0.6 || state.workoutsSkippedThisWeek >= 2) {
    return {
      flag: "GBC",
      severity: "soft",
      description: `Goal: ${state.primaryGoal}. 7-day completion rate: ${Math.round(completionRate7d * 100)}%.`,
    };
  }

  return { flag: null, severity: null, description: "" };
}

// B. Delay Pattern (DP)
function detectDelayPattern(): DetectionResult {
  const state = getBehaviorState();

  if (state.hesitationEvents7d >= 3 || state.delayLanguageCount7d >= 2) {
    return {
      flag: "DP",
      severity: state.hesitationEvents7d >= 5 ? "hard" : "soft",
      description: `${state.hesitationEvents7d} hesitation events, ${state.delayLanguageCount7d} delay expressions this week.`,
    };
  }

  return { flag: null, severity: null, description: "" };
}

// C. Reset Loop (RL)
function detectResetLoop(): DetectionResult {
  const state = getBehaviorState();

  if (state.resetEvents14d >= 2 || state.resetEvents30d >= 3) {
    return {
      flag: "RL",
      severity: state.resetEvents14d >= 3 ? "hard" : "soft",
      description: `${state.resetEvents14d} resets in 14 days, ${state.resetEvents30d} in 30 days.`,
    };
  }

  return { flag: null, severity: null, description: "" };
}

// D. Constraint Mismatch (CM)
function detectConstraintMismatch(): DetectionResult {
  const state = getBehaviorState();

  // Rule-based checks
  if (
    state.equipmentAccess === "none" &&
    (state.primaryGoal === "strength" || state.primaryGoal === "hypertrophy")
  ) {
    return {
      flag: "CM",
      severity: "soft",
      description: "No equipment access conflicts with strength/hypertrophy goal.",
    };
  }

  if (state.timePerSession <= 15 && state.primaryGoal === "sport performance") {
    return {
      flag: "CM",
      severity: "soft",
      description: "15-minute sessions conflict with sport performance demands.",
    };
  }

  return { flag: null, severity: null, description: "" };
}

// E. Safety/Stress Blockers (SB)
function checkSafetyBlockers(): boolean {
  const state = getBehaviorState();
  return state.injuryFlag || state.burnoutFlag;
}

// Run all detectors
function runDetectors(): DetectionResult[] {
  if (checkSafetyBlockers()) {
    return [{ flag: "SB", severity: null, description: "Safety blocker active. Friction suppressed." }];
  }

  const results: DetectionResult[] = [];
  const gbc = detectGoalBehaviorConflict();
  const dp = detectDelayPattern();
  const rl = detectResetLoop();
  const cm = detectConstraintMismatch();

  if (gbc.flag) results.push(gbc);
  if (dp.flag) results.push(dp);
  if (rl.flag) results.push(rl);
  if (cm.flag) results.push(cm);

  return results;
}

// ============================================================
// FRICTION RESPONSE LIBRARY (36 lines)
// ============================================================

const GENERAL_FRICTION = [
  "Your stated priority and recent actions diverge.",
  "This explanation matches resistance more than limitation.",
  "Evidence suggests a different pattern than the one you described.",
  "Restarting can be another form of delay.",
  "You're negotiating. That's the signal.",
  "This is a choice point. Confirm direction.",
  "If you continue this pattern, results follow it.",
  "The system can adapt. Avoidance cannot.",
  "Are we recalibrating, or retreating?",
  "Name the constraint: capacity or comfort?",
];

const GBC_FRICTION = [
  "Your goal requires consistency. Your log shows drift.",
  "You selected strength. Your actions suggest avoidance of load.",
  "You selected hypertrophy. Missed sessions reduce the stimulus.",
  "Conditioning improves through repetition, not intention.",
  "Sport performance demands specificity. Your week lacked it.",
  "Your goal is valid. Your pattern is not aligned yet.",
];

const DP_FRICTION = [
  '"Tomorrow" becomes a system if repeated.',
  "Delay is not rest. It's deferral.",
  "If you wait to feel ready, you train rarely.",
  "Start small now or postpone indefinitely?",
  "One set today breaks the delay loop.",
  "The first step is the barrier.",
];

const RL_FRICTION = [
  "You don't need a restart. You need continuation.",
  "Resetting feels clean. Progress is messy.",
  "Rewriting the plan avoids executing the plan.",
  "Keep the structure. Adjust intensity instead.",
  "Resetting again will not change the pattern.",
  "Continue from where you are.",
];

const CM_FRICTION = [
  "This selection conflicts with your equipment access.",
  "This timeline conflicts with your available time.",
  "We can match your constraints, but you must accept tradeoffs.",
  "Confirm: do you want realism or idealism?",
];

// Get friction response for a specific detector flag
function getFrictionResponse(flag: DetectorFlag): string {
  let pool: string[];

  switch (flag) {
    case "GBC":
      pool = [...GBC_FRICTION, ...GENERAL_FRICTION];
      break;
    case "DP":
      pool = [...DP_FRICTION, ...GENERAL_FRICTION];
      break;
    case "RL":
      pool = [...RL_FRICTION, ...GENERAL_FRICTION];
      break;
    case "CM":
      pool = [...CM_FRICTION, ...GENERAL_FRICTION];
      break;
    default:
      pool = GENERAL_FRICTION;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// FRICTION ELIGIBILITY & RATE LIMITER
// ============================================================

export interface FrictionDecision {
  eligible: boolean;
  flag: DetectorFlag;
  response: string;
  agent: "atlas" | "orion" | "kade";
  reason: string;
}

export function shouldDeliverFriction(): FrictionDecision {
  const state = getBehaviorState();
  const detections = runDetectors();

  // No detections or safety blocker active
  if (detections.length === 0 || detections.some((d) => d.flag === "SB")) {
    return {
      eligible: false,
      flag: null,
      response: "",
      agent: "atlas",
      reason: "No triggers or safety blocker active.",
    };
  }

  // Don't deliver friction to users who haven't completed any workouts yet
  if (state.totalWorkoutsCompleted === 0) {
    return {
      eligible: false,
      flag: null,
      response: "",
      agent: "atlas",
      reason: "New user — no friction before first workout.",
    };
  }

  // High-alignment users: only allow hard-severity detections through
  if (state.alignmentScore >= 75) {
    const hasHardDetection = detections.some((d) => d.severity === "hard");
    if (!hasHardDetection) {
      return {
        eligible: false,
        flag: null,
        response: "",
        agent: "atlas",
        reason: "Alignment score above threshold, no hard detections.",
      };
    }
  }

  // Rate limiter: Max 1 per 10 agent interactions
  if (
    state.totalAgentInteractions > 0 &&
    state.frictionCountInSession > 0 &&
    state.totalAgentInteractions % 10 !== 0
  ) {
    const rate = state.frictionCountInSession / Math.max(state.totalAgentInteractions, 1);
    if (rate > 0.15) {
      return {
        eligible: false,
        flag: null,
        response: "",
        agent: "atlas",
        reason: "Rate limit: friction rate exceeds 15%.",
      };
    }
  }

  // Max 1 friction per 4 hours (allows ~2-3 per day for active users)
  const hoursSinceLastFriction = (Date.now() - state.lastFrictionTimestamp) / (1000 * 60 * 60);
  if (state.lastFrictionTimestamp > 0 && hoursSinceLastFriction < 4) {
    return {
      eligible: false,
      flag: null,
      response: "",
      agent: "atlas",
      reason: "Rate limit: less than 4 hours since last friction.",
    };
  }

  // Never two in a row
  if (state.consecutiveFrictionCount >= 1) {
    return {
      eligible: false,
      flag: null,
      response: "",
      agent: "atlas",
      reason: "Rate limit: consecutive friction blocked.",
    };
  }

  // 10-15% probability gate
  if (Math.random() > 0.125) {
    return {
      eligible: false,
      flag: null,
      response: "",
      agent: "atlas",
      reason: "Probability gate: not selected for friction this time.",
    };
  }

  // Select primary detection
  const primaryDetection = detections[0];
  const response = getFrictionResponse(primaryDetection.flag);

  // Route to appropriate agent
  const agent = routeToAgent(primaryDetection.flag);

  return {
    eligible: true,
    flag: primaryDetection.flag,
    response,
    agent,
    reason: primaryDetection.description,
  };
}

// ============================================================
// AGENT ROUTING
// ============================================================

function routeToAgent(flag: DetectorFlag): "atlas" | "orion" | "kade" {
  switch (flag) {
    case "GBC":
      return "atlas"; // consistency / missed sessions / baseline integrity
    case "CM":
      return "orion"; // pattern mismatch / constraints / recalibration
    case "DP":
      return "kade"; // hesitation / execution / starting now
    case "RL":
      return "orion"; // recalibration
    default:
      return "atlas";
  }
}
