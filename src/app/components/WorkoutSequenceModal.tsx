import { useState, useEffect, useRef, useCallback } from "react";
import { SystemMessage } from "./SystemMessage";
import { Scanline } from "./Scanline";
import { getRandomMessage, getPostWorkoutMessage } from "../utils/microLanguage";
import {
  recordWorkoutOpened,
  recordWorkoutStarted,
  recordHesitation,
  recordWorkoutCompleted,
  recordReflection,
  getBehaviorState,
  updateBehaviorState,
  refreshWorkoutCounts,
} from "../utils/behaviorStore";
import { useAuth } from "../contexts/AuthContext";
import { setDocument } from "../../services/firestore";
import { notifyWorkoutComplete } from "../../services/notifications";
import { syncChallengeProgress } from "../../services/challenges";
import type { WorkoutDay, Exercise, ActualSetData, ExerciseLog, ReadinessData } from "../../services/programGenerator";
import { toLocalISO } from "../utils/dateUtils";

interface WorkoutSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutDay?: WorkoutDay | null;
}

const MONO = "font-['JetBrains_Mono',monospace]";

/** localStorage key for in-progress workout session */
export const WIP_KEY = "stride_workout_wip";

/** WIP sessions older than this are considered stale and discarded (2 hours) */
export const WIP_EXPIRY_MS = 2 * 60 * 60 * 1000;

/** Idle time before triggering a hesitation event (35 seconds) */
const HESITATION_DELAY_MS = 35_000;

export interface WorkoutWIP {
  workoutName: string;
  status: "readiness" | "active" | "setLog" | "resting" | "paused";
  timer: number;
  currentExerciseIdx: number;
  currentSet: number;
  exerciseLogs: ExerciseLog[];
  currentSetData: ActualSetData[];
  readiness: ReadinessData;
  exerciseOrder: number[];
  skippedExercises: number[];
  savedAt: number; // Date.now() — to detect stale sessions
  exerciseHash?: string; // fingerprint of exercise names — invalidates order if program changed
  snapshotExercises?: Exercise[]; // full exercise list for resume
}

/** Simple hash of exercise names — detects program modifications between WIP save and restore */
function exerciseFingerprint(exercises: { name: string }[]): string {
  return exercises.map(e => e.name).join("|");
}

function saveWIP(data: Omit<WorkoutWIP, "savedAt">) {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch { /* quota exceeded — non-critical */ }
}

export function loadWIP(workoutName: string): WorkoutWIP | null {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    if (!raw) return null;
    const wip: WorkoutWIP = JSON.parse(raw);
    if (Date.now() - wip.savedAt > WIP_EXPIRY_MS) return null;
    // Match by name — but also accept if the WIP is for the same day slot
    // (program may have been renamed via regenerateDay since the WIP was saved)
    if (wip.workoutName !== workoutName) return null;
    return wip;
  } catch { return null; }
}

/** Load any WIP regardless of workout name — for detecting stale/orphaned WIP */
export function loadAnyWIP(): WorkoutWIP | null {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    if (!raw) return null;
    const wip: WorkoutWIP = JSON.parse(raw);
    if (Date.now() - wip.savedAt > WIP_EXPIRY_MS) return null;
    return wip;
  } catch { return null; }
}

export function clearWIP() {
  localStorage.removeItem(WIP_KEY);
}

