// STRIDE Event-Based Micro-Language System
// Identity Anchoring Layer - 75 lines organized by behavioral trigger
// Rules: Rotate randomly, never repeat consecutively, max 1-3 lines, context-aware

import { getBehaviorState, updateBehaviorState } from "./behaviorStore";

// ============================================================
// 1. LOGIN TRIGGER (user opens app)
// Tone: Awareness / Intent Priming
// ============================================================
const LOGIN_MESSAGES = [
  "System active. Intent?",
  "Comfort is active. Override?",
  "What repeats reinforces.",
  "Decision precedes change.",
  "Identity is built today.",
  "Opened. Now act.",
  "Default settings degrade.",
  "Discipline is manual.",
  "The system is neutral. You are not.",
  "Enter deliberately.",
];

// ============================================================
// 2. WORKOUT START TRIGGER (user taps "Start Workout")
// Tone: Decision Reinforcement
// ============================================================
const WORKOUT_START_MESSAGES = [
  "Mood not required.",
  "Begin despite preference.",
  "Action > emotion.",
  "The body obeys direction.",
  "Execution initiated.",
  "Friction expected.",
  "This is where identity forms.",
  "Decision confirmed.",
  "Start before ready.",
  "Override engaged.",
];

// ============================================================
// 3. HESITATION TRIGGER (user opens workout but idles 30-60s)
// Tone: Pattern Interrupt (Calm Confrontation)
// ============================================================
const HESITATION_MESSAGES = [
  "Delay detected. Reason?",
  "Negotiation is active.",
  "You opened this for a reason.",
  "Avoidance is subtle.",
  "Act before analysis.",
  "Friction is here. Proceed?",
  "Comfort suggests postponement.",
  "The first rep is the barrier.",
  "Begin now.",
  "Do not overthink repetition.",
];

// ============================================================
// 4. WORKOUT COMPLETION TRIGGER (workout marked complete)
// Tone: Identity Anchoring
// ============================================================
const WORKOUT_COMPLETION_MESSAGES = [
  "Execution confirmed.",
  "You acted independent of mood.",
  "Signal > preference.",
  "Decision compounded.",
  "Capacity extended.",
  "Discipline reinforced.",
  "Threshold moved.",
  "Effort logged. Identity updated.",
  "This is structural.",
  "You followed through.",
];

// ============================================================
// 5. MISSED WORKOUT TRIGGER (scheduled workout skipped)
// Tone: Neutral Confrontation / Reflection
// ============================================================
const MISSED_WORKOUT_MESSAGES = [
  "Session skipped. Cause?",
  "Avoidance logged.",
  "Pattern deviation detected.",
  "Entropy requires no effort.",
  "Recalibrate?",
  "Interrupt the slide.",
  "One day compounds.",
  "Reset deliberately.",
  "Inconsistency observed.",
  "Do you accept this pattern?",
];

// ============================================================
// 6. STREAK MILESTONE TRIGGERS
// Tone: Pattern Stabilization
// ============================================================
const STREAK_MILESTONES: Record<number, string> = {
  3: "Early pattern forming.",
  7: "Consistency emerging.",
  14: "Repetition gaining weight.",
  21: "Identity stabilizing.",
  30: "This is no longer experimental.",
  50: "Structural discipline.",
  60: "Threshold exceeded.",
  75: "Hard to break now.",
  90: "Operating system installed.",
  100: "This is baseline.",
  180: "Half a year. Undeniable.",
  365: "One year. You are the system.",
};

// ============================================================
// 7. STREAK BROKEN TRIGGER
// Tone: Calm Re-entry
// ============================================================
const STREAK_BROKEN_MESSAGES = [
  "Pattern interrupted.",
  "Restart without drama.",
  "You are not your lapse.",
  "Resume deliberately.",
  "Consistency rebuilds quickly.",
  "Begin again.",
  "Identity is repetition, not perfection.",
];

