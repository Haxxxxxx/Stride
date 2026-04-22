// STRIDE Behavioral State Store
// Tracks all user behavioral signals for the psychological architecture layers
// localStorage is the primary cache; Firestore is the persistence layer

import { getDocument, setDocument, queryCollection, where, orderBy } from "../../services/firestore";
import { notifyStreakMilestone, isStreakMilestone, createNotification } from "../../services/notifications";
import { getMondayOf, toLocalISO } from "../utils/dateUtils";

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

  // Window timestamps for rolling counters (epoch ms)
  windowStart14d: number;
  windowStart30d: number;

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
  /** Timestamp when injuryFlag was raised — used to auto-clear after cool-down window */
  injuryFlagSetAt?: number;
  /** Where the pain was reported (for agent context when injury flag is active) */
  injuryLocation?: string;

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

  // Weekly reset tracking
  lastWeeklyReset: number;

  // Deload tracking
  weeksSinceLastDeload: number;
  lastDeloadTimestamp: number;
  deloadRecommended: boolean;

  // Missed-workout dedup guard
  lastMissCheckTimestamp: number;
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
  windowStart14d: 0,
  windowStart30d: 0,
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
  injuryFlagSetAt: 0,
  injuryLocation: "",
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
  lastWeeklyReset: 0,
  weeksSinceLastDeload: 0,
  lastDeloadTimestamp: 0,
  deloadRecommended: false,
  lastMissCheckTimestamp: 0,
};

const STORE_KEY = "stride_behavior_state";

// UID of the currently authenticated user (set via setAuthUid)
let _authUid: string | null = null;

/** Call once on auth state change to enable/disable Firestore sync */
export function setAuthUid(uid: string | null): void {
  _authUid = uid;
}

/** Get the Monday 00:00 local timestamp for the week containing `ts` */
function getWeekNumber(ts: number): number {
  return getMondayOf(new Date(ts)).getTime();
}

/** Build a weekly recap summary string from pre-reset counters.
 *  Returns null if the user had zero activity that week. */
function generateWeeklyRecap(state: BehaviorState): string | null {
  // Only generate if user had any activity this week
  if (state.workoutsCompletedThisWeek === 0 && state.workoutsSkippedThisWeek === 0) return null;

  const total = state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek;
  const rate = total > 0 ? Math.round((state.workoutsCompletedThisWeek / total) * 100) : 0;
  const streak = state.streakDays;

  let recap = `Week Complete — ${state.workoutsCompletedThisWeek} session${state.workoutsCompletedThisWeek !== 1 ? "s" : ""} logged`;
  if (state.workoutsSkippedThisWeek > 0) {
    recap += `, ${state.workoutsSkippedThisWeek} missed`;
  }
  recap += `. Completion: ${rate}%.`;
  if (streak > 0) recap += ` Streak: ${streak} days.`;
  recap += ` Alignment: ${state.alignmentScore}/100.`;

  return recap;
}

