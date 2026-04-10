// STRIDE Agent Actions
// Executes agentic function calls from Gemini on user programs
// Read actions return data immediately; write actions return proposals for user confirmation

import { queryCollection, updateDocument, where, getDocument, setDocument, orderBy, limit } from "./firestore";
import type { Program, Exercise, Week, WorkoutDay, PersonalizationData } from "./programGenerator";
import { toLocalISO, getCurrentProgramWeek } from "../app/utils/dateUtils";

// ============================================================
// Types
// ============================================================

interface ProgramDoc extends Program {
  id: string;
  active: boolean;
}

export interface ExercisePreview extends Exercise {
  changed?: boolean;
  replacing?: boolean;
  dayLabel?: string;
}

export interface ActionProposal {
  actionName: string;
  /** Original function name from Gemini (may be snake_case) — used in functionResponse */
  originalName?: string;
  description: string;
  preview: { exercises: ExercisePreview[] };
  programId: string;
  execute: () => Promise<void>;
}

export type ActionResult =
  | { type: "data"; data: Record<string, unknown> }
  | { type: "proposal"; proposal: ActionProposal };

// ============================================================
// Helpers
// ============================================================

async function getActiveProgramDoc(uid: string): Promise<ProgramDoc | null> {
  const programs = await queryCollection<ProgramDoc>(
    `users/${uid}/programs`,
    [where("active", "==", true), limit(1)]
  );
  return programs[0] ?? null;
}

function findExercise(
  program: ProgramDoc,
  weekNumber: number,
  dayNumber: number,
  exerciseName: string
): { week: Week; day: WorkoutDay; exerciseIndex: number } | null {
  const week = program.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) return null;
  const day = week.days.find((d) => d.dayNumber === dayNumber);
  if (!day) return null;
  const exerciseIndex = day.exercises.findIndex(
    (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
  );
  if (exerciseIndex === -1) return null;
  return { week, day, exerciseIndex };
}

// ============================================================
// Action Handlers
// ============================================================

async function handleGetActiveProgram(uid: string): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return {
      type: "data",
      data: { found: false, message: "No active program found." },
    };
  }

  // Calculate current week using shared utility (same formula as Dashboard + AIAgent)
  const currentWeekNum = getCurrentProgramWeek(program.createdAt, program.weeks.length);

  return {
    type: "data",
    data: {
      found: true,
      name: program.name,
      durationWeeks: program.durationWeeks,
      totalWeeks: program.weeks.length,
      weeks: program.weeks.map((w) => ({
        weekNumber: w.weekNumber,
        weekType: w.weekType ?? "accumulation",
        days: w.days.map((d) => ({
          dayNumber: d.dayNumber,
          name: d.name,
          exerciseCount: d.exercises.length,
          exercises: d.exercises.map((e) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
          })),
        })),
      })),
      currentWeekNumber: currentWeekNum,
    },
  };
}

