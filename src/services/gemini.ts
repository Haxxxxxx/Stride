// STRIDE Gemini Service
// Uses Firebase AI Logic (firebase/ai) for Gemini inference
// Two-tier model: chat (no tools, cheap) and agent (with tools, for program actions)

import {
  getAI,
  getGenerativeModel,
  VertexAIBackend,
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
// Initialize Firebase AI
// ============================================================

// VertexAIBackend uses Vertex AI quotas (pay-as-you-go) instead of
// GoogleAIBackend which caps at 20 RPD on the free tier.
const ai = getAI(app, { backend: new VertexAIBackend() });

const MODEL = "gemini-2.5-flash";

// ============================================================
// Tool Declarations (compact descriptions to save tokens)
// ============================================================

const agentTools: FunctionDeclaration[] = [
  {
    name: "getActiveProgram",
    description: "Fetch operator's active training program.",
    parameters: { type: SchemaType.OBJECT, properties: {} } as ObjectSchemaRequest,
  },
  {
    name: "swapExercise",
    description: "Replace one exercise with another.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day (1-based)" },
        exerciseName: { type: SchemaType.STRING, description: "Exercise to replace" },
        newExerciseName: { type: SchemaType.STRING, description: "New exercise" },
        newSets: { type: SchemaType.NUMBER, description: "Sets" },
        newReps: { type: SchemaType.STRING, description: "Reps (e.g. '12', '8-10')" },
        newRest: { type: SchemaType.STRING, description: "Rest (e.g. '60s')" },
      },
      required: ["weekNumber", "dayNumber", "exerciseName", "newExerciseName", "newSets", "newReps", "newRest"],
    } as ObjectSchemaRequest,
  },
  {
    name: "adjustVolume",
    description: "Change sets/reps/rest.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day (1-based)" },
        exerciseName: { type: SchemaType.STRING, description: "Exercise to modify" },
        sets: { type: SchemaType.NUMBER, description: "New sets (optional)" },
        reps: { type: SchemaType.STRING, description: "New reps (optional)" },
        rest: { type: SchemaType.STRING, description: "New rest (optional)" },
      },
      required: ["weekNumber", "dayNumber", "exerciseName"],
    } as ObjectSchemaRequest,
  },
  {
    name: "skipWorkoutDay",
    description: "Skip a day.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day to skip (1-based)" },
        reason: { type: SchemaType.STRING, description: "Reason" },
      },
      required: ["weekNumber", "dayNumber"],
    } as ObjectSchemaRequest,
  },
  {
    name: "regenerateDay",
    description: "Rebuild all exercises for one day.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day (1-based)" },
        focus: { type: SchemaType.STRING, description: "Focus/theme for the new day (e.g. 'chest and abs', 'legs', 'upper body push')" },
        exerciseCount: { type: SchemaType.NUMBER, description: "Number of exercises (default 5)" },
      },
      required: ["weekNumber", "dayNumber", "focus"],
    } as ObjectSchemaRequest,
  },
  {
    name: "regenerateWeek",
    description: "Rebuild entire week.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week to regenerate (1-based)" },
        focus: { type: SchemaType.STRING, description: "Optional focus area" },
      },
      required: ["weekNumber"],
    } as ObjectSchemaRequest,
  },
  {
    name: "generateDeloadWeek",
    description: "Create deload week (~60% volume).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week to base deload on (1-based)" },
      },
      required: ["weekNumber"],
    } as ObjectSchemaRequest,
  },
  {
    name: "getRecentPerformance",
    description: "Get exercise performance history.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        exerciseName: { type: SchemaType.STRING, description: "Exercise to look up (e.g. 'Bench Press')" },
        limit: { type: SchemaType.NUMBER, description: "Number of recent sessions to check (default 5)" },
      },
      required: ["exerciseName"],
    } as ObjectSchemaRequest,
  },
];

// ============================================================
// Keywords that indicate the user needs tool access
// ============================================================

const TOOL_KEYWORDS = /\b(program|protocol|schedule|exercise|swap|replace|change|adjust|volume|sets|reps|rest|skip|regenerate|edit|modify|show|week|day|workout|routine|training|plan|session|customize|update|redo|switch|remove|add|today|tomorrow|next|deload|recovery|lighter|easier|progress|performance|pr|weight|trend|history)\b/i;

/** Check if a user message likely needs tool access */
export function needsTools(message: string): boolean {
  return TOOL_KEYWORDS.test(message);
}

// ============================================================
// Model & Chat Session Factory
// ============================================================

/**
 * Create a Gemini model for agent chat WITH tools (program actions).
 * ~400-500 tokens more per call than chatModel.
 */
export function createAgentModel(systemInstruction: string): GenerativeModel {
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction,
    tools: [{ functionDeclarations: agentTools }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
    },
  });
}

/**
 * Create a Gemini model for agent chat WITHOUT tools (general conversation).
 * Saves ~400-500 tokens per call vs tool-enabled model.
 */
export function createChatModel(systemInstruction: string): GenerativeModel {
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction,
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
    model: MODEL,
    systemInstruction,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 4096,
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