export function getBehaviorState(): BehaviorState {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** Run scheduled resets (weekly + 14d/30d window roll). Call once per session from recordLogin(). */
function runScheduledMaintenance(): void {
  const state = getBehaviorState();
  let dirty = false;

  // Weekly reset (Monday boundary)
  const currentWeek = getWeekNumber(Date.now());
  const lastResetWeek = getWeekNumber(state.lastWeeklyReset || 0);
  if (currentWeek > lastResetWeek) {
    const recap = generateWeeklyRecap(state);
    if (recap && _authUid) {
      createNotification(_authUid!, {
        type: "system",
        title: "Weekly Operations Report",
        message: recap,
      }).catch(() => {});
    }
    if (state.workoutsCompletedThisWeek > 0) {
      state.weeksSinceLastDeload = (state.weeksSinceLastDeload || 0) + 1;
      state.deloadRecommended = state.weeksSinceLastDeload >= 3;
    }
    state.workoutsCompletedThisWeek = 0;
    state.workoutsSkippedThisWeek = 0;
    state.hesitationEvents7d = 0;
    state.delayLanguageCount7d = 0;
    state.lastWeeklyReset = Date.now();
    dirty = true;
  }

  // 14d/30d window roll
  const now = Date.now();
  const MS_14D = 14 * 24 * 60 * 60 * 1000;
  const MS_30D = 30 * 24 * 60 * 60 * 1000;
  if (!state.windowStart14d) {
    state.windowStart14d = now;
    dirty = true;
  } else if (now - state.windowStart14d > MS_14D) {
    state.resetEvents14d = 0;
    state.windowStart14d = now;
    dirty = true;
  }
  if (!state.windowStart30d) {
    state.windowStart30d = now;
    dirty = true;
  } else if (now - state.windowStart30d > MS_30D) {
    state.resetEvents30d = 0;
    state.windowStart30d = now;
    dirty = true;
  }

  if (dirty) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }
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

/** Fetch behavior state from Firestore and merge into localStorage.
 *  Uses "last-writer-wins" for timestamps and "take-max" for counters,
 *  preserving offline progress that hasn't synced yet. */
export async function syncFromFirestore(uid: string): Promise<BehaviorState> {
  const remote = await getDocument<Partial<BehaviorState>>(`users/${uid}/behaviorState/data`);
  if (!remote) {
    // No remote data — push local state to Firestore as initial seed
    const local = getBehaviorState();
    await syncToFirestore(uid);
    return local;
  }

  const local = getBehaviorState();
  const remoteState = { ...DEFAULT_STATE, ...remote };

  // Counters: take the higher value (offline may have incremented beyond remote)
  // NOTE: workoutsCompleted14d & workoutsSkipped14d are excluded here —
  // they are computed from actual workout logs by refreshWorkoutCounts()
  const maxKeys: (keyof BehaviorState)[] = [
    "sessionCount", "totalWorkoutsCompleted", "streakDays",
    "workoutsCompletedThisWeek", "workoutsSkippedThisWeek",
    "hesitationEvents7d", "delayLanguageCount7d",
    "resetEvents14d", "resetEvents30d",
    "streakBreaks", "totalAgentInteractions",
    "weeksSinceLastDeload",
  ];

  // Timestamps: take the most recent value
  const tsKeys: (keyof BehaviorState)[] = [
    "lastLoginTimestamp", "lastHesitationTimestamp",
    "lastWorkoutCompletedAt", "lastWorkoutSkippedAt",
    "lastFrictionTimestamp", "lastAlignmentCalculation",
    "lastWeeklyReset", "lastDeloadTimestamp",
    "lastStreakMilestone", "lastMissCheckTimestamp",
  ];

  const merged: BehaviorState = { ...DEFAULT_STATE };

  // Start from remote, then overlay local wins
  for (const key of Object.keys(DEFAULT_STATE) as (keyof BehaviorState)[]) {
    if (maxKeys.includes(key)) {
      (merged as Record<string, unknown>)[key] = Math.max(
        (local[key] as number) ?? 0,
        (remoteState[key] as number) ?? 0
      );
    } else if (tsKeys.includes(key)) {
      (merged as Record<string, unknown>)[key] = Math.max(
        (local[key] as number) ?? 0,
        (remoteState[key] as number) ?? 0
      );
    } else if (key === "injuryFlag" || key === "burnoutFlag" || key === "deloadRecommended") {
      // Safety flags: always prefer remote (server is authoritative)
      (merged as Record<string, unknown>)[key] = remoteState[key];
    } else {
      // For strings, arrays, objects: prefer remote if non-default, else keep local
      const remoteVal = remoteState[key];
      const localVal = local[key];
      (merged as Record<string, unknown>)[key] =
        remoteVal !== undefined && remoteVal !== DEFAULT_STATE[key] ? remoteVal : localVal;
    }
  }

  // Reflections: merge & deduplicate by timestamp, keep newest 50
  const allReflections = [...(local.reflections ?? []), ...(remoteState.reflections ?? [])];
  const seen = new Set<number>();
  merged.reflections = allReflections
    .filter((r) => { if (seen.has(r.timestamp)) return false; seen.add(r.timestamp); return true; })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  // lastShownIndices: merge taking higher index per key
  merged.lastShownIndices = { ...remoteState.lastShownIndices };
  for (const [k, v] of Object.entries(local.lastShownIndices ?? {})) {
    merged.lastShownIndices[k] = Math.max(v, merged.lastShownIndices[k] ?? 0);
  }

  localStorage.setItem(STORE_KEY, JSON.stringify(merged));

  // Refresh 14d/30d workout counts from actual Firestore logs
  // This corrects the monotonically-growing counters with real data
  await refreshWorkoutCounts(uid).catch(() => {
    // Silent fail — stale counters are better than a broken sync
  });

  // Re-read after refresh (counts may have been corrected)
  const corrected = getBehaviorState();

  // Push merged+corrected state back so both sides converge
  await syncToFirestore(uid).catch(() => {});
  return corrected;
}

/** Write current localStorage state to Firestore */
export async function syncToFirestore(uid: string): Promise<void> {
  const state = getBehaviorState();
  // Strip non-serializable/transient fields if any, then write
  await setDocument(`users/${uid}/behaviorState/data`, { ...state });
}

// ============================================================
// Workout count refresh from actual Firestore logs
// ============================================================

/** Query workout logs to compute accurate 14d and 30d counts.
 *  This corrects the monotonically-growing counters that are only
 *  decremented when the entire window expires.
 *  Only runs when Firestore is reachable — localStorage counters
 *  remain as the offline approximation. */
export async function refreshWorkoutCounts(uid: string): Promise<void> {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const cutoff = toLocalISO(fourteenDaysAgo);
  const logs = await queryCollection<{ completedAt: string; completedAtMs?: number; completionType?: string; isActivity?: boolean }>(
    `users/${uid}/workoutLogs`,
    [where("completedAt", ">=", cutoff), orderBy("completedAt", "asc")]
  );

  let completed14d = 0;
  let skipped14d = 0;

  for (const log of logs) {
    const logTime = new Date(log.completedAt).getTime();
    if (isNaN(logTime)) continue;

    // Skip activity logs (runs, walks) — they aren't workouts
    if (log.isActivity) continue;

    if (log.completionType === "skipped") {
      skipped14d++;
    } else if (log.completionType === "full" || log.completionType === "partial") {
      completed14d++;
    }
  }

  // Update localStorage with accurate counts (don't trigger Firestore sync
  // here — the caller (syncFromFirestore) will push the merged state)
  const state = getBehaviorState();
  const updated: Partial<BehaviorState> = {};
  let changed = false;

  if (state.workoutsCompleted14d !== completed14d) {
    updated.workoutsCompleted14d = completed14d;
    changed = true;
  }
  if (state.workoutsSkipped14d !== skipped14d) {
    updated.workoutsSkipped14d = skipped14d;
    changed = true;
  }

  if (changed) {
    // Write directly to localStorage to avoid recursive Firestore sync
    const next = { ...state, ...updated };
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }
}

// ============================================================
// Mutation helpers (unchanged API, now with auto-sync)
// ============================================================

export function recordLogin(): BehaviorState {
  // Run weekly resets + window rolls once per session (not inside getter)
  runScheduledMaintenance();

  const state = getBehaviorState();
  const now = Date.now();
  // Dedup: don't increment if last login was within 60 seconds (StrictMode, re-mount, etc.)
  if (now - state.lastLoginTimestamp < 60000) {
    return state;
  }
  return updateBehaviorState({
    lastLoginTimestamp: now,
    sessionCount: state.sessionCount + 1,
    frictionCountInSession: 0, // Reset per-session friction counter
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
  const now = Date.now();

  // Dedup: prevent console abuse — ignore if called within 30s of last call
  if (now - state.lastWorkoutCompletedAt < 30000) {
    return state;
  }

  // Only increment streak if this is the first workout of the day
  const lastCompletedDate = state.lastWorkoutCompletedAt
    ? new Date(state.lastWorkoutCompletedAt).toDateString()
    : "";
  const todayDate = new Date().toDateString();
  const isNewDay = lastCompletedDate !== todayDate;
  const newStreak = isNewDay ? state.streakDays + 1 : state.streakDays;

  // Fire streak milestone notification only on new streak days
  if (isNewDay && _authUid && isStreakMilestone(newStreak)) {
    notifyStreakMilestone(_authUid, newStreak).catch(console.warn);
  }

  return updateBehaviorState({
    // Only increment weekly counter once per day (bonus workouts don't inflate consistency)
    workoutsCompletedThisWeek: isNewDay ? state.workoutsCompletedThisWeek + 1 : state.workoutsCompletedThisWeek,
    workoutsCompleted14d: isNewDay ? state.workoutsCompleted14d + 1 : state.workoutsCompleted14d,
    totalWorkoutsCompleted: state.totalWorkoutsCompleted + 1,
    lastWorkoutCompletedAt: Date.now(),
    streakDays: newStreak,
    previousStreakDays: isNewDay ? state.streakDays : state.previousStreakDays,
    consecutiveMissedSessions: 0,
    windowStart14d: state.windowStart14d || Date.now(),
  });
}

/** Raise the injury safety flag — suppresses ALL friction delivery until it
 *  auto-expires (72h) or is explicitly cleared. Called from the workout modal
 *  when an operator reports severe pain on a set or in readiness. */
export function raiseInjuryFlag(location?: string): BehaviorState {
  return updateBehaviorState({
    injuryFlag: true,
    injuryFlagSetAt: Date.now(),
    injuryLocation: location?.trim() ?? "",
  });
}

/** Clear the injury flag — called when the operator completes a pain-free
 *  workout or explicitly marks themselves recovered. */
export function clearInjuryFlag(): BehaviorState {
  return updateBehaviorState({
    injuryFlag: false,
    injuryFlagSetAt: 0,
    injuryLocation: "",
  });
}

/** 72h auto-expiry window — call opportunistically so a one-tap pain report
 *  doesn't silently suppress friction forever if the user never returns. */
export function maybeExpireInjuryFlag(): BehaviorState {
  const state = getBehaviorState();
  if (!state.injuryFlag) return state;
  const setAt = state.injuryFlagSetAt || 0;
  if (setAt === 0) return state;
  const hoursSince = (Date.now() - setAt) / (1000 * 60 * 60);
  if (hoursSince >= 72) {
    return clearInjuryFlag();
  }
  return state;
}

export function recordWorkoutSkipped(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    workoutsSkippedThisWeek: state.workoutsSkippedThisWeek + 1,
    workoutsSkipped14d: state.workoutsSkipped14d + 1,
    consecutiveMissedSessions: state.consecutiveMissedSessions + 1,
    lastWorkoutSkippedAt: Date.now(),
    // Break streak on skip
    previousStreakDays: state.streakDays,
    streakDays: 0,
    streakBreaks: state.streakDays > 0 ? state.streakBreaks + 1 : state.streakBreaks,
    lastStreakMilestone: 0, // Reset so milestones re-trigger on streak rebuild
  });
}

const MISS_CHECK_LOCK = "stride_miss_check_lock";

/** Check if yesterday's workout was missed and auto-record if so */
export function checkMissedWorkout(totalTrainingDays: number): void {
  // Tab-level dedup: skip if another tab checked within the last 5 seconds
  const lockTs = parseInt(localStorage.getItem(MISS_CHECK_LOCK) || "0");
  if (Date.now() - lockTs < 5000) return;
  localStorage.setItem(MISS_CHECK_LOCK, String(Date.now()));

  const state = getBehaviorState();
  const now = Date.now();
  const lastCompleted = state.lastWorkoutCompletedAt || 0;
  const lastSkipped = state.lastWorkoutSkippedAt || 0;
  const lastRecorded = Math.max(lastCompleted, lastSkipped);

  // Skip only if we already checked TODAY and no new event recorded since the
  // last check. The old logic (lastRecorded <= lastMissCheckTimestamp) returned
  // early once lastMissCheckTimestamp was set, which silently skipped detection
  // on subsequent calendar days — a user opening the app every morning would
  // never have their missed training days flagged after the first check.
  const lastCheckDay = state.lastMissCheckTimestamp
    ? new Date(state.lastMissCheckTimestamp).toDateString()
    : "";
  const todayDayStr = new Date(now).toDateString();
  const alreadyCheckedToday = lastCheckDay === todayDayStr;
  if (alreadyCheckedToday && state.lastMissCheckTimestamp && lastRecorded <= state.lastMissCheckTimestamp) {
    return;
  }

  // Check if a training day was missed since the last recorded event.
  // Count how many TRAINING DAYS (not calendar days) have passed since lastRecorded.
  // This prevents false misses over weekends/rest days.
  const todayDow = new Date().getDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // Mon=0..Sun=6
  const isTrainingDay = todayIdx < totalTrainingDays;

  // Count training days between lastRecorded and now
  const lastDate = new Date(lastRecorded);
  const today = new Date();
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const daysBetween = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

  // Count how many of those days were training days, split by current vs previous week
  let missedTrainingDays = 0;
  let missedThisWeek = 0;
  const currentMonday = getMondayOf(new Date());
  for (let d = 1; d < daysBetween; d++) {
    const checkDate = new Date(lastDate);
    checkDate.setDate(lastDate.getDate() + d);
    const dow = checkDate.getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    if (idx < totalTrainingDays) {
      missedTrainingDays++;
      // Only count toward this week's counter if the missed day is in the current week
      if (checkDate >= currentMonday) missedThisWeek++;
    }
  }

  if (missedTrainingDays > 0 && lastRecorded > 0) {
    // Missed training days — only attribute current-week misses to weekly counter
    updateBehaviorState({
      workoutsSkippedThisWeek: state.workoutsSkippedThisWeek + missedThisWeek,
      workoutsSkipped14d: state.workoutsSkipped14d + missedTrainingDays,
      consecutiveMissedSessions: state.consecutiveMissedSessions + missedTrainingDays,
      lastWorkoutSkippedAt: now,
      lastMissCheckTimestamp: now,
      // Break streak on miss (mirrors recordWorkoutSkipped)
      streakDays: 0,
      previousStreakDays: state.streakDays > 0 ? state.streakDays : state.previousStreakDays,
      streakBreaks: state.streakDays > 0 ? state.streakBreaks + 1 : state.streakBreaks,
      lastStreakMilestone: state.streakDays > 0 ? 0 : state.lastStreakMilestone, // Reset so milestones re-trigger on rebuild
    });
  } else {
    // No miss detected, but record that we checked so we don't re-evaluate
    updateBehaviorState({ lastMissCheckTimestamp: now });
  }
}

export function recordDelayLanguage(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    delayLanguageCount7d: state.delayLanguageCount7d + 1,
    chatIntentTags: [...state.chatIntentTags, "delay"].slice(-100),
  });
}

