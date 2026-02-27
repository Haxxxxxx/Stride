// STRIDE Agent Actions
// Executes agentic function calls from Gemini on user programs
// Read actions return data immediately; write actions return proposals for user confirmation

import { queryCollection, updateDocument, where } from "./firestore";
import type { Program, Exercise, Week, WorkoutDay } from "./programGenerator";

// ============================================================
// Types
// ============================================================

interface ProgramDoc extends Program {
  id: string;
  active: boolean;
}

export interface ExercisePreview extends Exercise {
  changed?: boolean;
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
    [where("active", "==", true)]
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

  // For regeneration, we don't have a specific preview — show current week as "to be replaced"
  const allExercises: ExercisePreview[] = [];
  for (const day of week.days) {
    for (const e of day.exercises) {
      allExercises.push({ ...e, changed: true, notes: `Day ${day.dayNumber} — will be regenerated` });
    }
  }

  const proposal: ActionProposal = {
    actionName: "regenerateWeek",
    description: `Regenerate all workouts for Week ${weekNum}${focus ? ` with focus: ${focus}` : ""}. This will replace the current exercises with a fresh set.`,
    preview: { exercises: allExercises },
    programId: program.id,
    execute: async () => {
      // Generate new exercises using Gemini inline
      const { generateWeek } = await import("./programGenerator");
      const newDays = await generateWeek(weekNum, week.days.length, focus);
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

// ============================================================
// Main Dispatcher
// ============================================================

/**
 * Execute an agent function call. Returns data (read) or a proposal (write).
 */
export async function executeAction(
  functionName: string,
  args: Record<string, unknown>,
  uid: string
): Promise<ActionResult> {
  switch (functionName) {
    case "getActiveProgram":
      return handleGetActiveProgram(uid);
    case "swapExercise":
      return handleSwapExercise(uid, args);
    case "adjustVolume":
      return handleAdjustVolume(uid, args);
    case "skipWorkoutDay":
      return handleSkipWorkoutDay(uid, args);
    case "regenerateWeek":
      return handleRegenerateWeek(uid, args);
    default:
      return {
        type: "data",
        data: { error: `Unknown action: ${functionName}` },
      };
  }
}
