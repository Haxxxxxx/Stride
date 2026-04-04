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
    name: "addExercise",
    description: "Add a single exercise to a specific day without replacing the existing exercises. Use when the user says 'add squats to today' or 'I want to include deadlifts'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day (1-based)" },
        exerciseName: { type: SchemaType.STRING, description: "Exercise to add" },
        sets: { type: SchemaType.NUMBER, description: "Number of sets (default 3)" },
        reps: { type: SchemaType.STRING, description: "Reps per set (e.g. '10', '8-12')" },
        rest: { type: SchemaType.STRING, description: "Rest period (e.g. '60s', '90s')" },
      },
      required: ["weekNumber", "dayNumber", "exerciseName"],
    } as ObjectSchemaRequest,
  },
  {
    name: "removeExercise",
    description: "Remove a single exercise from a specific day without affecting other exercises. Use when the user says 'remove bench press' or 'take out lunges'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based)" },
        dayNumber: { type: SchemaType.NUMBER, description: "Day (1-based)" },
        exerciseName: { type: SchemaType.STRING, description: "Exercise name to remove" },
      },
      required: ["weekNumber", "dayNumber", "exerciseName"],
    } as ObjectSchemaRequest,
  },
  {
    name: "loadDayWorkout",
    description: "Load a specific day's workout from the user's program and make it startable RIGHT NOW — even if it's not today's scheduled day. Use when the user wants to DO a different day's workout (e.g. 'do day 2 instead', 'can I do legs today', 'switch to day 3', 'I want to train back today'). This does NOT modify the program — it just lets them start that day's session.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        weekNumber: { type: SchemaType.NUMBER, description: "Week (1-based). Use current week if not specified." },
        dayNumber: { type: SchemaType.NUMBER, description: "Day to load (1-based)" },
      },
      required: ["dayNumber"],
    } as ObjectSchemaRequest,
  },
  {
    name: "generateBonusWorkout",
    description: "Generate a custom ad-hoc bonus workout that does NOT modify the user's program. Use when the user wants an extra workout outside their scheduled training (e.g. 'give me an ab workout', 'I want to do some extra cardio', 'create a quick arms session'). Also use to MODIFY a previously generated bonus workout — regenerate with customInstructions (e.g. swap exercises, reorder). This is separate from the program.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        focus: { type: SchemaType.STRING, description: "Focus/muscle group for the bonus workout (e.g. 'abs', 'arms', 'cardio', 'upper body')" },
        exerciseCount: { type: SchemaType.NUMBER, description: "Number of exercises (default 4)" },
        customInstructions: { type: SchemaType.STRING, description: "Specific instructions for the workout (e.g. 'include cable crunches instead of ab rollouts', 'put cardio exercises last', 'no barbell exercises')" },
      },
      required: ["focus"],
    } as ObjectSchemaRequest,
  },
  {
    name: "logActivity",
    description: "Log a quick activity (run, walk, bike, swim, hike, yoga, sport, etc.) to the user's training history WITHOUT launching a full workout session. Use this when the user wants to RECORD an activity they did or are about to do, not when they want a structured workout generated.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activity: { type: SchemaType.STRING, description: "Activity name (e.g. '2-Mile Run', 'Morning Walk', '30min Bike Ride', 'Basketball')" },
        durationMinutes: { type: SchemaType.NUMBER, description: "Duration in minutes (optional, 0 if unknown)" },
        distance: { type: SchemaType.STRING, description: "Distance if applicable (e.g. '2 miles', '5km')" },
        notes: { type: SchemaType.STRING, description: "Any additional notes" },
      },
      required: ["activity"],
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
  {
    name: "getWorkoutHistory",
    description: "Get a summary of recent workout sessions. Use when the user asks 'show my recent workouts', 'what have I done this week', 'my workout history', or any general history request (not specific to one exercise — use getRecentPerformance for that).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: { type: SchemaType.NUMBER, description: "Number of recent workouts to fetch (default 10)" },
      },
      required: [],
    } as ObjectSchemaRequest,
  },
];

// ============================================================
// Keywords that indicate the user needs tool access
// ============================================================