export function recordResetEvent(): BehaviorState {
  const state = getBehaviorState();
  return updateBehaviorState({
    resetEvents14d: state.resetEvents14d + 1,
    resetEvents30d: state.resetEvents30d + 1,
    chatIntentTags: [...state.chatIntentTags, "reset"].slice(-100),
    windowStart14d: state.windowStart14d || Date.now(),
    windowStart30d: state.windowStart30d || Date.now(),
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

export function recordDeloadComplete(): BehaviorState {
  return updateBehaviorState({
    weeksSinceLastDeload: 0,
    lastDeloadTimestamp: Date.now(),
    deloadRecommended: false,
  });
}

// Calculate weekly alignment score (0-100)
export function calculateAlignmentScore(): number {
  const state = getBehaviorState();
  // Don't inflate score for users with no workout history — return current score unchanged
  if (state.totalWorkoutsCompleted === 0) return state.alignmentScore;
  let score = 100;

  // Subtract for negative behaviors
  score -= state.workoutsSkippedThisWeek * 12;
  score -= state.hesitationEvents7d * 4;
  score -= state.resetEvents14d * 10;
  score -= state.delayLanguageCount7d * 6;

  // Add for positive behaviors (cap +24)
  const completionBonus = Math.min(state.workoutsCompletedThisWeek * 6, 24);
  score += completionBonus;

  // Re-entry bonus: user broke a streak but is back training (first 3 days of rebuild)
  if (state.streakBreaks > 0 && state.streakDays > 0 && state.streakDays <= 3) {
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
