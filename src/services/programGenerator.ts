// STRIDE Program Generator
// Uses Gemini via Firebase AI Logic for personalized training programs
// Falls back to a basic template if Gemini fails

import { createProgramModel } from "./gemini";

// ============================================================
// Types
// ============================================================

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: Exercise[];
}

export interface Week {
  weekNumber: number;
  days: WorkoutDay[];
}

export interface Program {
  name: string;
  durationWeeks: number;
  weeks: Week[];
}

export interface PersonalizationData {
  optimizationGoal?: string;
  experience?: string;
  constraints?: string[];
  sessionTime?: string;
  trainingFocuses?: string[];
  equipmentAccess?: string[] | string;
  gymAccess?: string;
  bodyProfile?: string;
  sportFocus?: string[] | string;
  height?: { value: string; unit: string };
  weight?: { value: string; unit: string };
  goalWeight?: { value: string; unit: string };
}

// ============================================================
// Program Generation
// ============================================================

function getDaysPerWeek(data: PersonalizationData): number {
  switch (data.experience) {
    case "beginner":
    case "inconsistent":
      return 3;
    case "intermediate":
      return 4;
    case "advanced":
      return 5;
    default:
      return 4;
  }
}

function formatList(val: string[] | string | undefined, fallback: string): string {
  if (!val) return fallback;
  return Array.isArray(val) ? (val.length ? val.join(", ") : fallback) : val;
}

function formatSessionTime(val?: string): string {
  if (!val) return "30-45 min";
  // Values are "10-20", "20-40", "40+"
  return `${val} min`;
}

function buildPromptText(data: PersonalizationData): string {
  const durationWeeks = 4;
  const daysPerWeek = getDaysPerWeek(data);

  const lines: string[] = [
    `Generate a ${durationWeeks}-week training program for an operator with:`,
    `- Body profile: ${data.bodyProfile || "unspecified"}`,
    `- Goal: ${data.optimizationGoal || "general conditioning"}`,
    `- Experience level: ${data.experience || "intermediate"}`,
  ];

  if (data.height?.value) {
    lines.push(`- Height: ${data.height.value} ${data.height.unit}`);
  }
  if (data.weight?.value) {
    lines.push(`- Weight: ${data.weight.value} ${data.weight.unit}`);
  }
  if (data.goalWeight?.value) {
    lines.push(`- Goal weight: ${data.goalWeight.value} ${data.goalWeight.unit}`);
  }

  lines.push(
    `- Available equipment: ${formatList(data.equipmentAccess, "full gym")}${data.gymAccess ? ` (${data.gymAccess} gym)` : ""}`,
    `- Session time: ${formatSessionTime(data.sessionTime)}`,
    `- Training focuses: ${formatList(data.trainingFocuses, "balanced")}`,
    `- Constraints/limitations: ${data.constraints?.length ? data.constraints.join(", ") : "none"}`,
  );

  const sport = formatList(data.sportFocus, "");
  if (sport) {
    lines.push(`- Sport focus: ${sport}`);
  }

  lines.push(
    `- Training days per week: ${daysPerWeek}`,
    ``,
    `Rules:`,
    `- Each day should have 4-7 exercises appropriate for the goal and body profile`,
    `- Progressive overload: slightly increase volume or intensity each week`,
    `- Include warm-up movements at the start of each session`,
    `- Match exercises to available equipment only — do not prescribe equipment the operator doesn't have`,
    `- Keep each session within the ${formatSessionTime(data.sessionTime)} time constraint`,
    `- If the operator has constraints (injury, time, energy), adjust exercise selection and intensity accordingly`,
    `- Use concise, professional exercise names`,
    `- Give the program a creative military-style name`,
  );

  return lines.join("\n");
}

/** Race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Generate a training program using Gemini (primary) → template fallback.
 */
export async function generateProgram(data: PersonalizationData): Promise<Program> {
  try {
    const model = createProgramModel(
      "You are a professional fitness program designer for the STRIDE training system. Generate structured training programs in JSON format."
    );
    const result = await withTimeout(
      model.generateContent(buildPromptText(data)),
      45000,
      "Gemini program generation"
    );
    const text = result.response.text();
    const program = JSON.parse(text) as Program;

    if (!program.name || !program.weeks?.length) {
      throw new Error("Invalid program structure from Gemini");
    }
    return program;
  } catch (err) {
    console.warn("[ProgramGenerator] Gemini failed, using template fallback:", err);
  }

  return buildFallbackProgram(data);
}

/**
 * Generate a single week of workouts (used by regenerateWeek agent action).
 */
