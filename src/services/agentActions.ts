// STRIDE Agent Actions
// Executes agentic function calls from Gemini on user programs
// Read actions return data immediately; write actions return proposals for user confirmation

import { queryCollection, updateDocument, where, getDocument, orderBy, limit } from "./firestore";
import type { Program, Exercise, Week, WorkoutDay, PersonalizationData } from "./programGenerator";

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

  // Summarize for the model
  const currentWeek = program.weeks[0]; // Could be smarter with date tracking
  return {
    type: "data",
    data: {
      found: true,
      name: program.name,
      durationWeeks: program.durationWeeks,
      totalWeeks: program.weeks.length,
      weeks: program.weeks.map((w) => ({
        weekNumber: w.weekNumber,
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
      currentWeekNumber: currentWeek?.weekNumber ?? 1,
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
      // Deep clone weeks and apply change
      const updatedWeeks = structuredClone(program.weeks);
      const week = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      const day = week.days.find((d) => d.dayNumber === dayNum)!;
      day.exercises[found.exerciseIndex] = {
        name: newExerciseName,
        sets: newSets,
        reps: newReps,
        rest: newRest,
      };
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
      const updatedWeeks = structuredClone(program.weeks);
      const week = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      const day = week.days.find((d) => d.dayNumber === dayNum)!;
      day.exercises[found.exerciseIndex] = {
        ...day.exercises[found.exerciseIndex],
        sets: newSets,
        reps: newReps,
        rest: newRest,
      };
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
      const updatedWeeks = structuredClone(program.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      const d = w.days.find((d) => d.dayNumber === dayNum)!;
      d.exercises = [];
      (d as WorkoutDay & { skipped?: boolean; skipReason?: string }).skipped = true;
      (d as WorkoutDay & { skipReason?: string }).skipReason = reason;
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
      // Load personalization so generated exercises respect equipment/constraints
      const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
      const { generateDay } = await import("./programGenerator");
      const newExercises = await generateDay(focus, exerciseCount, personalization ?? undefined);
      const updatedWeeks = structuredClone(program.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      const d = w.days.find((d) => d.dayNumber === dayNum)!;
      d.name = focus.charAt(0).toUpperCase() + focus.slice(1);
      d.exercises = newExercises;
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
      // Load personalization so generated exercises respect equipment/constraints
      const personalization = await getDocument<PersonalizationData>(`users/${uid}/personalization/data`);
      const { generateWeek } = await import("./programGenerator");
      const newDays = await generateWeek(weekNum, week.days.length, focus, personalization ?? undefined);
      const updatedWeeks = structuredClone(program.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      w.days = newDays;
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
      const updatedWeeks = structuredClone(program.weeks);
      const w = updatedWeeks.find((w) => w.weekNumber === weekNum)!;
      w.days = deloadDays;
      await updateDocument(`users/${uid}/programs/${program.id}`, {
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
    [orderBy("completedAt", "desc"), limit(50)]
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
// Main Dispatcher
// ============================================================

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

  switch (normalized) {
    case "getActiveProgram":
      return handleGetActiveProgram(uid);
    case "swapExercise":
      return handleSwapExercise(uid, args);
    case "adjustVolume":
      return handleAdjustVolume(uid, args);
    case "skipWorkoutDay":
      return handleSkipWorkoutDay(uid, args);
    case "regenerateDay":
      return handleRegenerateDay(uid, args);
    case "regenerateWeek":
      return handleRegenerateWeek(uid, args);
    case "generateDeloadWeek":
      return handleGenerateDeloadWeek(uid, args);
    case "getRecentPerformance":
      return handleGetRecentPerformance(uid, args);
    default:
      return {
        type: "data",
        data: { error: `Unknown action: ${functionName}` },
      };
  }
}
