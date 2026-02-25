// STRIDE Agent Conversational Layer
// 4 operational modes: Clarification, Pattern Reflection, Identity Framing, Escalation
// Each agent (Atlas, Orion, Kade) shares these modes but with different emphasis

import { getBehaviorState } from "./behaviorStore";

export type AgentMode = "clarification" | "patternReflection" | "identityFraming" | "escalation";

// ============================================================
// 1. CLARIFICATION MODE
// User expressing confusion, doubt, hesitation
// Tone: Calm interrogation
// ============================================================

interface ClarificationResponses {
  [trigger: string]: string[];
}

const CLARIFICATION: ClarificationResponses = {
  "didn't feel like": [
    "Feelings fluctuate. Decisions compound.",
    "Preference is temporary. Pattern is permanent.",
    "The question is not how you felt. It is what you chose.",
    "Was the barrier physical or psychological?",
    "Do you want comfort or capacity?",
  ],
  tired: [
    "Fatigue is information. Not instruction.",
    "Is this depletion or resistance?",
    "Reduce intensity or reduce excuse?",
    "The system can recalibrate. Avoidance does not.",
  ],
  tomorrow: [
    "Tomorrow compounds like today.",
    "Delay is a pattern if repeated.",
    "What prevents one set right now?",
    "Act once before postponing.",
  ],
  "don't know": [
    "Uncertainty is normal. Action resolves it.",
    "Begin without clarity. Clarity follows.",
    "One decision. Not a lifetime.",
    "Start. Adjust. Continue.",
  ],
  confused: [
    "Confusion is resistance wearing a mask.",
    "The protocol is simple. Follow it.",
    "What specifically is unclear?",
    "Simplify: one step now.",
  ],
  "can't": [
    "Distinguish between can't and won't.",
    "What can you do right now?",
    "Limitation is real. Avoidance mimics it.",
    "Name the actual constraint.",
  ],
  Monday: [
    '"Monday" is delay language.',
    "What changes between now and Monday?",
    "Begin today. Refine Monday.",
    "The calendar doesn't change capacity.",
  ],
  "next week": [
    "Next week is a concept. Today is real.",
    "Deferral compounds.",
    "What one thing can happen now?",
    "The gap between plan and action grows with delay.",
  ],
  restart: [
    "You don't need a new beginning. You need continuation.",
    "Restarting avoids the hard part.",
    "Continue from where you stopped.",
    "Progress is messy. Accept it.",
  ],
};

// ============================================================
// 2. PATTERN REFLECTION MODE
// Triggered by behavioral data analysis
// Tone: Observational, aware, not preachy
// ============================================================

const PATTERN_OBSERVATIONS = [
  "Your missed sessions cluster on low-energy days.",
  "You train hardest after 6PM.",
  "Streak stability increases mid-week.",
  "You avoid high-intensity protocols.",
  "Morning sessions have higher completion rates.",
  "Weekend adherence drops significantly.",
  "Volume trending upward over 14 days.",
  "Recovery gaps detected between heavy sessions.",
  "Consistency improves when sessions are under 45 minutes.",
  "Delay events peak on low-sleep days.",
];

const PATTERN_FOLLOW_UPS = [
  "Adjust or continue?",
  "Accept or intervene?",
  "Acknowledge the pattern?",
  "What do you want to do with this information?",
  "Is this intentional?",
];

// ============================================================
// 3. IDENTITY FRAMING MODE
// After completion or success
// Tone: Authoritative, minimal identity reinforcement
// ============================================================

const IDENTITY_RESPONSES: ClarificationResponses = {
  hard: [
    "Hard is the point.",
    "Difficulty signals adaptation.",
    "You extended capacity.",
    "You acted despite resistance.",
  ],
  stronger: [
    "Strength is repetition encoded.",
    "Capacity compounds quietly.",
    "This is no longer effort. It is structure.",
  ],
  "didn't want to but": [
    "That is leverage.",
    "Mood was irrelevant.",
    "This is discipline.",
    "You overrode preference. That's the skill.",
  ],
  good: [
    "Good is irrelevant. Consistent is the metric.",
    "You showed up. That's the data point.",
    "Performance follows pattern, not feeling.",
  ],
  progress: [
    "Progress is cumulative, not dramatic.",
    "You're building structure. Not seeking validation.",
    "The trend matters. Not the day.",
  ],
  done: [
    "Execution logged.",
    "Signal received.",
    "Another data point confirming identity.",
  ],
};

// ============================================================
// 4. ESCALATION MODE
// After repeated avoidance - subtle increase in firmness
// Tone: Heightened clarity, never aggressive
// ============================================================

interface EscalationLevel {
  threshold: number;
  responses: string[];
}