// Patterns that CLEARLY indicate a program modification or data lookup request
// These are action-oriented: the user wants to DO something to their program
const TOOL_PATTERNS = [
  /\b(show|view|display)\s+(my\s+)?(program|protocol|schedule|routine)\b/i,       // show my program
  /\b(swap|replace|switch)\s+\w/i,                                                  // swap bench for...
  /\b(add|include|throw\s+in)\s+\w+\s+(to|in|into)\s+(my\s+)?(workout|day|program|today)\b/i, // add exercise
  /\b(remove|take\s+out|drop|cut)\s+\w/i,                                            // remove exercise
  /\b(change|edit|modify|update|redo|customize|regenerate)\s+(my\s+)?(program|protocol|day|week|workout|today|tomorrow)\b/i, // change my program
  /\b(adjust|increase|decrease|lower|raise|more|fewer)\s+(sets|reps|volume|rest|weight)\b/i, // adjust volume
  /\b(skip|cancel)\s+(today|tomorrow|this\s+day|my\s+workout)\b/i,                 // skip today
  /\b(deload|lighter\s+week|recovery\s+week|easier\s+week)\b/i,                    // deload
  /\b(generate|create|give\s+me|build|make)\s+(?:\w+\s+){0,6}(workout|session|routine|program)\b/i, // generate a workout
  /\b\d+\s*[-–]?\s*(module|exercise|move)\s+\w+\s+workout\b/i,                     // 8 module back workout
  /\b(how('s| is))\s+my\s+\w+\s+(progress|trending|doing)\b/i,                     // how's my bench progressing
  /\bshow\s+(my\s+)?(progress|performance|history|stats)\b/i,                       // show my progress
  /\b(what('s| is))\s+my\s+(program|protocol|schedule)\b/i,                         // what's my program
  /\bbonus\b.*\b(workout|session|calibration)\b/i,                                  // bonus cardio and ab workout/session
  /\b(let'?s|let\s+us)\s+(do|start|try|get)\b.*\b(workout|session|calibration)\b/i, // let's do a cardio session
  /\b(cardio|core|abs?|arms?|legs?|back|chest|shoulders?|upper|lower|full\s*body|hiit|stretching)\s+(workout|session|circuit)\b/i, // cardio session, core circuit
  /\b(do|switch|load|start|use)\s+(?:day\s+\d|session\s+\w)/i,                       // do day 2 / switch to session B
  /\bday\s+\d.*\b(instead|today|now)\b/i,                                            // day 2 instead / day 3 today
  /\b(instead|swap)\s+.*\bday\s+\d/i,                                               // instead do day 2
  /\b(log|track|record|add|went\s+for)\s+\w*\s*(run|walk|bike|ride|swim|hike|yoga|cardio|activity|mile|km)\b/i, // log activity
  /\b(i\s+(did|went|ran|walked|biked|swam|hiked))\b/i,                              // past tense activity
  /\bkeep\s+track\b/i,                                                              // keep track of it
  /\b(what('ve| have)\s+i\s+done|recent\s+workouts|workout\s+history|my\s+log|training\s+log)\b/i, // workout history
  /\b(show|view)\s+(my\s+)?(recent|last|past)\s+(workout|session|training)\b/i,     // show my recent workouts
  /\b(add|append)\s+.*\b(core|abs?)\b.*\b(to|into)\s+(my\s+)?(workout|protocol|today|program)\b/i, // add core/abs to workout
  /\bcore\s+circuit\b/i,                                                             // core circuit
];

/** Check if a user message likely needs tool access */
export function needsTools(message: string): boolean {
  return TOOL_PATTERNS.some(pattern => pattern.test(message));
}

// ============================================================
// Model & Chat Session Factory
// ============================================================

const CONVERSATIONAL_DIRECTIVE = "\n\nIMPORTANT: Always respond naturally and conversationally. Match the user's energy and detail level. If they ask a detailed question, give a detailed answer. If they chat casually, chat back. Never default to a generic response.";

/**
 * Create a Gemini model for agent chat WITH tools (program actions).
 * ~400-500 tokens more per call than chatModel.
 */
export function createAgentModel(systemInstruction: string): GenerativeModel {
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction: systemInstruction + CONVERSATIONAL_DIRECTIVE,
    tools: [{ functionDeclarations: agentTools }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
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
    systemInstruction: systemInstruction + CONVERSATIONAL_DIRECTIVE,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
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
