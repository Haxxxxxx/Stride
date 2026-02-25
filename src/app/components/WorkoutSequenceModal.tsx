import { useState, useEffect, useRef, useCallback } from "react";
import { SystemMessage } from "./SystemMessage";
import { getRandomMessage, getPostWorkoutMessage } from "../utils/microLanguage";
import {
  recordWorkoutOpened,
  recordWorkoutStarted,
  recordHesitation,
  recordWorkoutCompleted,
  recordReflection,
} from "../utils/behaviorStore";
import { useAuth } from "../contexts/AuthContext";
import { setDocument } from "../../services/firestore";
import type { WorkoutDay, Exercise } from "../../services/programGenerator";

interface WorkoutSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutDay?: WorkoutDay | null;
}

export function WorkoutSequenceModal({ isOpen, onClose, workoutDay }: WorkoutSequenceModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "initializing" | "ready" | "active" | "paused" | "complete" | "reflection" | "encoded"
  >("initializing");
  const [timer, setTimer] = useState(0);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);

  // Derive exercise data from props or fallback
  const exercises: Exercise[] = workoutDay?.exercises ?? [
    { name: "Sit Up", sets: 3, reps: "15", rest: "60s" },
  ];
  const currentExercise = exercises[currentExerciseIdx] ?? exercises[0];
  const exerciseName = currentExercise?.name ?? "Exercise";
  const targetSets = currentExercise?.sets ?? 3;
  const targetReps = parseInt(String(currentExercise?.reps ?? "15"), 10) || 15;
  const workoutName = workoutDay?.name ?? "Workout";

  // Micro-language state
  const [startMessage, setStartMessage] = useState("");
  const [hesitationMessage, setHesitationMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [neuroplasticMessage, setNeuroplasticMessage] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [showHesitation, setShowHesitation] = useState(false);

  // Hesitation detection
  const hesitationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);

  // Friction Engineering: Intentional session start (no auto-start)
  // Slight pause before completion screen
  const completionDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if intensity was increased (for neuroplastic encoding)
  const [increasedIntensity] = useState(false);

  const clearHesitationTimer = useCallback(() => {
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStatus("initializing");
      setStartMessage("");
      setHesitationMessage("");
      setCompletionMessage("");
      setNeuroplasticMessage("");
      setReflectionText("");
      setShowHesitation(false);
      hasStartedRef.current = false;
      setTimer(0);
      setCurrentExerciseIdx(0);
      setCurrentSet(1);
      setCurrentRep(0);

      // Record workout opened
      recordWorkoutOpened();

      const timeout = setTimeout(() => {
        setStatus("ready");

        // Start hesitation detection (30-60 seconds idle on ready screen)
        hesitationTimerRef.current = setTimeout(() => {
          if (!hasStartedRef.current) {
            // Hesitation detected
            recordHesitation();
            setHesitationMessage(getRandomMessage("hesitation"));
            setShowHesitation(true);
          }
        }, 35000); // 35 seconds
      }, 2000);

      return () => {
        clearTimeout(timeout);
        clearHesitationTimer();
      };
    }
  }, [isOpen, clearHesitationTimer]);

  useEffect(() => {
    if (status === "active") {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHesitationTimer();
      if (completionDelayRef.current) {
        clearTimeout(completionDelayRef.current);
      }
    };
  }, [clearHesitationTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    hasStartedRef.current = true;
    clearHesitationTimer();
    setShowHesitation(false);

    // Record workout started
    recordWorkoutStarted();

    // Show workout start message
    setStartMessage(getRandomMessage("workoutStart"));

    setStatus("active");
  };

  const handlePause = () => {
    setStatus("paused");
  };

  const handleResume = () => {
    setStatus("active");
  };

  const handleComplete = () => {
    // Friction Engineering: slight pause before completion (1.5s)
    setStatus("initializing"); // brief loading state
    completionDelayRef.current = setTimeout(() => {
      // Record completion
      recordWorkoutCompleted();

      // Save workout log to Firestore
      if (user) {
        const logId = `log_${Date.now()}`;
        setDocument(`users/${user.uid}/workoutLogs/${logId}`, {
          workoutName,
          exercises: exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
          })),
          duration: timer,
          completedAt: new Date().toISOString(),
          completionType: currentExerciseIdx >= exercises.length - 1 ? "full" : "partial",
        }).catch(console.warn);
      }

      // Determine completion type
      const completedFull = currentExerciseIdx >= exercises.length - 1 && currentSet >= targetSets;

      // Set completion message
      setCompletionMessage(getRandomMessage("completion"));

      // Set neuroplastic encoding message
      setNeuroplasticMessage(getPostWorkoutMessage(completedFull, increasedIntensity));

      // Move to reflection phase (Friction Engineering: require 1-sentence reflection)
      setStatus("reflection");
    }, 1500);
  };

  const handleReflectionSubmit = () => {
    if (reflectionText.trim()) {
      recordReflection(reflectionText.trim(), workoutName);
    }
    setStatus("encoded");
  };

  const handleSkipReflection = () => {
    setStatus("encoded");
  };

  const handleRepComplete = () => {
    if (currentRep < targetReps) {
      setCurrentRep(currentRep + 1);
    } else {
      if (currentSet < targetSets) {
        setCurrentSet(currentSet + 1);
        setCurrentRep(0);
      } else if (currentExerciseIdx < exercises.length - 1) {
        // Advance to next exercise
        setCurrentExerciseIdx(currentExerciseIdx + 1);
        setCurrentSet(1);
        setCurrentRep(0);
      } else {
        handleComplete();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: "100% 4px",
        }}
      />

      <div className="relative w-full max-w-[375px] h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#ff6600] flex items-center justify-between shrink-0">
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
              Sequence Active
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[20px] text-[#ff6600] font-bold uppercase">
              [{String(currentExerciseIdx + 1).padStart(2, "0")}] {exerciseName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Banner */}
        {status === "initializing" && (
          <div className="p-4 border-b border-[#ff6600] bg-[#ff6600]/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#ff6600] animate-pulse" />
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
                System initializing... Loading parameters...
              </div>
            </div>
          </div>
        )}

        {status === "ready" && (
          <div className="p-4 border-b border-white/20 bg-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-white" />
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white uppercase tracking-wide">
                Ready to begin · Awaiting intent confirmation
              </div>
            </div>
          </div>
        )}

        {status === "active" && (
          <div className="p-4 border-b border-[#ff6600] bg-[#ff6600]/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#ff6600] animate-pulse" />
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
                Sequence in progress · Recording data
              </div>
            </div>
          </div>
        )}

        {status === "paused" && (
          <div className="p-4 border-b border-white/20 bg-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-white" />
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white uppercase tracking-wide">
                Sequence paused · Awaiting resume command
              </div>
            </div>
          </div>
        )}

        {status === "reflection" && (
          <div className="p-4 border-b border-[#ff6600] bg-[#ff6600]/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#ff6600]" />
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
                Operation complete · Reflection required
              </div>
            </div>
          </div>
        )}

        {(status === "complete" || status === "encoded") && (
          <div className="p-4 border-b border-white bg-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="size-4" fill="none" viewBox="0 0 18 18">
                <rect
                  x="1"
                  y="1"
                  width="16"
                  height="16"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M5 9L8 12L13 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  fill="none"
                />
              </svg>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white uppercase tracking-wide">
                Operation complete · Identity encoded
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Workout Start Message */}
          {startMessage && status === "active" && (
            <div className="mb-4">
              <SystemMessage
                message={startMessage}
                variant="identity"
                onDismiss={() => setStartMessage("")}
                autoDismiss={5000}
                showDismiss={false}
              />
            </div>
          )}

          {/* Hesitation Message */}
          {showHesitation && status === "ready" && (
            <div className="mb-4">
              <SystemMessage
                message={hesitationMessage}
                variant="friction"
                onDismiss={() => setShowHesitation(false)}
              />
            </div>
          )}

          {/* Reflection Phase */}
          {status === "reflection" && (
            <div className="space-y-4">
              {/* Completion Message */}
              {completionMessage && (
                <SystemMessage message={completionMessage} variant="identity" showDismiss={false} />
              )}

              {/* Reflection Input (Friction Engineering: require 1-sentence reflection) */}
              <div className="border-2 border-[#ff6600] p-5">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-[2px] mb-3">
                  Post-Session Reflection
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 mb-4">
                  One sentence. What did you observe?
                </div>
                <div className="border border-white/30 p-3 mb-3">
                  <input
                    type="text"
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="I noticed..."
                    maxLength={140}
                    className="w-full bg-transparent font-['JetBrains_Mono',monospace] text-[11px] text-white outline-none placeholder:text-white/30"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reflectionText.trim()) {
                        handleReflectionSubmit();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30">
                    {reflectionText.length}/140
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSkipReflection}
                      className="border border-white/20 px-3 py-1.5 font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase tracking-wide hover:bg-white/5 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleReflectionSubmit}
                      disabled={!reflectionText.trim()}
                      className={`border px-3 py-1.5 font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wide transition-colors ${
                        reflectionText.trim()
                          ? "border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/10"
                          : "border-white/10 text-white/20 cursor-not-allowed"
                      }`}
                    >
                      Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Neuroplastic Encoding Phase */}
          {status === "encoded" && (
            <div className="space-y-4">
              {/* Post-Workout Neuroplastic Encoding Message */}
              {neuroplasticMessage && (
                <div className="border-2 border-[#ff6600] bg-[#ff6600]/10 p-6 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-[3px] mb-4">
                    Identity Encoded
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white leading-[1.6]">
                    {neuroplasticMessage}
                  </div>
                  <div className="mt-4 h-[2px] bg-[#ff6600]/30 relative">
                    <div className="absolute inset-y-0 left-0 w-full bg-[#ff6600] animate-pulse" />
                  </div>
                </div>
              )}

              {/* Session Summary */}
              <div className="border border-white/20 p-4">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-3">
                  Session Data
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                      {formatTime(timer)}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase">
                      Duration
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                      {exercises.length}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase">
                      Exercises
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-['JetBrains_Mono',monospace] text-[16px] text-[#ff6600] font-bold">
                      {currentSet}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase">
                      Sets Done
                    </div>
                  </div>
                </div>
              </div>

              {/* Logged reflection if provided */}
              {reflectionText.trim() && (
                <div className="border-l-2 border-white/20 pl-3 py-2">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">
                    Reflection Logged
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/70 italic">
                    "{reflectionText}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard workout view (active/ready/paused) */}
          {(status === "active" || status === "ready" || status === "paused" || status === "initializing") && (
            <>
              {/* Timer Display */}
              <div className="border-2 border-white/20 p-6 mb-6 flex flex-col items-center justify-center">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-2 text-center">
                  Elapsed Time
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[48px] text-white font-bold tracking-wider text-center">
                  {formatTime(timer)}
                </div>
              </div>

              {/* Set/Rep Counter */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-[#ff6600] p-4 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider mb-2">
                    Current Set
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[36px] text-[#ff6600] font-bold">
                    {currentSet}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">
                    of {targetSets}
                  </div>
                </div>

                <div className="border border-white/20 p-4 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider mb-2">
                    Reps Done
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[36px] text-white font-bold">
                    {currentRep}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">
                    of {targetReps}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="border border-white/20 p-4 mb-6">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-3">
                  Set Progress
                </div>
                <div className="h-3 bg-white/10 relative mb-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#ff6600]"
                    style={{ width: `${(currentRep / targetReps) * 100}%` }}
                  />
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                  {Math.round((currentRep / targetReps) * 100)}% COMPLETE
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="border border-white/20 p-3 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase mb-1">
                    Total Reps
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                    {(currentSet - 1) * targetReps + currentRep}
                  </div>
                </div>
                <div className="border border-white/20 p-3 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase mb-1">
                    Exercise
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                    {currentExerciseIdx + 1}/{exercises.length}
                  </div>
                </div>
                <div className="border border-white/20 p-3 text-center">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase mb-1">
                    Elapsed
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                    {formatTime(timer)}
                  </div>
                </div>
              </div>

              {/* Intent Confirmation (Friction Engineering) */}
              {status === "ready" && (
                <div className="border-l-2 border-white/20 pl-4 py-2">
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                    Protocol — {exercises.length} modules
                  </div>
                  <ul className="space-y-1">
                    {exercises.map((ex, i) => (
                      <li key={i} className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
                        · [{String(i + 1).padStart(2, "0")}] {ex.name} — {ex.sets}x{ex.reps} ({ex.rest} rest)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t-2 border-[#ff6600] shrink-0 bg-black space-y-3">
          {status === "ready" && (
            <button
              onClick={handleStart}
              className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors"
            >
              Confirm Intent · Start Sequence
            </button>
          )}

          {status === "active" && (
            <>
              <button
                onClick={handleRepComplete}
                className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors"
              >
                Rep Complete [{currentRep + 1}]
              </button>
              <button
                onClick={handlePause}
                className="w-full border-2 border-white/30 text-white font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors"
              >
                Pause Sequence
              </button>
            </>
          )}

          {status === "paused" && (
            <>
              <button
                onClick={handleResume}
                className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors"
              >
                Resume Sequence
              </button>
              <button
                onClick={onClose}
                className="w-full border-2 border-white/30 text-white font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors"
              >
                End Session
              </button>
            </>
          )}

          {status === "encoded" && (
            <>
              <button
                onClick={onClose}
                className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors"
              >
                Return to Dashboard
              </button>
              <div className="text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Operation logged · Identity updated
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
