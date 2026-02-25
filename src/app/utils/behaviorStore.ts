// STRIDE Behavioral State Store
// Tracks all user behavioral signals for the psychological architecture layers
// localStorage is the primary cache; Firestore is the persistence layer

import { getDocument, setDocument } from "../../services/firestore";
import { notifyStreakMilestone, isStreakMilestone } from "../../services/notifications";

export interface BehaviorState {
  // Session tracking
  lastLoginTimestamp: number;
  sessionCount: number;

  // Workout tracking
  workoutsCompletedThisWeek: number;
  workoutsSkippedThisWeek: number;
  workoutsCompleted14d: number;
  workoutsSkipped14d: number;
  totalWorkoutsCompleted: number;

  // Streak tracking
  streakDays: number;
  previousStreakDays: number;
  streakBreaks: number;
  lastStreakMilestone: number;

  // Hesitation tracking
  hesitationEvents7d: number;
  lastHesitationTimestamp: number;

  // Delay language tracking
  delayLanguageCount7d: number;

  // Reset tracking
  resetEvents14d: number;
  resetEvents30d: number;

  // Session data
  sessionDurationPlanned: number;
  sessionDurationActual: number;

  // Chat intent tags
  chatIntentTags: string[];

  // User declared goals (from onboarding)
  primaryGoal: string;
  scheduleDaysPerWeek: number;
  timePerSession: number;
  trainingFocus: string;
  equipmentAccess: string;
  constraints: string[];

  // Safety flags
  injuryFlag: boolean;
  burnoutFlag: boolean;

  // Friction tracking
  lastFrictionTimestamp: number;
  frictionCountInSession: number;
  totalAgentInteractions: number;
  consecutiveFrictionCount: number;

  // Micro-language last shown indices (prevent consecutive repeats)
  lastShownIndices: Record<string, number>;

  // Workout state
  workoutStartedAt: number;
  workoutOpenedAt: number;
  lastWorkoutCompletedAt: number;
  lastWorkoutSkippedAt: number;

  // Missed session tracking
  consecutiveMissedSessions: number;

  // Reflection history
  reflections: Array<{ text: string; timestamp: number; workoutName: string }>;

  // Weekly alignment score
  alignmentScore: number;
  lastAlignmentCalculation: number;
}

const DEFAULT_STATE: BehaviorState = {
  lastLoginTimestamp: 0,
  sessionCount: 0,
  workoutsCompletedThisWeek: 0,
  workoutsSkippedThisWeek: 0,
  workoutsCompleted14d: 0,
  workoutsSkipped14d: 0,
  totalWorkoutsCompleted: 0,
  streakDays: 0,
  previousStreakDays: 0,
  streakBreaks: 0,
  lastStreakMilestone: 0,
  hesitationEvents7d: 0,
  lastHesitationTimestamp: 0,
  delayLanguageCount7d: 0,
  resetEvents14d: 0,
  resetEvents30d: 0,
  sessionDurationPlanned: 30,
  sessionDurationActual: 0,
  chatIntentTags: [],
  primaryGoal: "conditioning",
  scheduleDaysPerWeek: 5,
  timePerSession: 30,
  trainingFocus: "",
  equipmentAccess: "gym",
  constraints: [],
  injuryFlag: false,
  burnoutFlag: false,
  lastFrictionTimestamp: 0,
  frictionCountInSession: 0,
  totalAgentInteractions: 0,
  consecutiveFrictionCount: 0,
  lastShownIndices: {},
  workoutStartedAt: 0,
  workoutOpenedAt: 0,
  lastWorkoutCompletedAt: 0,
  lastWorkoutSkippedAt: 0,
  consecutiveMissedSessions: 0,
  reflections: [],
  alignmentScore: 50,
  lastAlignmentCalculation: 0,
};

const STORE_KEY = "stride_behavior_state";

// UID of the currently authenticated user (set via setAuthUid)
let _authUid: string | null = null;

/** Call once on auth state change to enable/disable Firestore sync */
export function setAuthUid(uid: string | null): void {
  _authUid = uid;
}

export function getBehaviorState(): BehaviorState {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch {
    // fallback to defaults
  }
  return { ...DEFAULT_STATE };
}

export function updateBehaviorState(updates: Partial<BehaviorState>): BehaviorState {
  const current = getBehaviorState();
  const next = { ...current, ...updates };
  localStorage.setItem(STORE_KEY, JSON.stringify(next));

  // Fire-and-forget Firestore sync if authenticated
  if (_authUid) {
    syncToFirestore(_authUid).catch(() => {
      // Silent fail — localStorage is the fallback
    });
  }

  return next;
}

// ============================================================
// Firestore Sync
// ============================================================