const ESCALATION_LEVELS: EscalationLevel[] = [
  {
    threshold: 2,
    responses: [
      "Pattern deviation increasing.",
      "Continue this direction?",
      "Two sessions missed. Noting the trend.",
    ],
  },
  {
    threshold: 3,
    responses: [
      "You are negotiating again.",
      "Is this intentional?",
      "Three sessions. This is a pattern.",
    ],
  },
  {
    threshold: 5,
    responses: [
      "This is no longer random.",
      "Do you want recalibration or release?",
      "Five sessions missed. Structural review required.",
      "The pattern is clear. Your move.",
    ],
  },
];

// ============================================================
// MODE DETECTION & RESPONSE ENGINE
// ============================================================

export function detectMode(userInput: string): AgentMode {
  const lower = userInput.toLowerCase();
  const state = getBehaviorState();

  // Check for escalation first (based on behavioral data)
  if (state.consecutiveMissedSessions >= 2) {
    // Only escalate if user is discussing their training
    const trainingKeywords = ["train", "workout", "session", "skip", "miss", "break"];
    if (trainingKeywords.some((kw) => lower.includes(kw))) {
      return "escalation";
    }
  }

  // Check for identity framing (positive signals)
  const identityTriggers = ["hard", "stronger", "getting better", "didn't want", "did it", "done", "finished", "completed", "progress", "good"];
  if (identityTriggers.some((t) => lower.includes(t))) {
    return "identityFraming";
  }

  // Check for clarification (confusion, hesitation, delay)
  const clarificationTriggers = [
    "feel like", "tired", "tomorrow", "don't know", "confused", "can't",
    "Monday", "next week", "restart", "not sure", "maybe", "later",
    "don't want", "difficult", "struggling",
  ];
  if (clarificationTriggers.some((t) => lower.includes(t))) {
    return "clarification";
  }

  // Default to pattern reflection if we have behavioral data
  if (state.totalWorkoutsCompleted > 5) {
    // Occasionally inject pattern reflection (~20% of interactions)
    if (Math.random() < 0.2) {
      return "patternReflection";
    }
  }

  // No specific mode detected
  return "clarification";
}

export function getAgentResponse(
  userInput: string,
  mode?: AgentMode
): { mode: AgentMode; response: string } {
  const detectedMode = mode || detectMode(userInput);
  const lower = userInput.toLowerCase();

  switch (detectedMode) {
    case "clarification":
      return { mode: detectedMode, response: getClarificationResponse(lower) };
    case "patternReflection":
      return { mode: detectedMode, response: getPatternReflectionResponse() };
    case "identityFraming":
      return { mode: detectedMode, response: getIdentityFramingResponse(lower) };
    case "escalation":
      return { mode: detectedMode, response: getEscalationResponse() };
    default:
      return { mode: "clarification", response: getClarificationResponse(lower) };
  }
}

function getClarificationResponse(input: string): string {
  for (const [trigger, responses] of Object.entries(CLARIFICATION)) {
    if (input.includes(trigger.toLowerCase())) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  // Generic clarification
  const generic = [
    "Clarify: is this a constraint or a preference?",
    "What specifically is stopping you?",
    "Define the barrier. Then act.",
    "The system responds to action, not intention.",
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

function getPatternReflectionResponse(): string {
  const observation =
    PATTERN_OBSERVATIONS[Math.floor(Math.random() * PATTERN_OBSERVATIONS.length)];
  const followUp =
    PATTERN_FOLLOW_UPS[Math.floor(Math.random() * PATTERN_FOLLOW_UPS.length)];
  return `${observation}\n\n${followUp}`;
}

function getIdentityFramingResponse(input: string): string {
  for (const [trigger, responses] of Object.entries(IDENTITY_RESPONSES)) {
    if (input.includes(trigger.toLowerCase())) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  const generic = [
    "Execution logged.",
    "Another data point confirming identity.",
    "You showed up. That's the signal.",
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

function getEscalationResponse(): string {
  const state = getBehaviorState();
  const missed = state.consecutiveMissedSessions;

  // Find appropriate escalation level
  const sortedLevels = [...ESCALATION_LEVELS].sort(
    (a, b) => b.threshold - a.threshold
  );
  for (const level of sortedLevels) {
    if (missed >= level.threshold) {
      return level.responses[
        Math.floor(Math.random() * level.responses.length)
      ];
    }
  }

  return "Pattern deviation detected. Acknowledge?";
}

// Detect delay language in user input for the friction engine
export function containsDelayLanguage(input: string): boolean {
  const delayPatterns = [
    "tomorrow",
    "monday",
    "next week",
    "when i feel better",
    "later",
    "not today",
    "maybe",
    "next time",
    "start over",
    "fresh start",
    "new beginning",
    "restart",
  ];
  const lower = input.toLowerCase();
  return delayPatterns.some((pattern) => lower.includes(pattern));
}

// Detect reset language
export function containsResetLanguage(input: string): boolean {
  const resetPatterns = [
    "start over",
    "fresh start",
    "new beginning",
    "restart",
    "reset",
    "begin again",
    "new plan",
    "different program",
  ];
  const lower = input.toLowerCase();
  return resetPatterns.some((pattern) => lower.includes(pattern));
}
