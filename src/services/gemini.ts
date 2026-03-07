// STRIDE Gemini Service
// Uses Firebase AI Logic (firebase/ai) for Gemini inference — zero infrastructure, works in production
// Supports function calling for agentic actions on user programs

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  SchemaType,
  type FunctionDeclaration,
  type Content,
  type ChatSession,
  type GenerativeModel,
  type ObjectSchemaRequest,
} from "firebase/ai";
import { app } from "./firebase";
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ============================================================
// Initialize Firebase AI (Google AI backend — Gemini Developer API, fast + free tier)
// ============================================================

const ai = getAI(app, { backend: new GoogleAIBackend() });

// ============================================================
// Tool Declarations for Agentic Actions
// ============================================================

const agentTools: FunctionDeclaration[] = [
  {
    name: "getActiveProgram",
    description:
      "Retrieve the operator's current active training program including all weeks, days, and exercises. Use this when the operator asks about their program, schedule, or exercises.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    } as ObjectSchemaRequest,
  },
  {
    name: "swapExercise",
    description:
      "Replace one exercise with another in the operator's program. Use when the operator asks to swap, replace, or change a specific exercise.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: {
          type: SchemaType.NUMBER,
          description: "The week number (1-based)",
        },
        dayNumber: {
          type: SchemaType.NUMBER,
          description: "The day number within the week (1-based)",
        },
        exerciseName: {
          type: SchemaType.STRING,
          description: "The current exercise name to replace",
        },
        newExerciseName: {
          type: SchemaType.STRING,
          description: "The new exercise name",
        },
        newSets: {
          type: SchemaType.NUMBER,
          description: "Number of sets for the new exercise",
        },
        newReps: {
          type: SchemaType.STRING,
          description: "Reps for the new exercise (e.g. '12' or '8-10' or '30s')",
        },
        newRest: {
          type: SchemaType.STRING,
          description: "Rest period (e.g. '60s' or '90s')",
        },
      },
      required: [
        "weekNumber",
        "dayNumber",
        "exerciseName",
        "newExerciseName",
        "newSets",
        "newReps",
        "newRest",
      ],
    } as ObjectSchemaRequest,
  },
  {
    name: "adjustVolume",
    description:
      "Change sets, reps, or rest for a specific exercise. Use when the operator asks to increase/decrease volume, change sets, reps, or rest times.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: {
          type: SchemaType.NUMBER,
          description: "The week number (1-based)",
        },
        dayNumber: {
          type: SchemaType.NUMBER,
          description: "The day number within the week (1-based)",
        },
        exerciseName: {
          type: SchemaType.STRING,
          description: "The exercise to modify",
        },
        sets: {
          type: SchemaType.NUMBER,
          description: "New number of sets (optional, omit to keep current)",
        },
        reps: {
          type: SchemaType.STRING,
          description: "New reps (optional, omit to keep current)",
        },
        rest: {
          type: SchemaType.STRING,
          description: "New rest period (optional, omit to keep current)",
        },
      },
      required: ["weekNumber", "dayNumber", "exerciseName"],
    } as ObjectSchemaRequest,
  },
  {
    name: "skipWorkoutDay",
    description:
      "Skip or reschedule a workout day. Use when the operator says they want to skip a day or can't train on a specific day.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: {
          type: SchemaType.NUMBER,
          description: "The week number (1-based)",
        },
        dayNumber: {
          type: SchemaType.NUMBER,
          description: "The day number to skip (1-based)",
        },
        reason: {
          type: SchemaType.STRING,
          description: "Reason for skipping",
        },
      },
      required: ["weekNumber", "dayNumber"],
    } as ObjectSchemaRequest,
  },
  {
    name: "regenerateWeek",
    description:
      "Regenerate all workouts for a specific week. Use when the operator wants a completely new week of training or a major overhaul.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: {
          type: SchemaType.NUMBER,
          description: "The week number to regenerate (1-based)",
        },
        focus: {
          type: SchemaType.STRING,
          description:
            "Optional focus area or adjustment note for the regenerated week",
        },
      },
      required: ["weekNumber"],
    } as ObjectSchemaRequest,
  },
];

// ============================================================
// Model & Chat Session Factory
// ============================================================

/**
 * Create a Gemini model configured for agent conversation with function calling.
 */
export function createAgentModel(systemInstruction: string): GenerativeModel {
  return getGenerativeModel(ai, {
    model: "gemini-2.5-flash-lite",
    systemInstruction,
    tools: [{ functionDeclarations: agentTools }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
    },
  });
}

/**
 * Create a Gemini model for structured JSON program generation.
 */
export function createProgramModel(systemInstruction: string): GenerativeModel {
  return getGenerativeModel(ai, {
    model: "gemini-2.5-flash-lite",
    systemInstruction,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          durationWeeks: { type: SchemaType.NUMBER },
          weeks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                weekNumber: { type: SchemaType.NUMBER },
                days: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      dayNumber: { type: SchemaType.NUMBER },
                      name: { type: SchemaType.STRING },
                      exercises: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            name: { type: SchemaType.STRING },
                            sets: { type: SchemaType.NUMBER },
                            reps: { type: SchemaType.STRING },
                            rest: { type: SchemaType.STRING },
                            notes: { type: SchemaType.STRING },
                          },
                          required: ["name", "sets", "reps", "rest"],
                        },
                      },
                    },
                    required: ["dayNumber", "name", "exercises"],
                  },
                },
              },
              required: ["weekNumber", "days"],
            },
          },
        },
        required: ["name", "durationWeeks", "weeks"],
      },
    },
  });
}

/**
 * Start a multi-turn chat session with a Gemini model.
 */
export function startAgentChat(
  model: GenerativeModel,
  history?: Content[]
): ChatSession {
  return model.startChat(history ? { history } : undefined);
}

export type { ChatSession, GenerativeModel, Content };