/** Fetch behavior state from Firestore and merge into localStorage */
export async function syncFromFirestore(uid: string): Promise<BehaviorState> {
  const remote = await getDocument<Partial<BehaviorState>>(`users/${uid}/behaviorState/data`);
  if (remote) {
    const merged = { ...DEFAULT_STATE, ...remote };
    localStorage.setItem(STORE_KEY, JSON.stringify(merged));
    return merged;
  }
  // No remote data — push local state to Firestore as initial seed
  const local = getBehaviorState();
  await syncToFirestore(uid);
  return local;
}

/** Write current localStorage state to Firestore */
export async function syncToFirestore(uid: string): Promise<void> {
  const state = getBehaviorState();
  // Strip non-serializable/transient fields if any, then write
  await setDocument(`users/${uid}/behaviorState/data`, { ...state });
}

// ============================================================
// Mutation helpers (unchanged API, now with auto-sync)
// ============================================================

export function recordLogin(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    lastLoginTimestamp: Date.now(),
    sessionCount: state.sessionCount + 1,
  });
}

export function recordWorkoutOpened(): BehaviorState {
  return updateBehaviorState({
    workoutOpenedAt: Date.now(),
  });
}

export function recordWorkoutStarted(): BehaviorState {
  return updateBehaviorState({
    workoutStartedAt: Date.now(),
  });
}

export function recordHesitation(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    hesitationEvents7d: state.hesitationEvents7d + 1,
    lastHesitationTimestamp: Date.now(),
  });
}

export function recordWorkoutCompleted(): BehaviorState {
  const state = getBehaviorState();
  const newStreak = state.streakDays + 1;

  // Fire streak milestone notification
  if (_authUid && isStreakMilestone(newStreak)) {
    notifyStreakMilestone(_authUid, newStreak).catch(console.warn);
  }

  return updateBehaviorState({
    workoutsCompletedThisWeek: state.workoutsCompletedThisWeek + 1,
    workoutsCompleted14d: state.workoutsCompleted14d + 1,
    totalWorkoutsCompleted: state.totalWorkoutsCompleted + 1,
    lastWorkoutCompletedAt: Date.now(),
    streakDays: newStreak,
    previousStreakDays: state.streakDays,
    consecutiveMissedSessions: 0,
  });
}

export function recordWorkoutSkipped(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    workoutsSkippedThisWeek: state.workoutsSkippedThisWeek + 1,
    workoutsSkipped14d: state.workoutsSkipped14d + 1,
    lastWorkoutSkippedAt: Date.now(),
    consecutiveMissedSessions: state.consecutiveMissedSessions + 1,
  });
}

export function recordStreakBroken(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    previousStreakDays: state.streakDays,
    streakDays: 0,
    streakBreaks: state.streakBreaks + 1,
  });
}

export function recordDelayLanguage(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    delayLanguageCount7d: state.delayLanguageCount7d + 1,
    chatIntentTags: [...state.chatIntentTags, "delay"],
  });
}

export function recordResetEvent(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    resetEvents14d: state.resetEvents14d + 1,
    resetEvents30d: state.resetEvents30d + 1,
    chatIntentTags: [...state.chatIntentTags, "reset"],
  });
}

export function recordReflection(text: string, workoutName: string): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    reflections: [
      { text, timestamp: Date.now(), workoutName },
      ...state.reflections.slice(0, 49), // keep last 50
    ],
  });
}

export function recordFrictionDelivered(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    lastFrictionTimestamp: Date.now(),
    frictionCountInSession: state.frictionCountInSession + 1,
    consecutiveFrictionCount: state.consecutiveFrictionCount + 1,
  });
}

export function recordAgentInteraction(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    totalAgentInteractions: state.totalAgentInteractions + 1,
    consecutiveFrictionCount: 0, // reset consecutive after non-friction
  });
}

// Calculate weekly alignment score (0-100)
export function calculateAlignmentScore(): number {
  const state = getBehaviorState();
  let score = 100;

  // Subtract for negative behaviors
  score -= state.workoutsSkippedThisWeek * 12;
  score -= state.hesitationEvents7d * 4;
  score -= state.resetEvents14d * 10;
  score -= state.delayLanguageCount7d * 6;

  // Add for positive behaviors (cap +24)
  const completionBonus = Math.min(state.workoutsCompletedThisWeek * 6, 24);
  score += completionBonus;

  // Re-entry bonus
  if (state.consecutiveMissedSessions >= 2 && state.lastWorkoutCompletedAt > state.lastWorkoutSkippedAt) {
    score += 10;
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  updateBehaviorState({
    alignmentScore: score,
    lastAlignmentCalculation: Date.now(),
  });

  return score;
}