async function handleSwapExercise(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const exerciseName = args.exerciseName as string;
  const newExerciseName = args.newExerciseName as string;
  const newSets = args.newSets as number;
  const newReps = args.newReps as string;
  const newRest = args.newRest as string;

  const found = findExercise(program, weekNum, dayNum, exerciseName);
  if (!found) {
    return {
      type: "data",
      data: {
        error: `Exercise "${exerciseName}" not found in week ${weekNum}, day ${dayNum}.`,
      },
    };
  }

  // Build preview: show all exercises on that day, with the swapped one marked
  const preview: ExercisePreview[] = found.day.exercises.map((e, i) => {
    if (i === found.exerciseIndex) {
      return {
        name: newExerciseName,
        sets: newSets,
        reps: newReps,
        rest: newRest,
        changed: true,
      };
    }
    return { ...e };
  });

  const proposal: ActionProposal = {
    actionName: "swapExercise",
    description: `Replace "${exerciseName}" with "${newExerciseName}" (${newSets}x${newReps}, ${newRest} rest) on Week ${weekNum}, Day ${dayNum}`,
    preview: { exercises: preview },
    programId: program.id,
    execute: async () => {
      // Re-fetch to avoid stale closure overwriting concurrent edits
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const week = updatedWeeks.find((w) => w.weekNumber === weekNum);
      const day = week?.days.find((d) => d.dayNumber === dayNum);
      if (!week || !day) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
      const idx = day.exercises.findIndex((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
      if (idx === -1) throw new Error(`Exercise "${exerciseName}" not found`);
      day.exercises[idx] = {
        name: newExerciseName,
        sets: newSets,
        reps: newReps,
        rest: newRest,
      };
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleAdjustVolume(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const exerciseName = args.exerciseName as string;

  const found = findExercise(program, weekNum, dayNum, exerciseName);
  if (!found) {
    return {
      type: "data",
      data: {
        error: `Exercise "${exerciseName}" not found in week ${weekNum}, day ${dayNum}.`,
      },
    };
  }

  const currentEx = found.day.exercises[found.exerciseIndex];
  const newSets = (args.sets as number) ?? currentEx.sets;
  const newReps = (args.reps as string) ?? currentEx.reps;
  const newRest = (args.rest as string) ?? currentEx.rest;

  const preview: ExercisePreview[] = found.day.exercises.map((e, i) => {
    if (i === found.exerciseIndex) {
      return { name: e.name, sets: newSets, reps: newReps, rest: newRest, changed: true };
    }
    return { ...e };
  });

  const proposal: ActionProposal = {
    actionName: "adjustVolume",
    description: `Adjust "${exerciseName}" to ${newSets}x${newReps}, ${newRest} rest on Week ${weekNum}, Day ${dayNum}`,
    preview: { exercises: preview },
    programId: program.id,
    execute: async () => {
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const week = updatedWeeks.find((w) => w.weekNumber === weekNum);
      const day = week?.days.find((d) => d.dayNumber === dayNum);
      if (!week || !day) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
      const idx = day.exercises.findIndex((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
      if (idx === -1) throw new Error(`Exercise "${exerciseName}" not found`);
      day.exercises[idx] = { ...day.exercises[idx], sets: newSets, reps: newReps, rest: newRest };
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleSkipWorkoutDay(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const reason = (args.reason as string) || "operator request";

  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  if (!week) {
    return { type: "data", data: { error: `Week ${weekNum} not found.` } };
  }

  const day = week.days.find((d) => d.dayNumber === dayNum);
  if (!day) {
    return {
      type: "data",
      data: { error: `Day ${dayNum} not found in week ${weekNum}.` },
    };
  }

  const preview: ExercisePreview[] = day.exercises.map((e) => ({
    ...e,
    notes: "SKIPPED",
    changed: true,
  }));

  const proposal: ActionProposal = {
    actionName: "skipWorkoutDay",
    description: `Skip "${day.name}" (Week ${weekNum}, Day ${dayNum}) — ${reason}`,
    preview: { exercises: preview },
    programId: program.id,
    execute: async () => {
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
      const d = w?.days.find((d) => d.dayNumber === dayNum);
      if (!w || !d) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
      d.exercises = [];
      (d as WorkoutDay & { skipped?: boolean; skipReason?: string }).skipped = true;
      (d as WorkoutDay & { skipReason?: string }).skipReason = reason;
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleRegenerateDay(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const focus = (args.focus as string) || "general";
  const exerciseCount = (args.exerciseCount as number) || 5;

  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  if (!week) {
    return { type: "data", data: { error: `Week ${weekNum} not found.` } };
  }

  const day = week.days.find((d) => d.dayNumber === dayNum);
  if (!day) {
    return { type: "data", data: { error: `Day ${dayNum} not found in week ${weekNum}.` } };
  }

  // Show current exercises being replaced
  const preview: ExercisePreview[] = day.exercises.map((e) => ({
    ...e,
    replacing: true,
    dayLabel: `Day ${dayNum} — ${day.name} → ${focus}`,
  }));

  const proposal: ActionProposal = {
    actionName: "regenerateDay",
    description: `Regenerate Day ${dayNum} of Week ${weekNum} with focus: ${focus}. ${day.exercises.length} exercises will be replaced.`,
    preview: { exercises: preview },
    programId: program.id,
    execute: async () => {
      const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
      const { generateDay } = await import("./programGenerator");
      const newExercises = await generateDay(focus, exerciseCount, personalization ?? undefined);
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
      const d = w?.days.find((d) => d.dayNumber === dayNum);
      if (!w || !d) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
      d.name = focus.charAt(0).toUpperCase() + focus.slice(1);
      d.exercises = newExercises;
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleRegenerateWeek(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const focus = (args.focus as string) || "";

  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  if (!week) {
    return { type: "data", data: { error: `Week ${weekNum} not found.` } };
  }

  // Show per-day summary of exercises being replaced
  const allExercises: ExercisePreview[] = [];
  for (const day of week.days) {
    for (const e of day.exercises) {
      allExercises.push({ ...e, replacing: true, dayLabel: `Day ${day.dayNumber} — ${day.name}` });
    }
  }

  const dayCount = week.days.length;
  const exCount = allExercises.length;

  const proposal: ActionProposal = {
    actionName: "regenerateWeek",
    description: `Regenerate Week ${weekNum}: ${dayCount} days, ${exCount} exercises will be replaced with a fresh set${focus ? ` focused on ${focus}` : ""}.`,
    preview: { exercises: allExercises },
    programId: program.id,
    execute: async () => {
      const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
      const { generateWeek } = await import("./programGenerator");
      const dayCount = week.days.length;
      const newDays = await generateWeek(weekNum, dayCount, focus, personalization ?? undefined);
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
      if (!w) throw new Error(`Week ${weekNum} not found`);
      w.days = newDays;
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleGenerateDeloadWeek(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const weekNum = args.weekNumber as number;
  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  if (!week) {
    return { type: "data", data: { error: `Week ${weekNum} not found.` } };
  }
  if (week.weekType === "deload") {
    return { type: "data", data: { error: `Week ${weekNum} is already a deload week.` } };
  }

  // Build deload: reduce sets by ~40%, keep same exercises
  const deloadDays = week.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => ({
      ...ex,
      sets: Math.max(2, Math.ceil(ex.sets * 0.6)),
    })),
  }));

  const allExercises: ExercisePreview[] = deloadDays.flatMap((day) =>
    day.exercises.map((e) => ({
      ...e,
      changed: true,
      dayLabel: `Day ${day.dayNumber} — ${day.name} [DELOAD]`,
    }))
  );

  const proposal: ActionProposal = {
    actionName: "generateDeloadWeek",
    description: `Generate deload Week ${weekNum} — volume reduced to ~60%. Recovery protocol.`,
    preview: { exercises: allExercises },
    programId: program.id,
    execute: async () => {
      const fresh = await getActiveProgramDoc(uid);
      if (!fresh) throw new Error("Program not found");
      const updatedWeeks = structuredClone(fresh.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
      if (!w) throw new Error(`Week ${weekNum} not found`);
      // Rebuild deload from fresh data
      w.days = w.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex) => ({
          ...ex,
          sets: Math.max(2, Math.ceil(ex.sets * 0.6)),
        })),
      }));
      await updateDocument(`users/${uid}/programs/${fresh.id}`, {
        weeks: updatedWeeks,
      });
    },
  };

  return { type: "proposal", proposal };
}

async function handleGetRecentPerformance(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const exerciseName = (args.exerciseName as string) || "";
  const queryLimit = (args.limit as number) || 5;

  // Fetch recent workout logs (Firestore can't filter inside arrays, so fetch recent and filter client-side)
  const logs = await queryCollection<{
    exercises: { name: string; actualSets?: { weight: number; repsCompleted: number; rpe: number; setNumber: number }[] }[];
    completedAt: string;
    workoutName: string;
  }>(
    `users/${uid}/workoutLogs`,
    [orderBy("completedAt", "desc"), limit(Math.min(queryLimit * 5, 25))]
  );

  // Filter logs that contain the requested exercise (case-insensitive)
  const matchingEntries: {
    date: string;
    workout: string;
    sets: { weight: number; reps: number; rpe: number }[];
    maxWeight: number;
    avgRPE: number;
  }[] = [];

  const nameLower = exerciseName.toLowerCase();
  for (const log of logs) {
    for (const ex of log.exercises || []) {
      if (ex.name.toLowerCase().includes(nameLower) && ex.actualSets?.length) {
        const sets = ex.actualSets.map(s => ({
          weight: s.weight,
          reps: s.repsCompleted,
          rpe: s.rpe,
        }));
        matchingEntries.push({
          date: log.completedAt,
          workout: log.workoutName || "Workout",
          sets,
          maxWeight: Math.max(...sets.map(s => s.weight)),
          avgRPE: Math.round(sets.reduce((sum, s) => sum + s.rpe, 0) / sets.length * 10) / 10,
        });
      }
    }
  }

  // Sort by date descending and limit
  matchingEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const limited = matchingEntries.slice(0, queryLimit);

  if (limited.length === 0) {
    return {
      type: "data",
      data: { found: false, exercise: exerciseName, message: `No performance data found for "${exerciseName}".` },
    };
  }

  // Calculate trends
  const allMaxWeights = limited.map(e => e.maxWeight).reverse(); // oldest→newest
  const trend = allMaxWeights.length >= 2
    ? allMaxWeights[allMaxWeights.length - 1] > allMaxWeights[0] ? "increasing" : allMaxWeights[allMaxWeights.length - 1] < allMaxWeights[0] ? "decreasing" : "stable"
    : "insufficient data";

  return {
    type: "data",
    data: {
      found: true,
      exercise: exerciseName,
      entries: limited.map(e => ({
        date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        workout: e.workout,
        maxWeight: e.maxWeight,
        avgRPE: e.avgRPE,
        totalSets: e.sets.length,
        sets: e.sets,
      })),
      weightTrend: trend,
      currentMax: limited[0]?.maxWeight ?? 0,
    },
  };
}

// ============================================================
// Surgical Exercise Operations (add, remove, reorder)
// ============================================================

async function handleAddExercise(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) return { type: "data", data: { error: "No active program found." } };

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const name = args.exerciseName as string;
  const sets = (args.sets as number) || 3;
  const reps = (args.reps as string) || "10";
  const rest = (args.rest as string) || "60s";

  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  const day = week?.days.find((d) => d.dayNumber === dayNum);
  if (!week || !day) return { type: "data", data: { error: `Day ${dayNum} in week ${weekNum} not found.` } };
  // Prevent duplicate exercises on the same day
  if (day.exercises.some(e => e.name.toLowerCase() === name.toLowerCase())) {
    return { type: "data", data: { error: `"${name}" is already on Day ${dayNum}. Use adjustVolume to change sets/reps, or swapExercise to replace it.` } };
  }

  const newExercise: Exercise = { name, sets, reps, rest };
  const preview: ExercisePreview[] = [...day.exercises, { ...newExercise, changed: true }];

  return {
    type: "proposal",
    proposal: {
      actionName: "addExercise",
      description: `Add "${name}" (${sets}x${reps}, ${rest}) to Week ${weekNum}, Day ${dayNum}`,
      preview: { exercises: preview },
      programId: program.id,
      execute: async () => {
        const fresh = await getActiveProgramDoc(uid);
        if (!fresh) throw new Error("Program not found");
        const updatedWeeks = structuredClone(fresh.weeks);
        const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
        const d = w?.days.find((d) => d.dayNumber === dayNum);
        if (!w || !d) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
        d.exercises.push(newExercise);
        await updateDocument(`users/${uid}/programs/${fresh.id}`, { weeks: updatedWeeks });
      },
    },
  };
}

async function handleRemoveExercise(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) return { type: "data", data: { error: "No active program found." } };

  const weekNum = args.weekNumber as number;
  const dayNum = args.dayNumber as number;
  const exerciseName = args.exerciseName as string;

  const found = findExercise(program, weekNum, dayNum, exerciseName);
  if (!found) return { type: "data", data: { error: `Exercise "${exerciseName}" not found in week ${weekNum}, day ${dayNum}.` } };
  if (found.day.exercises.length <= 1) return { type: "data", data: { error: `Cannot remove the only exercise on Day ${dayNum}. Use skipWorkoutDay to skip the day, or swapExercise to replace it.` } };

  const preview: ExercisePreview[] = found.day.exercises
    .filter((_, i) => i !== found.exerciseIndex)
    .map((e) => ({ ...e }));

  return {
    type: "proposal",
    proposal: {
      actionName: "removeExercise",
      description: `Remove "${exerciseName}" from Week ${weekNum}, Day ${dayNum}`,
      preview: { exercises: preview },
      programId: program.id,
      execute: async () => {
        const fresh = await getActiveProgramDoc(uid);
        if (!fresh) throw new Error("Program not found");
        const updatedWeeks = structuredClone(fresh.weeks);
        const w = updatedWeeks.find((w) => w.weekNumber === weekNum);
        const d = w?.days.find((d) => d.dayNumber === dayNum);
        if (!w || !d) throw new Error(`Day ${dayNum} in week ${weekNum} not found`);
        const idx = d.exercises.findIndex((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
        if (idx === -1) throw new Error(`Exercise "${exerciseName}" not found`);
        d.exercises.splice(idx, 1);
        await updateDocument(`users/${uid}/programs/${fresh.id}`, { weeks: updatedWeeks });
      },
    },
  };
}

// ============================================================
// Workout History (general — no exercise filter)
// ============================================================

async function handleGetWorkoutHistory(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const count = (args.limit as number) || 10;
  const logs = await queryCollection<{
    workoutName: string;
    exercises: { name: string }[];
    completedAt: string;
    completionType: string;
    totalVolume?: number;
    duration?: number;
    isActivity?: boolean;
    durationMinutes?: number;
    distance?: string;
  }>(
    `users/${uid}/workoutLogs`,
    [orderBy("completedAt", "desc"), limit(count)]
  );

  if (logs.length === 0) {
    return { type: "data", data: { found: false, message: "No workout history found." } };
  }

  return {
    type: "data",
    data: {
      found: true,
      totalLogs: logs.length,
      workouts: logs.map((l) => ({
        name: l.workoutName,
        date: new Date(l.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completionType: l.completionType,
        exerciseCount: l.exercises?.length ?? 0,
        exercises: l.exercises?.map((e) => e.name) ?? [],
        totalVolume: l.totalVolume ?? 0,
        duration: l.isActivity ? l.durationMinutes : l.duration ? Math.round(l.duration / 60) : 0,
        isActivity: l.isActivity ?? false,
        distance: l.distance ?? "",
      })),
    },
  };
}

// ============================================================
// Quick Activity Log (run, walk, bike, swim, etc.)
// ============================================================

async function handleLogActivity(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const activity = (args.activity as string) || "Activity";
  const duration = (args.durationMinutes as number) || 0;
  const distance = (args.distance as string) || "";
  const notes = (args.notes as string) || "";

  const now = new Date();
  const logId = `activity_${now.getTime()}`;
  const completedAt = toLocalISO(now);

  await setDocument(`users/${uid}/workoutLogs/${logId}`, {
    workoutName: activity,
    exercises: [],
    completedAt,
    completedAtMs: now.getTime(),
    completionType: "full",
    isActivity: true,
    durationMinutes: duration,
    distance,
    notes,
  }, false);

  // Update behavior state: activities count as training effort for streaks & consistency
  const { recordWorkoutCompleted, getBehaviorState } = await import("../app/utils/behaviorStore");
  const updatedState = recordWorkoutCompleted();

  // Sync challenge progress + send notification
  const { syncChallengeProgress } = await import("./challenges");
  const { notifyWorkoutComplete } = await import("./notifications");
  syncChallengeProgress(uid, updatedState).catch(() => {});
  notifyWorkoutComplete(uid, activity, duration * 60).catch(() => {});

  return {
    type: "data",
    data: {
      logged: true,
      activity,
      duration,
      distance,
      message: `Logged: ${activity}${distance ? ` — ${distance}` : ""}${duration ? ` — ${duration}min` : ""}. Stored in your training history.`,
    },
  };
}

// ============================================================
// Load Day Workout (do another day's session today)
// ============================================================

async function handleLoadDayWorkout(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const program = await getActiveProgramDoc(uid);
  if (!program) {
    return { type: "data", data: { error: "No active program found." } };
  }

  const dayNum = args.dayNumber as number;
  const weekNum = (args.weekNumber as number) || getCurrentProgramWeek(program.createdAt, program.weeks.length);

  const week = program.weeks.find((w) => w.weekNumber === weekNum);
  if (!week) {
    return { type: "data", data: { error: `Week ${weekNum} not found.` } };
  }

  const day = week.days.find((d) => d.dayNumber === dayNum);
  if (!day) {
    return { type: "data", data: { error: `Day ${dayNum} not found in week ${weekNum}.` } };
  }

  // Return as a bonus workout payload — UI will offer to start it immediately
  return {
    type: "data",
    data: {
      bonusWorkout: {
        dayNumber: day.dayNumber,
        name: `${day.name} (Day ${dayNum})`,
        exercises: day.exercises,
      },
      message: `Loaded Day ${dayNum} — ${day.name} (${day.exercises.length} exercises). Ready to start.`,
    },
  };
}

// ============================================================
// Bonus (Ad-Hoc) Workout Generation
// ============================================================

async function handleGenerateBonusWorkout(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const focus = (args.focus as string) || "general";
  const exerciseCount = (args.exerciseCount as number) || 4;
  const customInstructions = (args.customInstructions as string) || "";

  const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
  const { generateDay } = await import("./programGenerator");
  const exercises = await generateDay(
    customInstructions ? `${focus}. ${customInstructions}` : focus,
    exerciseCount,
    personalization ?? undefined
  );

  // Return as a bonus workout payload — the UI will offer to start it immediately
  return {
    type: "data",
    data: {
      bonusWorkout: {
        dayNumber: 0,
        name: `Bonus ${focus.charAt(0).toUpperCase() + focus.slice(1)} Calibration`,
        exercises,
      },
      message: `Generated a ${exerciseCount}-exercise ${focus} workout. Ready to start when you are.`,
    },
  };
}

// ============================================================
// Main Dispatcher
// ============================================================

/** All known agent tool names — shared with AIAgent for text-call detection */
export const AGENT_TOOL_NAMES = [
  "getActiveProgram", "swapExercise", "adjustVolume", "skipWorkoutDay",
  "regenerateDay", "regenerateWeek", "generateDeloadWeek", "getRecentPerformance",
  "getWorkoutHistory", "addExercise", "removeExercise", "generateBonusWorkout",
  "loadDayWorkout", "logActivity", "generateNewProgram",
] as const;

async function handleGenerateNewProgram(
  uid: string,
  args: Record<string, unknown>
): Promise<ActionResult> {
  const focus = (args.focus as string) || "";

  const proposal: ActionProposal = {
    actionName: "generateNewProgram",
    description: `Generate a new full training program${focus ? ` focused on ${focus}` : " based on your profile"}. Your current program will be deactivated.`,
    preview: { exercises: [] },
    programId: "",
    execute: async () => {
      const { generateProgram } = await import("./programGenerator");
      const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
      if (!personalization) throw new Error("No personalization data found. Complete onboarding first.");

      // Generate the new program
      const program = await generateProgram(personalization);

      // Deactivate the old program
      const oldPrograms = await queryCollection<ProgramDoc>(
        `users/${uid}/programs`,
        [where("active", "==", true)]
      );
      for (const old of oldPrograms) {
        await updateDocument(`users/${uid}/programs/${old.id}`, { active: false });
      }

      // Save the new program
      const programId = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDocument(`users/${uid}/programs/${programId}`, {
        ...program,
        active: true,
        createdAt: toLocalISO(new Date()),
      }, false);
    },
  };

  return { type: "proposal", proposal };
}

/** Normalize snake_case to camelCase (Gemini sometimes returns snake_case names) */
function toCamelCase(name: string): string {
  return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Execute an agent function call. Returns data (read) or a proposal (write).
 */
export async function executeAction(
  functionName: string,
  args: Record<string, unknown>,
  uid: string
): Promise<ActionResult> {
  const normalized = toCamelCase(functionName);

  let result: ActionResult;
  switch (normalized) {
    case "getActiveProgram":
      result = await handleGetActiveProgram(uid); break;
    case "swapExercise":
      result = await handleSwapExercise(uid, args); break;
    case "adjustVolume":
      result = await handleAdjustVolume(uid, args); break;
    case "skipWorkoutDay":
      result = await handleSkipWorkoutDay(uid, args); break;
    case "regenerateDay":
      result = await handleRegenerateDay(uid, args); break;
    case "regenerateWeek":
      result = await handleRegenerateWeek(uid, args); break;
    case "generateDeloadWeek":
      result = await handleGenerateDeloadWeek(uid, args); break;
    case "getRecentPerformance":
      result = await handleGetRecentPerformance(uid, args); break;
    case "getWorkoutHistory":
      result = await handleGetWorkoutHistory(uid, args); break;
    case "addExercise":
      result = await handleAddExercise(uid, args); break;
    case "removeExercise":
      result = await handleRemoveExercise(uid, args); break;
    case "generateBonusWorkout":
      result = await handleGenerateBonusWorkout(uid, args); break;
    case "loadDayWorkout":
      result = await handleLoadDayWorkout(uid, args); break;
    case "logActivity":
      result = await handleLogActivity(uid, args); break;
    case "generateNewProgram":
      result = await handleGenerateNewProgram(uid, args); break;
    default:
      return { type: "data", data: { error: `Unknown action: ${functionName}` } };
  }

  // Attach original function name to proposals (Gemini expects it in functionResponse)
  if (result.type === "proposal" && functionName !== normalized) {
    result.proposal.originalName = functionName;
  }

  return result;
}
