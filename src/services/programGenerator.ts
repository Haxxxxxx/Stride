// STRIDE Program Generator
// Uses LLM to generate personalized training programs from user profile data
// Falls back to a basic template if LLM fails

import { chatCompletionJSON, type LLMMessage } from "./llm";

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
  equipmentAccess?: string;
  gymAccess?: string;
  bodyProfile?: string;
  sportFocus?: string;
}

// ============================================================
// Program Generation
// ============================================================

function buildProgramPrompt(data: PersonalizationData): LLMMessage[] {
  const durationWeeks = 4;
  const daysPerWeek = getDaysPerWeek(data);

  const systemMessage: LLMMessage = {
    role: "system",
    content: `You are a professional fitness program designer for the STRIDE training system. You output ONLY valid JSON. No markdown, no explanation, no code blocks — just the raw JSON object.`,
  };

  const userMessage: LLMMessage = {
    role: "user",
    content: `Generate a ${durationWeeks}-week training program for an operator with:
- Goal: ${data.optimizationGoal || "general conditioning"}
- Experience: ${data.experience || "intermediate"}
- Equipment: ${data.equipmentAccess || "full gym"}${data.gymAccess ? ` (${data.gymAccess})` : ""}
- Session time: ${data.sessionTime || "30-45 min"}
- Training focuses: ${data.trainingFocuses?.join(", ") || "balanced"}
- Constraints: ${data.constraints?.length ? data.constraints.join(", ") : "none"}
${data.sportFocus ? `- Sport focus: ${data.sportFocus}` : ""}
- Training days per week: ${daysPerWeek}

Output this exact JSON structure:
{
  "name": "string - creative military-style program name",
  "durationWeeks": ${durationWeeks},
  "weeks": [
    {
      "weekNumber": 1,
      "days": [
        {
          "dayNumber": 1,
          "name": "string - workout name like 'Upper Power' or 'Conditioning Alpha'",
          "exercises": [
            {
              "name": "string - exercise name",
              "sets": 3,
              "reps": "string - like '12' or '30s' or '8-10'",
              "rest": "string - like '60s' or '90s'",
              "notes": "optional string"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Each day should have 4-7 exercises appropriate for the goal
- Progressive overload: slightly increase volume or intensity each week
- Include warm-up and cool-down exercises
- Match exercises to available equipment
- Keep session within the time constraint
- Use concise, professional exercise names`,
  };

  return [systemMessage, userMessage];
}

function getDaysPerWeek(data: PersonalizationData): number {
  const time = data.sessionTime || "";
  if (time.includes("6") || time.includes("7")) return 6;
  if (time.includes("5")) return 5;
  if (time.includes("4")) return 4;
  if (time.includes("2") || time.includes("1")) return 3;
  return 4; // default
}

/**
 * Generate a training program using LLM. Falls back to a template on failure.
 */
export async function generateProgram(data: PersonalizationData): Promise<Program> {
  try {
    const messages = buildProgramPrompt(data);
    const program = await chatCompletionJSON<Program>(messages, {
      temperature: 0.6,
      maxTokens: 4096,
      timeoutMs: 60000,
    });

    // Validate basic structure
    if (!program.name || !program.weeks?.length) {
      throw new Error("Invalid program structure");
    }

    return program;
  } catch (err) {
    console.warn("[ProgramGenerator] LLM failed, using fallback template:", err);
    return buildFallbackProgram(data);
  }
}

// ============================================================
// Fallback Template Program
// ============================================================

function buildFallbackProgram(data: PersonalizationData): Program {
  const daysPerWeek = getDaysPerWeek(data);
  const hasGym = data.equipmentAccess !== "none" && data.equipmentAccess !== "bodyweight";

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
        // Simple progressive overload: +1 rep or set per week
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
