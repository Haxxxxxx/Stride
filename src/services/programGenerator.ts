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

/** Actual performance data captured per set during workout execution */
export interface ActualSetData {
  setNumber: number;
  weight: number;
  repsCompleted: number;
  rpe: number;            // 1-10 Rate of Perceived Exertion
  formQuality: number;    // 1-5
  pain: 'none' | 'mild' | 'moderate' | 'severe';
}

/** Rich exercise log saved to Firestore after workout */
export interface ExerciseLog {
  name: string;
  plannedSets: number;
  plannedReps: string;
  rest: string;
  actualSets: ActualSetData[];
}

/** Pre-workout readiness check */
export interface ReadinessData {
  sleepQuality: number;   // 1-5
  energyLevel: number;    // 1-5
  painReported: boolean;
  painLocation?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: Exercise[];
}

export interface Week {
  weekNumber: number;
  weekType?: 'accumulation' | 'intensification' | 'deload';
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
    // Feet stored as "5'9" — format as 5'9" for LLM readability
    const htDisplay = data.height.unit === "ft" && data.height.value.includes("'")
      ? `${data.height.value}"`
      : `${data.height.value} ${data.height.unit}`;
    lines.push(`- Height: ${htDisplay}`);
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
    `Periodization model (follow strictly):`,
    `- Week 1 (Accumulation): 3-4 sets, 10-15 reps. Build volume base. RPE 6-7.`,
    `- Week 2 (Accumulation): Add 1 set per compound. Volume peaks. RPE 7-8.`,
    `- Week 3 (Intensification): 4-5 sets, 6-10 reps, heavier loads. RPE 8-9.`,
    `- Week 4 (Deload): Reduce sets by 40% from Week 1. Same exercises. RPE 5-6.`,
    ``,
    `Exercise ordering per day (strict):`,
    `1. Warm-up/activation (1-2 movements, light)`,
    `2. Heavy compound lifts (2-3 movements) — MUST come first after warm-up`,
    `3. Accessory/isolation work (2-3 movements)`,
    `4. Finisher/conditioning (0-1 movement, skip if time-constrained)`,
    ``,
    `Rules:`,
    `- Each day should have 4-7 exercises appropriate for the goal and body profile`,
    `- Order exercises: heavy compounds before accessories, never isolation before compound`,
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
    let text = result.response.text();
    // Strip markdown code fences if present (Gemini often wraps JSON in ```json ... ```)
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
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
  focus?: string,
  personalization?: PersonalizationData
): Promise<WorkoutDay[]> {
  try {
    const model = createProgramModel(
      "You are a professional fitness program designer for the STRIDE training system. Generate structured workout days in JSON format."
    );

    const contextLines: string[] = [];
    if (personalization) {
      if (personalization.equipmentAccess) contextLines.push(`Available equipment: ${Array.isArray(personalization.equipmentAccess) ? personalization.equipmentAccess.join(", ") : personalization.equipmentAccess}`);
      if (personalization.constraints?.length) contextLines.push(`Constraints/injuries: ${personalization.constraints.join(", ")}`);
      if (personalization.sessionTime) contextLines.push(`Session time: ${personalization.sessionTime} min`);
      if (personalization.experience) contextLines.push(`Experience: ${personalization.experience}`);
      if (personalization.optimizationGoal) contextLines.push(`Goal: ${personalization.optimizationGoal}`);
    }

    const prompt = `Generate ${daysCount} workout days for week ${weekNumber} of a training program.
${focus ? `Focus: ${focus}` : "General balanced training."}
Each day should have 4-7 exercises with progressive overload appropriate for week ${weekNumber}.
${contextLines.length ? "\nOperator context:\n" + contextLines.join("\n") : ""}
Only prescribe exercises the operator can do with their available equipment.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // The schema returns a full Program — find the matching week or use first
    if (parsed.weeks?.length) {
      const match = parsed.weeks.find((w: { weekNumber?: number }) => w.weekNumber === weekNumber) ?? parsed.weeks[0];
      if (match?.days) return match.days;
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

/**
 * Generate exercises for a single day with a specific focus (used by regenerateDay agent action).
 */
export async function generateDay(
  focus: string,
  exerciseCount: number = 5,
  personalization?: PersonalizationData
): Promise<Exercise[]> {
  try {
    const model = createProgramModel(
      "You are a professional fitness program designer for the STRIDE training system. Generate structured workout data in JSON format."
    );

    const contextLines: string[] = [];
    if (personalization) {
      if (personalization.equipmentAccess) contextLines.push(`Available equipment: ${Array.isArray(personalization.equipmentAccess) ? personalization.equipmentAccess.join(", ") : personalization.equipmentAccess}`);
      if (personalization.constraints?.length) contextLines.push(`Constraints/injuries: ${personalization.constraints.join(", ")}`);
      if (personalization.sessionTime) contextLines.push(`Session time: ${personalization.sessionTime} min`);
      if (personalization.experience) contextLines.push(`Experience: ${personalization.experience}`);
    }

    const prompt = `Generate a single workout day focused on: ${focus}.
Include exactly ${exerciseCount} exercises. Use appropriate sets (3-5), reps, and rest times.
Match the focus area precisely — if the operator wants "chest and abs", all exercises should target chest or abs.
${contextLines.length ? "\nOperator context:\n" + contextLines.join("\n") : ""}
IMPORTANT: Only prescribe exercises the operator can do with their available equipment. Respect constraints.`;

    const result = await withTimeout(
      model.generateContent(prompt),
      30000,
      "Gemini day generation"
    );
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Extract exercises from the schema response — check all weeks/days for the data
    for (const week of parsed.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (day.exercises?.length) return day.exercises;
      }
    }
    throw new Error("Unexpected structure");
  } catch (err) {
    console.warn("[ProgramGenerator] generateDay failed, using fallback:", err);
    return buildFallbackDay(focus, exerciseCount);
  }
}

function buildFallbackDay(focus: string, count: number): Exercise[] {
  const lower = focus.toLowerCase();
  // Focus-aware fallback exercises
  const pools: Record<string, Exercise[]> = {
    chest: [
      { name: "Barbell Bench Press", sets: 4, reps: "8-10", rest: "90s" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10", rest: "60s" },
      { name: "Cable Chest Fly", sets: 3, reps: "12", rest: "45s" },
      { name: "Push-Ups", sets: 3, reps: "15", rest: "45s" },
      { name: "Dips (Chest)", sets: 3, reps: "10", rest: "60s" },
      { name: "Decline Bench Press", sets: 3, reps: "10", rest: "60s" },
    ],
    abs: [
      { name: "Cable Crunches", sets: 3, reps: "15", rest: "45s" },
      { name: "Hanging Leg Raises", sets: 3, reps: "12", rest: "45s" },
      { name: "Plank Hold", sets: 3, reps: "60s", rest: "30s" },
      { name: "Russian Twists", sets: 3, reps: "20", rest: "30s" },
      { name: "Ab Rollout", sets: 3, reps: "10", rest: "45s" },
    ],
    legs: [
      { name: "Barbell Squats", sets: 4, reps: "8", rest: "120s" },
      { name: "Romanian Deadlift", sets: 3, reps: "10", rest: "90s" },
      { name: "Leg Press", sets: 3, reps: "12", rest: "90s" },
      { name: "Leg Curl", sets: 3, reps: "12", rest: "60s" },
      { name: "Calf Raises", sets: 4, reps: "15", rest: "45s" },
      { name: "Walking Lunges", sets: 3, reps: "12 each", rest: "60s" },
    ],
    back: [
      { name: "Barbell Rows", sets: 4, reps: "8-10", rest: "90s" },
      { name: "Lat Pulldown", sets: 3, reps: "12", rest: "60s" },
      { name: "Cable Rows", sets: 3, reps: "12", rest: "60s" },
      { name: "Face Pulls", sets: 3, reps: "15", rest: "45s" },
      { name: "Dumbbell Rows", sets: 3, reps: "10", rest: "60s" },
    ],
    shoulders: [
      { name: "Overhead Press", sets: 4, reps: "8-10", rest: "90s" },
      { name: "Lateral Raises", sets: 3, reps: "15", rest: "45s" },
      { name: "Face Pulls", sets: 3, reps: "15", rest: "45s" },
      { name: "Front Raises", sets: 3, reps: "12", rest: "45s" },
      { name: "Rear Delt Fly", sets: 3, reps: "15", rest: "45s" },
    ],
    arms: [
      { name: "Bicep Curls", sets: 3, reps: "12", rest: "45s" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12", rest: "45s" },
      { name: "Hammer Curls", sets: 3, reps: "10", rest: "45s" },
      { name: "Overhead Tricep Extension", sets: 3, reps: "12", rest: "45s" },
      { name: "Preacher Curls", sets: 3, reps: "10", rest: "45s" },
    ],
    cardio: [
      { name: "Treadmill HIIT", sets: 1, reps: "20-30 min (30s sprint, 90s active recovery)", rest: "N/A" },
      { name: "Jump Rope", sets: 4, reps: "3 min", rest: "60s" },
      { name: "Rowing Machine", sets: 1, reps: "15-20 min", rest: "N/A" },
      { name: "Burpees", sets: 4, reps: "15", rest: "45s" },
      { name: "Mountain Climbers", sets: 4, reps: "30", rest: "30s" },
      { name: "Battle Ropes", sets: 4, reps: "30s", rest: "45s" },
    ],
  };

  // Collect exercises from matching focus areas
  const selected: Exercise[] = [];
  for (const [key, exercises] of Object.entries(pools)) {
    if (lower.includes(key)) {
      selected.push(...exercises);
    }
  }

  // If no match, use general mix
  if (selected.length === 0) {
    selected.push(
      ...pools.chest.slice(0, 2),
      ...pools.legs.slice(0, 2),
      ...pools.abs.slice(0, 1),
    );
  }

  return selected.slice(0, count);
}

// ============================================================
// Fallback Template Program
// ============================================================

/** Reduce rep range for intensification weeks (e.g. "10-15" → "6-10", "15" → "10") */
function lowerReps(reps: string): string {
  // Handle ranges like "8-10"
  const rangeMatch = reps.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const low = Math.max(4, parseInt(rangeMatch[1]) - 3);
    const high = Math.max(low + 2, parseInt(rangeMatch[2]) - 3);
    return `${low}-${high}`;
  }
  // Handle single numbers
  const num = parseInt(reps);
  if (!isNaN(num)) return String(Math.max(4, num - 4));
  return reps; // non-numeric (e.g. "45s" for planks)
}

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

  // Periodization: Week 1-2 accumulation, Week 3 intensification, Week 4 deload
  const weekTypes: Array<Week["weekType"]> = ['accumulation', 'accumulation', 'intensification', 'deload'];

  const weeks: Week[] = Array.from({ length: 4 }, (_, wi) => {
    const weekType = weekTypes[wi];
    return {
      weekNumber: wi + 1,
      weekType,
      days: Array.from({ length: Math.min(daysPerWeek, exercisePool.length) }, (_, di) => ({
        dayNumber: di + 1,
        name: `Session ${String.fromCharCode(65 + di)}`,
        exercises: exercisePool[di % exercisePool.length].map((ex) => {
          switch (weekType) {
            case 'accumulation':
              // Week 1: base, Week 2: +1 set
              return { ...ex, sets: ex.sets + (wi === 1 ? 1 : 0) };
            case 'intensification':
              // Week 3: same sets as week 2, lower reps (heavier)
              return {
                ...ex,
                sets: ex.sets + 1,
                reps: lowerReps(ex.reps),
              };
            case 'deload':
              // Week 4: reduce sets by ~40%, keep reps moderate
              return { ...ex, sets: Math.max(2, Math.ceil(ex.sets * 0.6)) };
            default:
              return ex;
          }
        }),
      })),
    };
  });

  return {
    name: "Operation Baseline",
    durationWeeks: 4,
    weeks,
  };
}