export function WorkoutSequenceModal({ isOpen, onClose, workoutDay }: WorkoutSequenceModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "initializing" | "ready" | "readiness" | "active" | "setLog" | "resting" | "paused" | "transition" | "complete" | "reflection" | "encoded"
  >("initializing");
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [exerciseOrder, setExerciseOrder] = useState<number[]>([]);
  const [skippedExercises, setSkippedExercises] = useState<number[]>([]);
  // Exercises permanently removed from the workout (user chose "Skip Entirely" on a deferred exercise)
  const [removedExercises, setRemovedExercises] = useState<number[]>([]);
  // Snapshot exercises on open — prevents mid-workout shifts if the program is modified externally
  const [snapshotExercises, setSnapshotExercises] = useState<Exercise[]>([]);

  // Use snapshot if available (active workout), otherwise derive from props
  const exercises: Exercise[] = snapshotExercises.length > 0
    ? snapshotExercises
    : (workoutDay?.exercises?.length ? workoutDay.exercises : null) ?? [
        { name: "Sit Up", sets: 3, reps: "15", rest: "60s" },
      ];
  // exerciseOrder maps position → exercises[] index. Fall back to identity mapping until initialized.
  // Use exerciseOrder if set (length shrinks when exercises are removed — that's valid).
  const resolvedOrder = exerciseOrder.length > 0 ? exerciseOrder : exercises.map((_, i) => i);
  const currentExercise = exercises[resolvedOrder[currentExerciseIdx]] ?? exercises[0];
  const exerciseName = currentExercise?.name ?? "Exercise";
  const targetSets = currentExercise?.sets ?? 3;
  const rawReps = String(currentExercise?.reps ?? "15");
  const isTimed = /s\b/.test(rawReps); // e.g. "30s", "45s", "30s each"
  const targetReps = parseInt(rawReps, 10) || 15;
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
  const [restCountdown, setRestCountdown] = useState<number | null>(null);

  // Parsed rest period for the current exercise (e.g. "60s" → 60)
  const restSeconds = parseInt(currentExercise?.rest ?? "60", 10) || 60;

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

  // Debounce rapid skip taps to prevent stale-state race conditions
  const skipLockRef = useRef(false);

  // ============================================================
  // Picture-in-Picture floating timer
  // ============================================================
  const [isPiP, setIsPiP] = useState(false);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipSupported = typeof document !== "undefined" && "pictureInPictureEnabled" in document && (document as any).pictureInPictureEnabled;

  // Ref for PiP render loop — holds latest display state without stale closures
  const pipDisplayRef = useRef({
    timer: 0, countdown: null as number | null, restCountdown: null as number | null,
    exerciseName: "", currentExerciseIdx: 0, currentSet: 1, targetSets: 3,
    totalExercises: 0, workoutName: "", status: "active" as string, isTimed: false,
  });
  useEffect(() => {
    pipDisplayRef.current = {
      timer, countdown, restCountdown, exerciseName, currentExerciseIdx,
      currentSet, targetSets, totalExercises: resolvedOrder.length, workoutName, status, isTimed,
    };
  });

  const renderPiPFrame = useCallback(() => {
    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const d = pipDisplayRef.current;
    const W = canvas.width, H = canvas.height;

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Top border accent
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(0, 0, W, 3);

    // Helper: format seconds to MM:SS
    const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // Workout name — top left
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "left";
    ctx.fillText(d.workoutName.toUpperCase(), 16, 28);

    // Exercise label — top right
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff6600";
    ctx.fillText(`[${String(d.currentExerciseIdx + 1).padStart(2, "0")}/${String(d.totalExercises).padStart(2, "0")}]`, W - 16, 28);

    // Current exercise name
    ctx.textAlign = "center";
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#fff";
    const name = d.exerciseName.length > 22 ? d.exerciseName.slice(0, 20) + "…" : d.exerciseName;
    ctx.fillText(name, W / 2, 62);

    // Set info
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`SET ${d.currentSet} / ${d.targetSets}`, W / 2, 82);

    // Main display — depends on state
    if (d.status === "resting" && d.restCountdown !== null) {
      // Rest countdown — large and orange
      ctx.font = "bold 56px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#ff6600";
      ctx.fillText(fmt(d.restCountdown), W / 2, 145);
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("REST", W / 2, 168);
    } else if (d.isTimed && d.countdown !== null) {
      // Timed exercise countdown
      ctx.font = "bold 56px 'JetBrains Mono', monospace";
      ctx.fillStyle = d.countdown <= 5 ? "#ff6600" : "#fff";
      ctx.fillText(fmt(d.countdown), W / 2, 145);
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("COUNTDOWN", W / 2, 168);
    } else {
      // Normal elapsed timer
      ctx.font = "bold 56px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(fmt(d.timer), W / 2, 145);
    }

    // Bottom bar — total elapsed (when showing countdown)
    if (d.status === "resting" || (d.isTimed && d.countdown !== null)) {
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(`ELAPSED ${fmt(d.timer)}`, W / 2, H - 12);
    }

    // Push frame to video stream
    try {
      const track = (pipVideoRef.current?.srcObject as MediaStream)?.getVideoTracks()[0];
      if (track && "requestFrame" in track) (track as any).requestFrame();
    } catch { /* not supported — captureStream auto-captures */ }
  }, []);

  const closePiP = useCallback(() => {
    if (pipIntervalRef.current) { clearInterval(pipIntervalRef.current); pipIntervalRef.current = null; }
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    // Stop the canvas capture stream so the browser releases the capture resource
    if (pipVideoRef.current?.srcObject) {
      (pipVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      pipVideoRef.current.srcObject = null;
    }
    pipVideoRef.current = null;
    pipCanvasRef.current = null;
    setIsPiP(false);
  }, []);

  const togglePiP = useCallback(async () => {
    if (!pipSupported) return;

    // If already in PiP — exit
    if (document.pictureInPictureElement) {
      closePiP();
      return;
    }

    try {
      // Create canvas (once)
      if (!pipCanvasRef.current) {
        const c = document.createElement("canvas");
        c.width = 400; c.height = 200;
        pipCanvasRef.current = c;
      }

      // Create video element (once)
      if (!pipVideoRef.current) {
        const v = document.createElement("video");
        v.setAttribute("playsinline", "");
        v.muted = true;
        v.srcObject = pipCanvasRef.current.captureStream(0);
        await v.play();
        pipVideoRef.current = v;
        v.addEventListener("leavepictureinpicture", () => {
          if (pipIntervalRef.current) { clearInterval(pipIntervalRef.current); pipIntervalRef.current = null; }
          setIsPiP(false);
        });
      }

      // Start 1fps render loop
      renderPiPFrame();
      pipIntervalRef.current = setInterval(renderPiPFrame, 1000);

      await pipVideoRef.current.requestPictureInPicture();
      setIsPiP(true);
    } catch (e) {
      console.warn("PiP not available:", e);
    }
  }, [pipSupported, renderPiPFrame, closePiP]);

  // When true, unmount cleanup should NOT re-save WIP (session was intentionally ended)
  const wipFinishedRef = useRef(false);

  // Track if modal is still active to prevent stale timeout writes
  const isActiveRef = useRef(false);
  useEffect(() => {
    isActiveRef.current = isOpen;
    return () => { isActiveRef.current = false; };
  }, [isOpen]);

  const clearHesitationTimer = useCallback(() => {
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
  }, []);

  // Stable ref for timer — prevents handleCloseWithSave from recreating every second
  const timerRef = useRef(timer);
  useEffect(() => { timerRef.current = timer; }, [timer]);

  // Refs for latest WIP state — used by unmount/beforeunload to save without stale closures
  const wipStateRef = useRef({ status, workoutName, currentExerciseIdx, currentSet, exerciseLogs, currentSetData, readiness, resolvedOrder, skippedExercises, exercises });
  useEffect(() => {
    wipStateRef.current = { status, workoutName, currentExerciseIdx, currentSet, exerciseLogs, currentSetData, readiness, resolvedOrder, skippedExercises, exercises };
  });

  // ============================================================
  // Wake Lock — keep screen awake during active workout
  // ============================================================
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const releaseWakeLock = () => { wakeLockRef.current?.release().catch(() => {}); wakeLockRef.current = null; };
  useEffect(() => {
    if (!isOpen) { releaseWakeLock(); return; }
    if (status === "active" || status === "setLog" || status === "resting" || status === "transition") {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        navigator.wakeLock.request("screen").then((wl) => { wakeLockRef.current = wl; }).catch(() => {});
      }
    } else {
      releaseWakeLock();
    }
    return releaseWakeLock;
  }, [status, isOpen]);

  // Re-acquire Wake Lock when page becomes visible again (mobile releases on hide)
  useEffect(() => {
    const reacquire = () => {
      if (document.visibilityState === "visible" && "wakeLock" in navigator) {
        const s = wipStateRef.current.status;
        if (["active", "setLog", "resting", "transition"].includes(s) && !wakeLockRef.current) {
          navigator.wakeLock.request("screen").then((wl) => { wakeLockRef.current = wl; }).catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => document.removeEventListener("visibilitychange", reacquire);
  }, []);

  // ============================================================
  // Media Session — lock screen / notification shade info
  // ============================================================
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (status === "active" || status === "resting" || status === "paused" || status === "setLog" || status === "transition") {
      // Use timerRef instead of timer state to avoid re-registering handlers every second
      const t = timerRef.current;
      const mm = Math.floor(t / 60).toString().padStart(2, "0");
      const ss = (t % 60).toString().padStart(2, "0");
      navigator.mediaSession.metadata = new MediaMetadata({
        title: exerciseName,
        artist: `Set ${currentSet}/${targetSets} · ${mm}:${ss}`,
        album: workoutName,
      });
      navigator.mediaSession.setActionHandler("pause", () => setStatus("paused"));
      navigator.mediaSession.setActionHandler("play", () => setStatus("active"));
    } else {
      // Clear media session when workout is not active (prevents lock screen controls
      // from pushing an ended workout back into paused state)
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("play", null);
    }
    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("play", null);
      }
    };
  }, [status, exerciseName, currentSet, targetSets, workoutName]);

  // Save WIP on unmount (e.g. user navigates away mid-workout) + beforeunload + visibilitychange
  useEffect(() => {
    const saveOnExit = () => {
      if (wipFinishedRef.current) return; // Session was intentionally ended — don't re-save
      const s = wipStateRef.current;
      if (["readiness", "active", "setLog", "resting", "paused", "transition"].includes(s.status)) {
        saveWIP({
          workoutName: s.workoutName,
          status: (s.status === "transition" || s.status === "resting" ? "active" : s.status) as WorkoutWIP["status"],
          timer: timerRef.current,
          currentExerciseIdx: s.currentExerciseIdx,
          currentSet: s.currentSet,
          exerciseLogs: s.exerciseLogs,
          currentSetData: s.currentSetData,
          readiness: s.readiness,
          exerciseOrder: s.resolvedOrder,
          skippedExercises: s.skippedExercises,
          exerciseHash: exerciseFingerprint(s.exercises),
          snapshotExercises: s.exercises,
        });
      }
    };
    // Save WIP when page goes hidden (mobile app switch, lock screen)
    // This is critical on mobile where beforeunload may not fire
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveOnExit();
    };
    window.addEventListener("beforeunload", saveOnExit);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", saveOnExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Component unmounting (navigation) — save if workout in progress
      saveOnExit();
      // Clean up timers + PiP on unmount
      if (completionDelayRef.current) clearTimeout(completionDelayRef.current);
      if (pipIntervalRef.current) clearInterval(pipIntervalRef.current);
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    };
  }, []); // empty deps — runs once, uses refs for latest values

  // ============================================================
  // Save WIP on close (when workout is in progress)
  // ============================================================
  const handleCloseWithSave = useCallback(() => {
    if (["readiness", "active", "setLog", "resting", "paused", "transition"].includes(status)) {
      saveWIP({
        workoutName,
        status: (status === "transition" || status === "resting" ? "active" : status) as WorkoutWIP["status"],
        timer: timerRef.current,
        currentExerciseIdx,
        currentSet,
        exerciseLogs,
        currentSetData,
        readiness,
        exerciseOrder: resolvedOrder,
        skippedExercises,
        exerciseHash: exerciseFingerprint(exercises),
        snapshotExercises: exercises,
      });
    }
    onClose();
  }, [status, workoutName, currentExerciseIdx, currentSet, exerciseLogs, currentSetData, readiness, resolvedOrder, skippedExercises, exercises, onClose]);

  // Escape key — save WIP and close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") handleCloseWithSave(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleCloseWithSave]);

  useEffect(() => {
    if (isOpen) {
      wipFinishedRef.current = false; // Reset — new session starting
      // Check for saved in-progress session
      const wip = loadWIP(workoutName);
      // Snapshot exercises on open — prevents prop changes from shifting workout mid-session
      const currentExercises = (workoutDay?.exercises?.length ? workoutDay.exercises : null) ?? [{ name: "Sit Up", sets: 3, reps: "15", rest: "60s" }];
      setSnapshotExercises([...currentExercises]);

      if (wip) {
        // Check if program was modified since WIP was saved (exercise names changed)
        const currentHash = exerciseFingerprint(currentExercises);
        const programChanged = wip.exerciseHash && wip.exerciseHash !== currentHash;
        if (programChanged) {
          // Program was modified mid-workout — preserve progress, apply new exercises
          // Keep timer, completed logs, and readiness; resume from first non-completed exercise
          const completedNames = new Set(wip.exerciseLogs.map(l => l.name.toLowerCase()));
          let resumeIdx = -1;
          for (let i = 0; i < currentExercises.length; i++) {
            if (!completedNames.has(currentExercises[i].name.toLowerCase())) {
              resumeIdx = i;
              break;
            }
          }
          if (resumeIdx === -1) {
            // All exercises were completed before program changed — save and close
            clearWIP(); wipFinishedRef.current = true;
            // Save workout log directly (handleComplete has stale closures in useEffect)
            if (wip.exerciseLogs.length > 0 && user) {
              const totalVolume = wip.exerciseLogs.reduce((sum, ex) =>
                sum + ex.actualSets.reduce((s, set) => s + set.weight * set.repsCompleted, 0), 0);
              const totalSetsCount = wip.exerciseLogs.reduce((sum, ex) => sum + ex.actualSets.length, 0);
              const totalRPE = wip.exerciseLogs.reduce((sum, ex) =>
                sum + ex.actualSets.reduce((s, set) => s + set.rpe, 0), 0);
              const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
              setDocument(`users/${user.uid}/workoutLogs/${logId}`, {
                workoutName,
                exercises: wip.exerciseLogs,
                duration: wip.timer,
                completedAt: toLocalISO(new Date()),
                completedAtMs: Date.now(),
                completionType: "full",
                readiness: wip.readiness,
                totalVolume,
                avgRPE: totalSetsCount > 0 ? Math.round(totalRPE / totalSetsCount * 10) / 10 : 0,
              }).catch(console.warn);
              recordWorkoutCompleted();
              syncChallengeProgress(user.uid, getBehaviorState()).catch(console.warn);
              notifyWorkoutComplete(user.uid, workoutName, wip.timer).catch(console.warn);
            }
            onClose();
            return;
          }
          setStatus(wip.status === "setLog" ? "active" : wip.status);
          setTimer(wip.timer);
          setCurrentExerciseIdx(resumeIdx);
          setCurrentSet(1);
          setExerciseLogs(wip.exerciseLogs);
          setCurrentSetData([]);
          setReadiness(wip.readiness);
          setExerciseOrder(currentExercises.map((_, i) => i));
          setSkippedExercises([]); // Reset — old indices are invalid
          setRemovedExercises([]);
          hasStartedRef.current = true;
          setStartMessage("");
          setHesitationMessage("");
          setCompletionMessage("");
          setNeuroplasticMessage("");
          setReflectionText("");
          setShowHesitation(false);
          clearWIP();
          return;
        } else {
          // Restore saved session
          setStatus(wip.status === "setLog" ? "active" : wip.status);
          setTimer(wip.timer);
          setCurrentExerciseIdx(wip.currentExerciseIdx);
          setCurrentSet(wip.currentSet);
          setExerciseLogs(wip.exerciseLogs);
          setCurrentSetData(wip.currentSetData);
          setReadiness(wip.readiness);
          setExerciseOrder(wip.exerciseOrder?.length ? wip.exerciseOrder : currentExercises.map((_, i) => i));
          setSkippedExercises(wip.skippedExercises ?? []);
          setRemovedExercises([]);
          hasStartedRef.current = true;
          setStartMessage("");
          setHesitationMessage("");
          setCompletionMessage("");
          setNeuroplasticMessage("");
          setReflectionText("");
          setShowHesitation(false);
          // Do NOT clearWIP() here — the session is still in progress.
          // WIP is cleared on completion, end-session-early, or explicit close-without-save.
          return;
        }
      }

      // Fresh session — reset everything
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
      // Initialize exercise order as [0, 1, 2, ..., N-1]
      setExerciseOrder(currentExercises.map((_, i) => i));
      setSkippedExercises([]);
      setRemovedExercises([]);

      recordWorkoutOpened();

      const timeout = setTimeout(() => {
        setStatus("ready");
        hesitationTimerRef.current = setTimeout(() => {
          if (!hasStartedRef.current) {
            recordHesitation();
            setHesitationMessage(getRandomMessage("hesitation"));
            setShowHesitation(true);
          }
        }, HESITATION_DELAY_MS);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        clearHesitationTimer();
      };
    }
  }, [isOpen, clearHesitationTimer, workoutName]);

  // Timestamp-based main timer — survives background tab throttling
  useEffect(() => {
    if (status === "active" || status === "setLog" || status === "transition" || status === "resting") {
      // Epoch = the real-world time corresponding to timer=0
      const epoch = Date.now() - timerRef.current * 1000;
      const sync = () => setTimer(Math.floor((Date.now() - epoch) / 1000));
      const interval = setInterval(sync, 1000);
      const onVisible = () => { if (document.visibilityState === "visible") sync(); };
      document.addEventListener("visibilitychange", onVisible);
      return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
    }
  }, [status]);

  // Timestamp-based countdown for timed exercises (e.g. "30s", "45s each")
  useEffect(() => {
    if (!isTimed || status !== "active") {
      setCountdown(null);
      return;
    }
    setCountdown(targetReps);
    const startedAt = Date.now();
    const sync = () => {
      const remaining = Math.max(targetReps - Math.floor((Date.now() - startedAt) / 1000), 0);
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    };
    const interval = setInterval(sync, 1000);
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [isTimed, status, currentSet, currentExerciseIdx, targetReps, exerciseOrder]);

  // Auto-advance to set log when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isTimed && status === "active") {
      setStatus("setLog");
    }
  }, [countdown, isTimed, status]);

  // Timestamp-based rest countdown between sets
  useEffect(() => {
    if (status !== "resting") {
      setRestCountdown(null);
      return;
    }
    setRestCountdown(restSeconds);
    const startedAt = Date.now();
    const sync = () => {
      const remaining = Math.max(restSeconds - Math.floor((Date.now() - startedAt) / 1000), 0);
      setRestCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    };
    const interval = setInterval(sync, 1000);
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [status, restSeconds]);

  // Auto-advance to active when rest completes
  useEffect(() => {
    if (restCountdown === 0 && status === "resting") {
      setStatus("active");
    }
  }, [restCountdown, status]);

  useEffect(() => {
    return () => {
      clearHesitationTimer();
      if (completionDelayRef.current) clearTimeout(completionDelayRef.current);
    };
  }, [clearHesitationTimer]);

  // Reset set inputs when exercise changes
  useEffect(() => {
    setSetWeight(0);
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

    // Reset countdown for the next set
    setCountdown(null);

    // Pain safety check
    if (setPain === "severe") {
      // Auto-complete exercise, move to next
      finalizeExercise(updatedSetData);
      return;
    }

    if (currentSet < targetSets) {
      setCurrentSet(currentSet + 1);
      // Carry weight forward — show rest timer before next set
      setStatus("resting");
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

    if (currentExerciseIdx < resolvedOrder.length - 1) {
      // More exercises remain — commit log and show transition screen
      setExerciseLogs((prev) => [...prev, log]);
      setCurrentSet(1);
      setCurrentSetData([]);
      setStatus("transition");
    } else {
      // Last exercise — build final logs array synchronously to avoid stale state
      const finalLogs = [...exerciseLogs, log];
      setExerciseLogs(finalLogs);
      handleComplete(finalLogs);
    }
  };

  /** Defer the current exercise to the end of the order (user will encounter it again later) */
  const handleSkipExercise = () => {
    if (skipLockRef.current) return;
    skipLockRef.current = true;
    setTimeout(() => { skipLockRef.current = false; }, 300);
    const newOrder = [...resolvedOrder];
    const skippedOriginalIdx = newOrder[currentExerciseIdx];
    // Remove from current position and push to end
    newOrder.splice(currentExerciseIdx, 1);
    newOrder.push(skippedOriginalIdx);
    setExerciseOrder(newOrder);
    if (!skippedExercises.includes(skippedOriginalIdx)) {
      setSkippedExercises([...skippedExercises, skippedOriginalIdx]);
    }

    // Do NOT auto-complete — the deferred exercise will come back around.
    // Auto-complete only happens when all remaining are removed entirely.

    // Reset set state for the new current exercise (same position, different exercise)
    setCurrentSet(1);
    setCurrentSetData([]);
    // Clear countdown so a timed exercise's countdown doesn't auto-advance the new exercise
    setCountdown(null);
    // Stay on "active" — the exercise at currentExerciseIdx is now the next one
  };

  /** Permanently remove an exercise from the workout (user chose "Skip Entirely" on a deferred exercise) */
  const handleRemoveExercise = () => {
    if (skipLockRef.current) return;
    skipLockRef.current = true;
    setTimeout(() => { skipLockRef.current = false; }, 300);
    const newOrder = [...resolvedOrder];
    const removedOriginalIdx = newOrder[currentExerciseIdx];
    // Permanently remove from order (don't push to end)
    newOrder.splice(currentExerciseIdx, 1);
    setExerciseOrder(newOrder);
    const newRemoved = [...removedExercises, removedOriginalIdx];
    setRemovedExercises(newRemoved);

    // If no exercises remain in the order, auto-complete
    if (newOrder.length === 0 || currentExerciseIdx >= newOrder.length) {
      handleComplete(exerciseLogs, skippedExercises, newOrder, newRemoved);
      return;
    }

    // Reset set state for the new current exercise
    setCurrentSet(1);
    setCurrentSetData([]);
  };

  /** Advance to the next exercise from the transition screen */
  const handleProceedFromTransition = () => {
    setCurrentExerciseIdx(currentExerciseIdx + 1);
    setStatus("active");
  };

  /** Defer the upcoming exercise from the transition screen (moves to end) */
  const handleSkipNextFromTransition = () => {
    const nextIdx = currentExerciseIdx + 1;
    const newOrder = [...resolvedOrder];
    const skippedOriginalIdx = newOrder[nextIdx];
    newOrder.splice(nextIdx, 1);
    newOrder.push(skippedOriginalIdx);
    setExerciseOrder(newOrder);
    if (!skippedExercises.includes(skippedOriginalIdx)) {
      setSkippedExercises([...skippedExercises, skippedOriginalIdx]);
    }

    // Do NOT auto-complete — the deferred exercise will come back around.
    if (nextIdx >= newOrder.length) {
      // No more exercises remain in order
      handleComplete(exerciseLogs, skippedExercises, newOrder);
      return;
    }

    // After skipping, nextIdx now points to a different exercise
    setCurrentExerciseIdx(nextIdx);
    setStatus("active");
  };

  /** Permanently remove the upcoming exercise from the transition screen */
  const handleRemoveNextFromTransition = () => {
    const nextIdx = currentExerciseIdx + 1;
    const newOrder = [...resolvedOrder];
    const removedOriginalIdx = newOrder[nextIdx];
    // Permanently remove (don't push to end)
    newOrder.splice(nextIdx, 1);
    setExerciseOrder(newOrder);
    const newRemoved = [...removedExercises, removedOriginalIdx];
    setRemovedExercises(newRemoved);

    if (nextIdx >= newOrder.length) {
      // No more exercises remain
      handleComplete(exerciseLogs, skippedExercises, newOrder, newRemoved);
      return;
    }

    // After removing, nextIdx now points to a different exercise
    setCurrentExerciseIdx(nextIdx);
    setStatus("active");
  };

  /** Shared: save workout log to Firestore + update behavior state */
  const saveWorkoutLog = (logs: ExerciseLog[], completionType: "full" | "partial") => {
    if (logs.length === 0) return;
    const totalVolume = logs.reduce((sum, ex) =>
      sum + ex.actualSets.reduce((s, set) => s + set.weight * set.repsCompleted, 0), 0
    );
    const totalSetsCount = logs.reduce((sum, ex) => sum + ex.actualSets.length, 0);
    const totalRPE = logs.reduce((sum, ex) =>
      sum + ex.actualSets.reduce((s, set) => s + set.rpe, 0), 0
    );
    const avgRPE = totalSetsCount > 0 ? totalRPE / totalSetsCount : 0;

    // Update behavior state synchronously (localStorage) so Dashboard sees it immediately
    if (completionType === "full") {
      const updatedState = recordWorkoutCompleted();
      if (user) {
        syncChallengeProgress(user.uid, updatedState).catch(console.warn);
        notifyWorkoutComplete(user.uid, workoutName, timer).catch(console.warn);
      }
    } else {
      // Partial: mark training happened today + count toward 14d consistency
      // (user showed up — partial effort is still effort)
      // Don't inflate streak or weekly counters since the session wasn't completed
      const partialState = getBehaviorState();
      const isFirstToday = !partialState.lastWorkoutCompletedAt ||
        new Date(partialState.lastWorkoutCompletedAt).toDateString() !== new Date().toDateString();
      updateBehaviorState({
        lastWorkoutCompletedAt: Date.now(),
        // Only count toward 14d/total once per day to avoid double-counting with full completions
        workoutsCompleted14d: isFirstToday ? partialState.workoutsCompleted14d + 1 : partialState.workoutsCompleted14d,
        totalWorkoutsCompleted: partialState.totalWorkoutsCompleted + 1,
      });
      if (user) {
        syncChallengeProgress(user.uid, getBehaviorState()).catch(console.warn);
      }
    }

    // Firestore write then refresh 14d counters from actual logs (corrects monotonic drift)
    if (user) {
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setDocument(`users/${user.uid}/workoutLogs/${logId}`, {
        workoutName,
        exercises: logs,
        duration: timerRef.current,
        completedAt: toLocalISO(new Date()),
        completedAtMs: Date.now(),
        completionType,
        readiness,
        totalVolume,
        avgRPE: Math.round(avgRPE * 10) / 10,
      }).then(() => refreshWorkoutCounts(user.uid).catch(console.warn))
        .catch((err) => console.error("Workout log write failed:", err));
    }
  };

  const handleComplete = (finalLogs: ExerciseLog[], currentSkipped?: number[], currentOrder?: number[], currentRemoved?: number[]) => {
    clearWIP(); wipFinishedRef.current = true; closePiP();
    // If no exercises were actually completed (all skipped/removed), close without saving
    if (finalLogs.length === 0) {
      onClose();
      return;
    }
    // Capture order/skipped/removed at call time to avoid stale closure from async setState
    const orderSnapshot = currentOrder ?? resolvedOrder;
    const skippedSnapshot = currentSkipped ?? skippedExercises;
    const removedSnapshot = currentRemoved ?? removedExercises;
    // Count exercises that were actually in the workout (exclude removed ones)
    // Filter out skipped indices that were also removed (avoid double-deduction)
    const removedSet = new Set(removedSnapshot);
    const activeSkipped = new Set([...skippedSnapshot].filter(i => !removedSet.has(i)));
    const totalInWorkout = orderSnapshot.length + removedSnapshot.length;
    const unskippedCount = totalInWorkout - activeSkipped.size - removedSnapshot.length;
    const completionType = finalLogs.length >= unskippedCount ? "full" : "partial";
    // Save immediately so data is never lost (even if user closes during animation)
    saveWorkoutLog(finalLogs, completionType);
    const completedFull = completionType === "full";
    setStatus("initializing");
    completionDelayRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;
      setCompletionMessage(getRandomMessage("completion"));
      setNeuroplasticMessage(getPostWorkoutMessage(completedFull, increasedIntensity));
      setStatus("reflection");
    }, 1500);
  };

  /** End session early — save whatever was completed as a partial workout */
  const handleEndSessionEarly = () => {
    if (!window.confirm("End session early? Remaining exercises will not be logged.")) return;
    clearHesitationTimer();
    clearWIP(); wipFinishedRef.current = true; closePiP();
    const partialLogs = currentSetData.length > 0
      ? [...exerciseLogs, {
          name: exerciseName,
          plannedSets: targetSets,
          plannedReps: String(currentExercise?.reps ?? targetReps),
          rest: currentExercise?.rest ?? "60s",
          actualSets: currentSetData,
        } as ExerciseLog]
      : [...exerciseLogs];
    saveWorkoutLog(partialLogs, "partial");
    onClose();
  };

  const handleReflectionSubmit = () => {
    if (reflectionText.trim()) recordReflection(reflectionText.trim(), workoutName);
    setStatus("encoded");
  };
  const handleSkipReflection = () => setStatus("encoded");

  if (!isOpen) return null;

  // Calculate total sets done so far across all exercises
  // On reflection/encoded screens, all sets are in exerciseLogs — don't add currentSet
  const inFinalScreen = status === "reflection" || status === "encoded";
  const totalSetsDone = exerciseLogs.reduce((sum, ex) => sum + ex.actualSets.length, 0) + (inFinalScreen ? 0 : currentSet - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Scanlines */}
      <Scanline opacity="0.015" />

      <div className="relative w-full max-w-[375px] h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#ff6600] flex items-center justify-between shrink-0">
          <div>
            <div className={`${MONO} text-[10px] text-white/60 uppercase tracking-[2px]`}>
              Sequence Active
            </div>
            <div className={`${MONO} text-[20px] text-[#ff6600] font-bold uppercase max-w-[280px] leading-tight line-clamp-2`}>
              [{String(currentExerciseIdx + 1).padStart(2, "0")}] {exerciseName}
            </div>
            {skippedExercises.includes(resolvedOrder[currentExerciseIdx]) && status === "active" && (
              <div className={`${MONO} text-[8px] text-[#ff6600]/70 uppercase tracking-wider mt-0.5`}>
                Previously deferred
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pipSupported && (
              <button
                onClick={togglePiP}
                aria-label={isPiP ? "Close floating timer" : "Float timer"}
                className={`size-10 border flex items-center justify-center transition-colors ${isPiP ? "border-[#ff6600] bg-[#ff6600]/10" : "border-white/30 hover:border-[#ff6600]"}`}
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke={isPiP ? "#ff6600" : "white"} strokeWidth={1.5}>
                  <rect x="2" y="3" width="20" height="14" rx="1" />
                  <rect x="11" y="10" width="10" height="8" rx="1" fill={isPiP ? "#ff6600" : "none"} stroke={isPiP ? "#ff6600" : "white"} />
                </svg>
              </button>
            )}
            <button
              onClick={handleCloseWithSave}
              aria-label="Close"
              className="size-10 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                <div className={`${MONO} text-[7px] text-white/50 mt-1 flex justify-between`}>
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
                <div className={`${MONO} text-[7px] text-white/50 mt-1 flex justify-between`}>
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
                    inputMode="decimal"
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
                <div className={`${MONO} text-[7px] text-white/50 text-center mt-1`}>LBS / KG</div>
              </div>

              {/* Reps / Time */}
              <div className="border border-white/20 p-4">
                <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>{isTimed ? "Time Completed (s)" : "Reps Completed"}</div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSetReps(Math.max(1, setReps - 1))}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    -
                  </button>
                  <div className={`${MONO} text-[28px] text-white font-bold w-12 text-center`}>
                    {setReps}{isTimed ? "s" : ""}
                  </div>
                  <button
                    onClick={() => setSetReps(setReps + 1)}
                    className={`size-10 border border-white/30 ${MONO} text-[16px] text-white flex items-center justify-center hover:border-[#ff6600]`}
                  >
                    +
                  </button>
                </div>
                <div className={`${MONO} text-[7px] text-white/50 text-center mt-1`}>TARGET: {isTimed ? rawReps : targetReps}</div>
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
                <div className={`${MONO} text-[7px] text-white/50 mt-1 flex justify-between`}>
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
                  <div className={`${MONO} text-[8px] text-white/50`}>{reflectionText.length}/140</div>
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
          {/* TRANSITION SCREEN — between exercises */}
          {/* ============================================================ */}
          {status === "transition" && (() => {
            const completedEx = exercises[resolvedOrder[currentExerciseIdx]];
            const completedLog = exerciseLogs[exerciseLogs.length - 1];
            const maxWeight = completedLog ? Math.max(...completedLog.actualSets.map((s) => s.weight), 0) : 0;
            const setsLogged = completedLog ? completedLog.actualSets.length : 0;
            const nextExIdx = currentExerciseIdx + 1;
            const nextEx = nextExIdx < resolvedOrder.length ? exercises[resolvedOrder[nextExIdx]] : null;
            const isDeferred = nextEx && skippedExercises.includes(resolvedOrder[nextExIdx]);
            return (
              <div className="space-y-5">
                {/* Completed module summary */}
                <div className="border-2 border-[#ff6600] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-8 border-2 border-[#ff6600] flex items-center justify-center shrink-0">
                      <svg className="size-5" fill="none" viewBox="0 0 18 18">
                        <path d="M4 9L7.5 12.5L14 5.5" stroke="#ff6600" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                      </svg>
                    </div>
                    <div>
                      <div className={`${MONO} text-[9px] text-[#ff6600] uppercase tracking-[2px]`}>Module Complete</div>
                      <div className={`${MONO} text-[15px] text-white font-bold uppercase`}>{completedEx?.name ?? "Exercise"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-white/20 p-3 text-center">
                      <div className={`${MONO} text-[20px] text-white font-bold`}>{setsLogged}</div>
                      <div className={`${MONO} text-[7px] text-white/40 uppercase tracking-wider`}>Sets Logged</div>
                    </div>
                    <div className="border border-white/20 p-3 text-center">
                      <div className={`${MONO} text-[20px] ${maxWeight > 0 ? "text-[#ff6600]" : "text-white/40"} font-bold`}>
                        {maxWeight > 0 ? maxWeight : "—"}
                      </div>
                      <div className={`${MONO} text-[7px] text-white/40 uppercase tracking-wider`}>Max Weight</div>
                    </div>
                  </div>
                </div>

                {/* Next module preview */}
                {nextEx && (
                  <div className="border border-white/20 p-5">
                    <div className={`${MONO} text-[9px] text-white/50 uppercase tracking-[2px] mb-3`}>Next Module</div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`${MONO} text-[15px] text-white font-bold uppercase`}>{nextEx.name}</div>
                        <div className={`${MONO} text-[10px] text-white/50 mt-1`}>
                          {nextEx.sets} sets × {nextEx.reps} reps · {nextEx.rest} rest
                        </div>
                        {isDeferred && (
                          <div className={`${MONO} text-[8px] text-[#ff6600] uppercase tracking-wider mt-1`}>
                            Previously deferred · Do it now or skip entirely?
                          </div>
                        )}
                      </div>
                      <div className={`${MONO} text-[10px] text-white/30 shrink-0`}>
                        [{String(nextExIdx + 1).padStart(2, "0")}/{resolvedOrder.length}]
                      </div>
                    </div>
                  </div>
                )}

                {/* Timer running indicator */}
                <div className="flex items-center gap-2 border border-white/10 p-3">
                  <div className="size-2 bg-[#ff6600] animate-pulse shrink-0" />
                  <div className={`${MONO} text-[8px] text-white/40 uppercase tracking-wider`}>
                    Clock running · {formatTime(timer)} elapsed
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================ */}
          {/* REST TIMER — between sets */}
          {/* ============================================================ */}
          {status === "resting" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className={`${MONO} text-[10px] text-white/40 uppercase tracking-[2px] mb-4`}>
                Rest Period
              </div>
              <div className={`${MONO} text-[64px] font-bold ${(restCountdown ?? 0) <= 6 ? 'text-[#ff6600]' : 'text-white'} ${(restCountdown ?? 0) <= 5 && (restCountdown ?? 0) > 0 ? 'animate-pulse' : ''}`}>
                {restCountdown ?? 0}s
              </div>
              <div className={`${MONO} text-[9px] text-white/40 uppercase mt-2 mb-6`}>
                Next: Set {currentSet} of {targetSets}
              </div>
              {/* Progress bar */}
              <div className="w-full max-w-[280px] h-1 bg-white/10 relative mb-8">
                <div
                  className="absolute inset-y-0 left-0 bg-[#ff6600] transition-all duration-1000"
                  style={{ width: `${((restSeconds - (restCountdown ?? 0)) / restSeconds) * 100}%` }}
                />
              </div>
              <button
                onClick={() => setStatus("active")}
                className={`w-full max-w-[280px] border border-[#ff6600] text-[#ff6600] ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff6600]/10 transition-colors`}
              >
                Skip Rest &rarr; Begin Set {currentSet}
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* ACTIVE WORKOUT VIEW */}
          {/* ============================================================ */}
          {(status === "active" || status === "ready" || status === "paused" || status === "initializing") && (
            <>
              {/* Countdown Timer for timed exercises */}
              {isTimed && countdown !== null && status === "active" ? (
                <>
                  <div className="border-2 border-[#ff6600] p-6 mb-4 text-center relative">
                    <div className={`${MONO} text-[10px] text-[#ff6600] uppercase tracking-[2px] mb-2`}>
                      Time Remaining
                    </div>
                    <div className={`${MONO} text-[48px] font-bold ${countdown <= 6 ? 'text-[#ff6600]' : 'text-white'} ${countdown <= 5 && countdown > 0 ? 'animate-pulse' : ''}`}>
                      {countdown}s
                    </div>
                    <div className={`${MONO} text-[8px] text-white/40 uppercase mt-1`}>
                      Set {currentSet} of {targetSets}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-white/10 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#ff6600] transition-all duration-1000"
                        style={{ width: `${((targetReps - (countdown ?? 0)) / targetReps) * 100}%` }}
                      />
                    </div>
                  </div>
                  {/* Smaller elapsed timer underneath */}
                  <div className="flex items-center justify-center gap-2 mb-4 border border-white/10 p-2">
                    <div className="size-2 bg-[#ff6600] animate-pulse shrink-0" />
                    <div className={`${MONO} text-[10px] text-white/40 uppercase tracking-wider`}>
                      Elapsed · {formatTime(timer)}
                    </div>
                  </div>
                </>
              ) : (
                /* Standard elapsed timer for non-timed exercises */
                <div className="border-2 border-white/20 p-6 mb-6 flex flex-col items-center justify-center">
                  <div className={`${MONO} text-[10px] text-white/40 uppercase tracking-[2px] mb-2 text-center`}>Elapsed Time</div>
                  <div className={`${MONO} text-[48px] text-white font-bold tracking-wider text-center`}>{formatTime(timer)}</div>
                </div>
              )}

              {/* Set/Rep Counter */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-[#ff6600] p-4 text-center">
                  <div className={`${MONO} text-[10px] text-[#ff6600] uppercase tracking-wider mb-2`}>Current Set</div>
                  <div className={`${MONO} text-[36px] text-[#ff6600] font-bold`}>{currentSet}</div>
                  <div className={`${MONO} text-[8px] text-white/40 uppercase`}>of {targetSets}</div>
                </div>
                <div className="border border-white/20 p-4 text-center">
                  <div className={`${MONO} text-[10px] text-white/60 uppercase tracking-wider mb-2`}>{isTimed ? "Target Time" : "Target Reps"}</div>
                  <div className={`${MONO} text-[36px] text-white font-bold`}>{isTimed ? rawReps : targetReps}</div>
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
                  SET {currentSet} OF {targetSets} · EXERCISE {currentExerciseIdx + 1}/{resolvedOrder.length}
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
                  <div className={`${MONO} text-[16px] text-white font-bold`}>{currentExerciseIdx + 1}/{resolvedOrder.length}</div>
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
                    Protocol — {resolvedOrder.length} modules
                  </div>
                  <ul className="space-y-1">
                    {resolvedOrder.map((exIdx, pos) => {
                      const ex = exercises[exIdx];
                      return (
                        <li key={pos} className={`${MONO} text-[10px] text-white/80`}>
                          · [{String(pos + 1).padStart(2, "0")}] {ex.name} — {ex.sets}x{ex.reps} ({ex.rest} rest)
                        </li>
                      );
                    })}
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
                {isTimed && countdown !== null && countdown > 0
                  ? `End Early · Log Set [${currentSet}/${targetSets}]`
                  : `Set Complete · Log Data [${currentSet}/${targetSets}]`}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePause}
                  className={`w-full border-2 border-white/30 text-white ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors`}
                >
                  Pause
                </button>
                {skippedExercises.includes(resolvedOrder[currentExerciseIdx]) ? (
                  <button
                    onClick={handleRemoveExercise}
                    className={`w-full border-2 border-white/30 text-white/70 ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:border-red-500 hover:text-red-400 transition-colors`}
                  >
                    Skip Entirely
                  </button>
                ) : (
                  <button
                    onClick={handleSkipExercise}
                    disabled={resolvedOrder.length <= 1}
                    className={`w-full border-2 text-[11px] font-bold uppercase tracking-wider py-3 transition-colors ${MONO} ${
                      resolvedOrder.length <= 1
                        ? "border-white/10 text-white/20 cursor-not-allowed"
                        : "border-white/30 text-white/70 hover:border-[#ff6600] hover:text-[#ff6600]"
                    }`}
                    title="Machine taken? Defer this exercise — it will be added to the end of your session."
                  >
                    Defer Module
                  </button>
                )}
              </div>
            </>
          )}

          {status === "transition" && (() => {
            const nextExIdx = currentExerciseIdx + 1;
            const nextEx = nextExIdx < resolvedOrder.length ? exercises[resolvedOrder[nextExIdx]] : null;
            const nextIsDeferred = nextEx && skippedExercises.includes(resolvedOrder[nextExIdx]);
            // Only allow skipping next if there will still be exercises after it
            const canSkipNext = nextEx !== null && resolvedOrder.length - (currentExerciseIdx + 1) > 1;
            return (
              <>
                <button
                  onClick={handleProceedFromTransition}
                  className={`w-full bg-[#ff6600] text-black ${MONO} text-[12px] font-bold uppercase tracking-wider py-4 hover:bg-[#ff8833] transition-colors`}
                >
                  {nextIsDeferred ? "Do Module Now" : "Proceed to Next Module"}
                </button>
                {canSkipNext && !nextIsDeferred && (
                  <button
                    onClick={handleSkipNextFromTransition}
                    className={`w-full border-2 border-white/30 text-white/70 ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors`}
                  >
                    Defer Module
                  </button>
                )}
                {nextIsDeferred && (
                  <button
                    onClick={handleRemoveNextFromTransition}
                    className={`w-full border-2 border-white/30 text-white/70 ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:border-red-500 hover:text-red-400 transition-colors`}
                  >
                    Skip Entirely
                  </button>
                )}
              </>
            );
          })()}

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
                onClick={handleEndSessionEarly}
                className={`w-full border-2 border-white/30 text-white ${MONO} text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-white/10 transition-colors`}
              >
                End Session
              </button>
            </>
          )}

          {status === "encoded" && (
            <>
              <button
                onClick={() => { clearWIP(); wipFinishedRef.current = true; closePiP(); onClose(); }}
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
    resting: { color: "#ff6600", text: "Rest period · Recovery in progress", pulse: true },
    transition: { color: "#ff6600", text: "Module complete · Preparing next target", pulse: true },
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