// ============================================================
// 8. WEEKLY PATTERN INSIGHTS (every 7-14 days)
// Tone: Observational / Analytical
// ============================================================
const WEEKLY_INSIGHT_MESSAGES = [
  "You train hardest on high-energy days.",
  "Low-energy days correlate with delay.",
  "Volume increased 12% this week.",
  "Recovery lag detected mid-week.",
  "Pattern: consistency improves after 6PM.",
  "Missed sessions cluster on weekends.",
  "Strength trending upward.",
  "Execution rate: stable.",
  "Inconsistency narrowing.",
  "Adaptation visible.",
];

// ============================================================
// POST-WORKOUT NEUROPLASTIC ENCODING
// High-impact identity sentences for the post-effort window
// ============================================================
const NEUROPLASTIC_FULL_SESSION = [
  "You proved mood is irrelevant.",
  "Decision executed. Identity encoded.",
  "Operator confirmed.",
  "Threshold extended.",
  "Signal received.",
  "You chose structure over comfort.",
  "Capacity was expanded today.",
  "This is who you are becoming.",
];

const NEUROPLASTIC_EARLY_STOP = [
  "Incomplete signal logged.",
  "Partial execution recorded.",
  "The attempt counts. Continue tomorrow.",
  "Momentum preserved.",
];

const NEUROPLASTIC_INCREASED_INTENSITY = [
  "Capacity expanded.",
  "New threshold established.",
  "You exceeded prior limits.",
  "Structural upgrade confirmed.",
];

// ============================================================
// ROTATION ENGINE
// Ensures no consecutive repeat within a category
// ============================================================
type MessageCategory =
  | "login"
  | "workoutStart"
  | "hesitation"
  | "completion"
  | "missed"
  | "streakBroken"
  | "weeklyInsight"
  | "neuroFull"
  | "neuroEarly"
  | "neuroIntensity";

const CATEGORY_MAP: Record<MessageCategory, string[]> = {
  login: LOGIN_MESSAGES,
  workoutStart: WORKOUT_START_MESSAGES,
  hesitation: HESITATION_MESSAGES,
  completion: WORKOUT_COMPLETION_MESSAGES,
  missed: MISSED_WORKOUT_MESSAGES,
  streakBroken: STREAK_BROKEN_MESSAGES,
  weeklyInsight: WEEKLY_INSIGHT_MESSAGES,
  neuroFull: NEUROPLASTIC_FULL_SESSION,
  neuroEarly: NEUROPLASTIC_EARLY_STOP,
  neuroIntensity: NEUROPLASTIC_INCREASED_INTENSITY,
};

export function getRandomMessage(category: MessageCategory): string {
  const messages = CATEGORY_MAP[category];
  if (!messages || messages.length === 0) return "";

  const state = getBehaviorState();
  const lastIndex = state.lastShownIndices[category] ?? -1;

  let newIndex: number;
  if (messages.length === 1) {
    newIndex = 0;
  } else {
    do {
      newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === lastIndex);
  }

  // Save the index to prevent consecutive repeats
  updateBehaviorState({
    lastShownIndices: {
      ...state.lastShownIndices,
      [category]: newIndex,
    },
  });

  return messages[newIndex];
}

// Get streak milestone message if applicable
export function getStreakMilestoneMessage(streakDays: number): string | null {
  const state = getBehaviorState();

  // Check if streak just hit a milestone
  const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);

  for (const milestone of milestoneKeys) {
    if (streakDays >= milestone && state.lastStreakMilestone < milestone) {
      updateBehaviorState({ lastStreakMilestone: milestone });
      return STREAK_MILESTONES[milestone];
    }
  }

  return null;
}

// Context-aware message selection for post-workout
export function getPostWorkoutMessage(
  completedFull: boolean,
  increasedIntensity: boolean
): string {
  if (increasedIntensity) {
    return getRandomMessage("neuroIntensity");
  }
  if (completedFull) {
    return getRandomMessage("neuroFull");
  }
  return getRandomMessage("neuroEarly");
}
