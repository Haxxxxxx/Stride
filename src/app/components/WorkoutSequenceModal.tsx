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
import { notifyWorkoutComplete } from "../../services/notifications";
import type { WorkoutDay, Exercise, ActualSetData, ExerciseLog, ReadinessData } from "../../services/programGenerator";

interface WorkoutSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutDay?: WorkoutDay | null;
}

const MONO = "font-['JetBrains_Mono',monospace]";

export function WorkoutSequenceModal({ isOpen, onClose, workoutDay }: WorkoutSequenceModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "initializing" | "ready" | "readiness" | "active" | "setLog" | "paused" | "complete" | "reflection" | "encoded"
  >("initializing");
  const [timer, setTimer] = useState(0);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  // Derive exercise data from props or fallback
  const exercises: Exercise[] = (workoutDay?.exercises?.length ? workoutDay.exercises : null) ?? [
    { name: "Sit Up", sets: 3, reps: "15", rest: "60s" },
  ];
  const currentExercise = exercises[currentExerciseIdx] ?? exercises[0];
  const exerciseName = currentExercise?.name ?? "Exercise";
  const targetSets = currentExercise?.sets ?? 3;
  const targetReps = parseInt(String(currentExercise?.reps ?? "15"), 10) || 15;
  const workoutName = workoutDay?.name ?? "Workout";

  // ============================================================
  // Readiness Check State
  // ============================================================
  const [readiness, setReadiness] = useState<ReadinessData>({
    sleepQuality: 0,
    energyLevel: 0,
    painReported: false,
    painLocation: "",
  });

  // ============================================================
  // Performance Capture State
  // ============================================================
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [setWeight, setSetWeight] = useState(0);
  const [setReps, setSetReps] = useState(targetReps);
  const [setRPE, setSetRPE] = useState(7);
  const [setForm, setSetForm] = useState<number>(3); // 1=rough, 3=ok, 5=clean
  const [setPain, setSetPain] = useState<ActualSetData["pain"]>("none");
  const [currentSetData, setCurrentSetData] = useState<ActualSetData[]>([]);

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
  const completionDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setExerciseLogs([]);
      setCurrentSetData([]);
      setReadiness({ sleepQuality: 0, energyLevel: 0, painReported: false, painLocation: "" });

      recordWorkoutOpened();

      const timeout = setTimeout(() => {
        setStatus("ready");
        hesitationTimerRef.current = setTimeout(() => {
          if (!hasStartedRef.current) {
            recordHesitation();
            setHesitationMessage(getRandomMessage("hesitation"));
            setShowHesitation(true);
          }
        }, 35000);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        clearHesitationTimer();
      };
    }
  }, [isOpen, clearHesitationTimer]);

  useEffect(() => {
    if (status === "active" || status === "setLog") {
      const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    return () => {
      clearHesitationTimer();
      if (completionDelayRef.current) clearTimeout(completionDelayRef.current);
    };
  }, [clearHesitationTimer]);

  // Reset set inputs when exercise changes
  useEffect(() => {
    setSetReps(targetReps);
    setSetRPE(7);
    setSetForm(3);
    setSetPain("none");
    setCurrentSetData([]);
  }, [currentExerciseIdx, targetReps]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================================
  // Readiness → Start
  // ============================================================
  const handleConfirmIntent = () => {
    hasStartedRef.current = true;
    clearHesitationTimer();
    setShowHesitation(false);
    setStatus("readiness");
  };

  const handleReadinessComplete = () => {
    recordWorkoutStarted();
    setStartMessage(getRandomMessage("workoutStart"));
    setStatus("active");
  };

  const handlePause = () => setStatus("paused");
  const handleResume = () => setStatus("active");

  // ============================================================
  // Set-Based Logging
  // ============================================================
  const handleSetComplete = () => {
    // Switch to set log screen to capture data
    setStatus("setLog");
  };

  const handleLogSet = () => {
    const setData: ActualSetData = {
      setNumber: currentSet,
      weight: setWeight,
      repsCompleted: setReps,
      rpe: setRPE,
      formQuality: setForm,
      pain: setPain,
    };

    const updatedSetData = [...currentSetData, setData];
    setCurrentSetData(updatedSetData);

    // Pain safety check
    if (setPain === "severe") {
      // Auto-complete exercise, move to next
      finalizeExercise(updatedSetData);
      return;
    }

    if (currentSet < targetSets) {
      setCurrentSet(currentSet + 1);
      // Carry weight forward
      setStatus("active");
    } else {
      // Exercise complete, finalize and advance
      finalizeExercise(updatedSetData);
    }
  };

  const finalizeExercise = (setData: ActualSetData[]) => {
    const log: ExerciseLog = {
      name: exerciseName,
      plannedSets: targetSets,
      plannedReps: String(currentExercise?.reps ?? targetReps),
      rest: currentExercise?.rest ?? "60s",
      actualSets: setData,
    };

    if (currentExerciseIdx < exercises.length - 1) {
      setExerciseLogs((prev) => [...prev, log]);
      setCurrentExerciseIdx(currentExerciseIdx + 1);
      setCurrentSet(1);
      setCurrentSetData([]);
      setStatus("active");
    } else {
      // Last exercise — build final logs array synchronously to avoid stale state
      const finalLogs = [...exerciseLogs, log];
      setExerciseLogs(finalLogs);
      handleComplete(finalLogs);
    }
  };

  const handleComplete = (finalLogs: ExerciseLog[]) => {
    setStatus("initializing");
    completionDelayRef.current = setTimeout(() => {
      recordWorkoutCompleted();

      // Calculate total volume
      const totalVolume = finalLogs.reduce((sum, ex) =>
        sum + ex.actualSets.reduce((s, set) => s + set.weight * set.repsCompleted, 0), 0
      );
      const avgRPE = finalLogs.length > 0
        ? finalLogs.reduce((sum, ex) =>
            sum + ex.actualSets.reduce((s, set) => s + set.rpe, 0) / Math.max(ex.actualSets.length, 1), 0
          ) / finalLogs.length
        : 0;

      if (user) {
        const logId = `log_${Date.now()}`;
        setDocument(`users/${user.uid}/workoutLogs/${logId}`, {
          workoutName,
          exercises: finalLogs,
          duration: timer,
          completedAt: new Date().toISOString(),
          completionType: finalLogs.length >= exercises.length ? "full" : "partial",
          readiness,
          totalVolume,
          avgRPE: Math.round(avgRPE * 10) / 10,
        }).catch(console.warn);

        notifyWorkoutComplete(user.uid, workoutName, timer).catch(console.warn);
      }

      const completedFull = currentExerciseIdx >= exercises.length - 1 && currentSet >= targetSets;
      setCompletionMessage(getRandomMessage("completion"));
      setNeuroplasticMessage(getPostWorkoutMessage(completedFull, increasedIntensity));
      setStatus("reflection");
    }, 1500);
  };

  const handleReflectionSubmit = () => {
    if (reflectionText.trim()) recordReflection(reflectionText.trim(), workoutName);
    setStatus("encoded");
  };
  const handleSkipReflection = () => setStatus("encoded");

  if (!isOpen) return null;

  // Calculate total sets done so far across all exercises
  const totalSetsDone = exerciseLogs.reduce((sum, ex) => sum + ex.actualSets.length, 0) + (currentSet - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Scanlines */}
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
            <div className={`${MONO} text-[10px] text-white/60 uppercase tracking-[2px]`}>
              Sequence Active
            </div>
            <div className={`${MONO} text-[20px] text-[#ff6600] font-bold uppercase truncate max-w-[280px]`}>
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
        <StatusBanner status={status} />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Workout Start Message */}
          {startMessage && status === "active" && (
            <div className="mb-4">
              <SystemMessage message={startMessage} variant="identity" onDismiss={() => setStartMessage("")} autoDismiss={5000} showDismiss={false} />
            </div>
          )}

          {/* Hesitation Message */}
          {showHesitation && status === "ready" && (
            <div className="mb-4">
              <SystemMessage message={hesitationMessage} variant="friction" onDismiss={() => setShowHesitation(false)} />
            </div>
          )}

          {/* ============================================================ */}
          {/* READINESS CHECK PHASE */}
          {/* ============================================================ */}
          {status === "readiness" && (
            <div className="space-y-5">
              <div className={`${MONO} text-[9px] text-[#ff6600] uppercase tracking-[2px] mb-2`}>
                Pre-Session Diagnostic
              </div>

              {/* Sleep Quality */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wider mb-3`}>
                  Sleep Calibration
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setReadiness((r) => ({ ...r, sleepQuality: n }))}
                      className={`flex-1 py-3 border ${MONO} text-[14px] font-bold transition-colors ${
                        readiness.sleepQuality === n
                          ? "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                          : "border-white/20 text-white/40 hover:border-white/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className={`${MONO} text-[7px] text-white/30 mt-1 flex justify-between`}>
                  <span>MINIMAL</span><span>OPTIMAL</span>
                </div>
              </div>

              {/* Energy Level */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wider mb-3`}>
                  Energy Status
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setReadiness((r) => ({ ...r, energyLevel: n }))}
                      className={`flex-1 py-3 border ${MONO} text-[14px] font-bold transition-colors ${
                        readiness.energyLevel === n
                          ? "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                          : "border-white/20 text-white/40 hover:border-white/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className={`${MONO} text-[7px] text-white/30 mt-1 flex justify-between`}>
                  <span>DEPLETED</span><span>CHARGED</span>
                </div>
              </div>

              {/* Pain Check */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wider mb-3`}>
                  Injury Scan
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReadiness((r) => ({ ...r, painReported: false, painLocation: "" }))}
                    className={`flex-1 py-3 border ${MONO} text-[10px] font-bold uppercase transition-colors ${
                      !readiness.painReported
                        ? "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                        : "border-white/20 text-white/40 hover:border-white/40"
                    }`}
                  >
                    Negative
                  </button>
                  <button
                    onClick={() => setReadiness((r) => ({ ...r, painReported: true }))}
                    className={`flex-1 py-3 border ${MONO} text-[10px] font-bold uppercase transition-colors ${
                      readiness.painReported
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : "border-white/20 text-white/40 hover:border-white/40"
                    }`}
                  >
                    Affirmative
                  </button>
                </div>
                {readiness.painReported && (
                  <div className="mt-3 border border-white/20 p-2">
                    <input
                      type="text"
                      value={readiness.painLocation || ""}
                      onChange={(e) => setReadiness((r) => ({ ...r, painLocation: e.target.value }))}
                      placeholder="Location (e.g., left shoulder)"
                      maxLength={50}
                      className={`w-full bg-transparent ${MONO} text-[10px] text-white outline-none placeholder:text-white/30`}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Low readiness warning */}
              {(readiness.sleepQuality > 0 && readiness.sleepQuality <= 2) || (readiness.energyLevel > 0 && readiness.energyLevel <= 2) ? (
                <div className="border border-[#ff6600]/50 bg-[#ff6600]/10 p-3">
                  <div className={`${MONO} text-[9px] text-[#ff6600] uppercase`}>
                    Low readiness detected. Consider reduced intensity. Consult your agent.
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============================================================ */}
          {/* SET LOG PHASE — capture per-set data */}
          {/* ============================================================ */}
          {status === "setLog" && (
            <div className="space-y-4">
              <div className={`${MONO} text-[9px] text-[#ff6600] uppercase tracking-[2px]`}>
                Log Set {currentSet}/{targetSets} — {exerciseName}
              </div>

              {/* Weight */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>Weight</div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSetWeight(Math.max(0, setWeight - 5))}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={setWeight || ""}
                    onChange={(e) => { const n = Number(e.target.value); setSetWeight(isNaN(n) ? 0 : Math.max(0, n)); }}
                    placeholder="0"
                    className={`w-20 text-center bg-transparent ${MONO} text-[28px] text-[#ff6600] font-bold outline-none`}
                  />
                  <button
                    onClick={() => setSetWeight(setWeight + 5)}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    +
                  </button>
                </div>
                <div className={`${MONO} text-[7px] text-white/30 text-center mt-1`}>LBS / KG</div>
              </div>

              {/* Reps */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>Reps Completed</div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSetReps(Math.max(1, setReps - 1))}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    -
                  </button>
                  <div className={`${MONO} text-[28px] text-white font-bold w-12 text-center`}>
                    {setReps}
                  </div>
                  <button
                    onClick={() => setSetReps(setReps + 1)}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    +
                  </button>
                </div>
                <div className={`${MONO} text-[7px] text-white/30 text-center mt-1`}>TARGET: {targetReps}</div>
              </div>

              {/* RPE */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>RPE (Effort)</div>
                <div className="flex gap-1">
                  {[5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSetRPE(n)}
                      className={`flex-1 py-2 border ${MONO} text-[12px] font-bold transition-colors ${
                        setRPE === n
                          ? n >= 9 ? "border-red-500 bg-red-500/20 text-red-400"
                            : "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                          : "border-white/20 text-white/40 hover:border-white/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className={`${MONO} text-[7px] text-white/30 mt-1 flex justify-between`}>
                  <span>EASY</span><span>MAX</span>
                </div>
              </div>

              {/* Form + Pain row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/20 p-3">
                  <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>Form</div>
                  <div className="flex gap-1">
                    {([{ v: 5, l: "CLEAN" }, { v: 3, l: "OK" }, { v: 1, l: "ROUGH" }] as const).map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => setSetForm(v)}
                        className={`flex-1 py-1.5 border ${MONO} text-[7px] font-bold uppercase transition-colors ${
                          setForm === v
                            ? v === 1 ? "border-red-500 bg-red-500/20 text-red-400"
                              : "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                            : "border-white/20 text-white/30 hover:border-white/40"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border border-white/20 p-3">
                  <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>Pain</div>
                  <div className="flex gap-1">
                    {([{ v: "none" as const, l: "NO" }, { v: "mild" as const, l: "MILD" }, { v: "severe" as const, l: "SEV" }]).map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => setSetPain(v)}
                        className={`flex-1 py-1.5 border ${MONO} text-[7px] font-bold uppercase transition-colors ${
                          setPain === v
                            ? v === "severe" ? "border-red-500 bg-red-500/20 text-red-400"
                              : v === "mild" ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                              : "border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                            : "border-white/20 text-white/30 hover:border-white/40"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {setPain === "severe" && (
                <div className="border border-red-500/50 bg-red-500/10 p-3">
                  <div className={`${MONO} text-[9px] text-red-400 uppercase`}>
                    Severe pain detected. Exercise will be terminated. Safety first.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* REFLECTION PHASE */}
          {/* ============================================================ */}
          {status === "reflection" && (
            <div className="space-y-4">
              {completionMessage && (
                <SystemMessage message={completionMessage} variant="identity" showDismiss={false} />
              )}
              <div className="border-2 border-[#ff6600] p-5">
                <div className={`${MONO} text-[9px] text-[#ff6600] uppercase tracking-[2px] mb-3`}>
                  Post-Session Reflection
                </div>
                <div className={`${MONO} text-[10px] text-white/60 mb-4`}>
                  One sentence. What did you observe?
                </div>
                <div className="border border-white/30 p-3 mb-3">
                  <input
                    type="text"
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="I noticed..."
                    maxLength={140}
                    className={`w-full bg-transparent ${MONO} text-[11px] text-white outline-none placeholder:text-white/30`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reflectionText.trim()) handleReflectionSubmit();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className={`${MONO} text-[8px] text-white/30`}>{reflectionText.length}/140</div>
                  <div className="flex gap-2">
                    <button onClick={handleSkipReflection} className={`border border-white/20 px-3 py-1.5 ${MONO} text-[8px] text-white/50 uppercase tracking-wide hover:bg-white/5 transition-colors`}>
                      Skip
                    </button>
                    <button
                      onClick={handleReflectionSubmit}
                      disabled={!reflectionText.trim()}
                      className={`border px-3 py-1.5 ${MONO} text-[8px] uppercase tracking-wide transition-colors ${
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

          {/* ============================================================ */}
          {/* ENCODED PHASE — session summary with performance data */}
          {/* ============================================================ */}
          {status === "encoded" && (
            <div className="space-y-4">
              {neuroplasticMessage && (
                <div className="border-2 border-[#ff6600] bg-[#ff6600]/10 p-6 text-center">
                  <div className={`${MONO} text-[8px] text-[#ff6600] uppercase tracking-[3px] mb-4`}>
                    Identity Encoded
                  </div>
                  <div className={`${MONO} text-[14px] text-white leading-[1.6]`}>
                    {neuroplasticMessage}
                  </div>
                  <div className="mt-4 h-[2px] bg-[#ff6600]/30 relative">
                    <div className="absolute inset-y-0 left-0 w-full bg-[#ff6600] animate-pulse" />
                  </div>
                </div>
              )}

              {/* Session Summary */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[9px] text-white/40 uppercase tracking-wider mb-3`}>Session Data</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className={`${MONO} text-[16px] text-white font-bold`}>{formatTime(timer)}</div>
                    <div className={`${MONO} text-[7px] text-white/40 uppercase`}>Duration</div>
                  </div>
                  <div className="text-center">
                    <div className={`${MONO} text-[16px] text-white font-bold`}>{exerciseLogs.length}</div>
                    <div className={`${MONO} text-[7px] text-white/40 uppercase`}>Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className={`${MONO} text-[16px] text-[#ff6600] font-bold`}>{totalSetsDone}</div>
                    <div className={`${MONO} text-[7px] text-white/40 uppercase`}>Sets Done</div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              {exerciseLogs.length > 0 && (
                <div className="border border-white/20 p-4">
                  <div className={`${MONO} text-[9px] text-white/40 uppercase tracking-wider mb-3`}>Performance Log</div>
                  <div className="space-y-2">
                    {exerciseLogs.map((log, i) => {
                      const avgRpe = log.actualSets.length > 0
                        ? Math.round(log.actualSets.reduce((s, d) => s + d.rpe, 0) / log.actualSets.length * 10) / 10
                        : 0;
                      const maxWeight = Math.max(...log.actualSets.map((s) => s.weight), 0);
                      return (
                        <div key={i} className="flex items-center justify-between border-b border-white/10 pb-1">
                          <div className={`${MONO} text-[9px] text-white/80`}>{log.name}</div>
                          <div className={`${MONO} text-[8px] text-white/50`}>
                            {log.actualSets.length}x{maxWeight > 0 ? `@${maxWeight}` : ""} RPE {avgRpe}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reflectionText.trim() && (
                <div className="border-l-2 border-white/20 pl-3 py-2">
                  <div className={`${MONO} text-[8px] text-white/40 uppercase tracking-wider mb-1`}>Reflection Logged</div>
                  <div className={`${MONO} text-[10px] text-white/70 italic`}>"{reflectionText}"</div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE WORKOUT VIEW */}
          {/* ============================================================ */}
          {(status === "active" || status === "ready" || status === "paused" || status === "initializing") && (
            <>
              {/* Timer */}
              <div className="border-2 border-white/20 p-6 mb-6 flex flex-col items-center justify-center">
                <div className={`${MONO} text-[10px] text-white/40 uppercase tracking-[2px] mb-2 text-center`}>Elapsed Time</div>
                <div className={`${MONO} text-[48px] text-white font-bold tracking-wider text-center`}>{formatTime(timer)}</div>
              </div>

              {/* Set/Rep Counter */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-[#ff6600] p-4 text-center">
                  <div className={`${MONO} text-[10px] text-[#ff6600] uppercase tracking-wider mb-2`}>Current Set</div>
                  <div className={`${MONO} text-[36px] text-[#ff6600] font-bold`}>{currentSet}</div>
                  <div className={`${MONO} text-[8px] text-white/40 uppercase`}>of {targetSets}</div>
                </div>
                <div className="border border-white/20 p-4 text-center">
                  <div className={`${MONO} text-[10px] text-white/60 uppercase tracking-wider mb-2`}>Target Reps</div>
                  <div className={`${MONO} text-[36px] text-white font-bold`}>{targetReps}</div>
                  <div className={`${MONO} text-[8px] text-white/40 uppercase`}>per set</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="border border-white/20 p-4 mb-6">
                <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wider mb-3`}>Exercise Progress</div>
                <div className="h-3 bg-white/10 relative mb-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#ff6600]"
                    style={{ width: `${((currentSet - 1) / targetSets) * 100}%` }}
                  />
                </div>
                <div className={`${MONO} text-[8px] text-white/40`}>
                  SET {currentSet} OF {targetSets} · EXERCISE {currentExerciseIdx + 1}/{exercises.length}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="border border-white/20 p-3 text-center">
                  <div className={`${MONO} text-[8px] text-white/40 uppercase mb-1`}>Sets Done</div>
                  <div className={`${MONO} text-[16px] text-white font-bold`}>{totalSetsDone}</div>
                </div>
                <div className="border border-white/20 p-3 text-center">
                  <div className={`${MONO} text-[8px] text-white/40 uppercase mb-1`}>Exercise</div>
                  <div className={`${MONO} text-[16px] text-white font-bold`}>{currentExerciseIdx + 1}/{exercises.length}</div>
                </div>
                <div className="border border-white/20 p-3 text-center">
                  <div className={`${MONO} text-[8px] text-white/40 uppercase mb-1`}>Elapsed</div>
                  <div className={`${MONO} text-[16px] text-white font-bold`}>{formatTime(timer)}</div>
                </div>
              </div>

              {/* Protocol list (ready state) */}
              {status === "ready" && (
                <div className="border-l-2 border-white/20 pl-4 py-2">
                  <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wider mb-2`}>
                    Protocol — {exercises.length} modules
                  </div>
                  <ul className="space-y-1">
                    {exercises.map((ex, i) => (
                      <li key={i} className={`${MONO} text-[10px] text-white/80`}>
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
              onClick={handleConfirmIntent}
              className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
            >
              Confirm Intent · Start Sequence
            </button>
          )}

          {status === "readiness" && (
            <button
              onClick={handleReadinessComplete}
              disabled={readiness.sleepQuality === 0 || readiness.energyLevel === 0 || (readiness.painReported && !readiness.painLocation?.trim())}
              className={`w-full ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 transition-colors ${
                readiness.sleepQuality > 0 && readiness.energyLevel > 0 && !(readiness.painReported && !readiness.painLocation?.trim())
                  ? "bg-[#ff6600] text-black hover:bg-[#ff8833]"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              Initiate Sequence
            </button>
          )}

          {status === "active" && (
            <>
              <button
                onClick={handleSetComplete}
                className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
              >
                Set Complete · Log Data [{currentSet}/{targetSets}]
              </button>
              <button
                onClick={handlePause}
                className={`w-full border-2 border-white/30 text-white ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors`}
              >
                Pause Sequence
              </button>
            </>
          )}

          {status === "setLog" && (
            <button
              onClick={handleLogSet}
              className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
            >
              {setPain === "severe" ? "Log & Terminate Exercise" : `Log Set ${currentSet} · Continue`}
            </button>
          )}

          {status === "paused" && (
            <>
              <button
                onClick={handleResume}
                className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
              >
                Resume Sequence
              </button>
              <button
                onClick={onClose}
                className={`w-full border-2 border-white/30 text-white ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors`}
              >
                End Session
              </button>
            </>
          )}

          {status === "encoded" && (
            <>
              <button
                onClick={onClose}
                className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
              >
                Return to Dashboard
              </button>
              <div className="text-center">
                <div className={`${MONO} text-[9px] text-white/60 uppercase tracking-wide`}>
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

/** Status banner component */
function StatusBanner({ status }: { status: string }) {
  const banners: Record<string, { color: string; text: string; pulse?: boolean }> = {
    initializing: { color: "#ff6600", text: "System initializing... Loading parameters...", pulse: true },
    ready: { color: "white", text: "Ready to begin · Awaiting intent confirmation" },
    readiness: { color: "#ff6600", text: "Pre-session diagnostic · Assessing readiness", pulse: true },
    active: { color: "#ff6600", text: "Sequence in progress · Recording data", pulse: true },
    setLog: { color: "#ff6600", text: "Logging set data · Capture performance", pulse: true },
    paused: { color: "white", text: "Sequence paused · Awaiting resume command" },
    reflection: { color: "#ff6600", text: "Operation complete · Reflection required" },
    complete: { color: "white", text: "Operation complete · Identity encoded" },
    encoded: { color: "white", text: "Operation complete · Identity encoded" },
  };

  const b = banners[status];
  if (!b) return null;
  const isOrange = b.color === "#ff6600";

  return (
    <div className={`p-4 border-b shrink-0 ${isOrange ? "border-[#ff6600] bg-[#ff6600]/10" : "border-white/20 bg-white/5"}`}>
      <div className="flex items-center gap-2">
        {status === "encoded" || status === "complete" ? (
          <svg className="size-4" fill="none" viewBox="0 0 18 18">
            <rect x="1" y="1" width="16" height="16" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M5 9L8 12L13 6" stroke="white" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
          </svg>
        ) : (
          <div className={`size-2 ${isOrange ? "bg-[#ff6600]" : "bg-white"} ${b.pulse ? "animate-pulse" : ""}`} />
        )}
        <div className={`font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wide ${isOrange ? "text-[#ff6600]" : "text-white"}`}>
          {b.text}
        </div>
      </div>
    </div>
  );
}