export async function generateWeek(
  weekNumber: number,
  daysCount: number,
  focus?: string
): Promise<WorkoutDay[]> {
  try {
    const model = createProgramModel(
      "You are a professional fitness program designer for the STRIDE training system. Generate structured workout days in JSON format."
    );

    const prompt = `Generate ${daysCount} workout days for week ${weekNumber} of a training program.
${focus ? `Focus: ${focus}` : "General balanced training."}
Each day should have 4-7 exercises with progressive overload appropriate for week ${weekNumber}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // The schema returns a full Program, extract the week's days
    if (parsed.weeks?.[0]?.days) {
      return parsed.weeks[0].days;
    }
    throw new Error("Unexpected structure");
  } catch (err) {
    console.warn("[ProgramGenerator] generateWeek failed, using fallback:", err);
    // Return simple fallback days
    return Array.from({ length: daysCount }, (_, i) => ({
      dayNumber: i + 1,
      name: `Session ${String.fromCharCode(65 + i)}`,
      exercises: [
        { name: "Push-Ups", sets: 3, reps: "15", rest: "60s" },
        { name: "Bodyweight Squats", sets: 3, reps: "20", rest: "60s" },
        { name: "Plank Hold", sets: 3, reps: "45s", rest: "45s" },
        { name: "Lunges", sets: 3, reps: "12 each", rest: "60s" },
        { name: "Mountain Climbers", sets: 3, reps: "20", rest: "45s" },
      ],
    }));
  }
}

// ============================================================
// Fallback Template Program
// ============================================================

function buildFallbackProgram(data: PersonalizationData): Program {
  const daysPerWeek = getDaysPerWeek(data);
  const equipment = Array.isArray(data.equipmentAccess) ? data.equipmentAccess : [data.equipmentAccess];
  const hasGym = equipment.some((e) => e && e !== "bodyweight");

  const bodyweightExercises: Exercise[][] = [
    [
      { name: "Push-Ups", sets: 3, reps: "15", rest: "60s" },
      { name: "Bodyweight Squats", sets: 3, reps: "20", rest: "60s" },
      { name: "Plank Hold", sets: 3, reps: "45s", rest: "45s" },
      { name: "Lunges", sets: 3, reps: "12 each", rest: "60s" },
      { name: "Mountain Climbers", sets: 3, reps: "20", rest: "45s" },
    ],
    [
      { name: "Diamond Push-Ups", sets: 3, reps: "12", rest: "60s" },
      { name: "Jump Squats", sets: 3, reps: "15", rest: "60s" },
      { name: "Side Plank", sets: 3, reps: "30s each", rest: "45s" },
      { name: "Glute Bridges", sets: 3, reps: "15", rest: "45s" },
      { name: "Burpees", sets: 3, reps: "10", rest: "90s" },
    ],
    [
      { name: "Pike Push-Ups", sets: 3, reps: "10", rest: "60s" },
      { name: "Bulgarian Split Squats", sets: 3, reps: "10 each", rest: "60s" },
      { name: "Superman Hold", sets: 3, reps: "30s", rest: "45s" },
      { name: "Calf Raises", sets: 3, reps: "20", rest: "30s" },
      { name: "High Knees", sets: 3, reps: "30s", rest: "45s" },
    ],
  ];

  const gymExercises: Exercise[][] = [
    [
      { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "90s" },
      { name: "Dumbbell Rows", sets: 4, reps: "10", rest: "60s" },
      { name: "Overhead Press", sets: 3, reps: "10", rest: "60s" },
      { name: "Lat Pulldown", sets: 3, reps: "12", rest: "60s" },
      { name: "Face Pulls", sets: 3, reps: "15", rest: "45s" },
    ],
    [
      { name: "Barbell Squats", sets: 4, reps: "8", rest: "120s" },
      { name: "Romanian Deadlift", sets: 3, reps: "10", rest: "90s" },
      { name: "Leg Press", sets: 3, reps: "12", rest: "90s" },
      { name: "Leg Curl", sets: 3, reps: "12", rest: "60s" },
      { name: "Calf Raises", sets: 4, reps: "15", rest: "45s" },
    ],
    [
      { name: "Incline Dumbbell Press", sets: 3, reps: "10", rest: "60s" },
      { name: "Cable Rows", sets: 3, reps: "12", rest: "60s" },
      { name: "Lateral Raises", sets: 3, reps: "15", rest: "45s" },
      { name: "Bicep Curls", sets: 3, reps: "12", rest: "45s" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12", rest: "45s" },
    ],
  ];

  const exercisePool = hasGym ? gymExercises : bodyweightExercises;

  const weeks: Week[] = Array.from({ length: 4 }, (_, wi) => ({
    weekNumber: wi + 1,
    days: Array.from({ length: Math.min(daysPerWeek, exercisePool.length) }, (_, di) => ({
      dayNumber: di + 1,
      name: `Session ${String.fromCharCode(65 + di)}`,
      exercises: exercisePool[di % exercisePool.length].map((ex) => ({
        ...ex,
        sets: ex.sets + Math.floor(wi / 2),
      })),
    })),
  }));

  return {
    name: "Operation Baseline",
    durationWeeks: 4,
    weeks,
  };
}
