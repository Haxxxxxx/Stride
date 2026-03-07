import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../../imports/svg-v0sj4hk01y";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { useAuth } from "../../contexts/AuthContext";
import { setDocument, batchWrite } from "../../../services/firestore";
import { generateProgram, type PersonalizationData } from "../../../services/programGenerator";
import { notifyProgramGenerated } from "../../../services/notifications";

type Stage = "saving" | "generating" | "storing" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  saving: "Saving operator profile...",
  generating: "Generating training program...",
  storing: "Storing program data...",
  done: "Program forged.",
  error: "Generation failed.",
};

export default function ProgramForging() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>("saving");
  const [error, setError] = useState<string | null>(null);
  const store = useOnboardingStore();
  const { user } = useAuth();
  const startedRef = useRef(false);
  const activeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run the full pipeline: save profile → generate program → store program
  useEffect(() => {
    if (startedRef.current || !user) return;
    startedRef.current = true;

    const run = async () => {
      try {
        // Stage 1: Save personalization (0→25%, quick)
        setStage("saving");
        startAsymptotic(0, 25);

        const personalization: PersonalizationData = {
          bodyProfile: store.bodyProfile,
          optimizationGoal: store.optimizationGoal,
          constraints: store.constraints,
          sessionTime: store.sessionTime,
          experience: store.experience,
          trainingFocuses: store.trainingFocuses,
          sportFocus: store.sportFocus,
          equipmentAccess: store.equipmentAccess,
          gymAccess: store.gymAccess,
          height: store.height,
          weight: store.weight,
          goalWeight: store.optimizationGoal === "fat-loss" ? store.goalWeight : undefined,
        };

        await setDocument(`users/${user.uid}/personalization/data`, {
          ...personalization,
          height: store.height,
          weight: store.weight,
          goalWeight: store.goalWeight,
          selectedAgent: store.selectedAgent,
        });

        // Stage 2: Generate program via LLM (25→92%, slow — this is the long one)
        setStage("generating");
        startAsymptotic(25, 92);

        const program = await generateProgram(personalization);

        // Stage 3: Store program in Firestore (92→99%)
        setStage("storing");
        startAsymptotic(92, 99);

        const programId = `program_${Date.now()}`;
        // Atomic batch: store program + mark onboarding complete together
        // If either fails, neither is committed — prevents orphaned state
        await batchWrite([
          {
            type: "set",
            path: `users/${user.uid}/programs/${programId}`,
            data: { ...program, active: true, createdAt: new Date().toISOString() },
          },
          {
            type: "update",
            path: `users/${user.uid}`,
            data: { onboardingComplete: true },
          },
        ]);
        notifyProgramGenerated(user.uid, program.name).catch(console.warn);

        // Done — kill animation and snap to 100%
        stopAnimation();
        store.reset();
        setStage("done");
        setProgress(100);
      } catch (err) {
        stopAnimation();
        console.error("Program forging failed:", err);
        setStage("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    run();
  }, [user]);

  const stopAnimation = () => {
    if (activeInterval.current) {
      clearInterval(activeInterval.current);
      activeInterval.current = null;
    }
  };

  /**
   * Asymptotic progress: starts at `from`, creeps toward `ceiling` forever
   * but never reaches it. Each tick closes ~1.5% of the remaining gap,
   * so the bar always moves but slows down as it approaches the ceiling.
   * Will hover around 98-99% if the task takes 60s+.
   */
  const startAsymptotic = (from: number, ceiling: number) => {
    stopAnimation();
    let current = from;
    setProgress(current);

    activeInterval.current = setInterval(() => {
      const remaining = ceiling - current;
      // Close 1.5% of the remaining gap each tick (every 100ms)
      current += remaining * 0.015;
      setProgress(current);
    }, 100);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: "100% 4px",
        }}
      />

      <div className="relative z-10 w-full max-w-[375px] p-6 flex flex-col items-center justify-center h-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="font-['JetBrains_Mono',monospace] text-[22px] text-white font-bold uppercase tracking-wider mb-4">
            Forging your training
            <br />
            program…
          </h1>
        </div>

        {/* Progress Circle */}
        <div className="relative size-[257px] mb-12">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 232 232">
            {/* Background Circle */}
            <circle
              cx="116"
              cy="116"
              r="110"
              fill="none"
              stroke="#9AA0A6"
              strokeWidth="12"
              opacity="0.3"
            />
            {/* Progress Circle */}
            <circle
              cx="116"
              cy="116"
              r="110"
              fill="none"
              stroke={stage === "error" ? "#ff3333" : "#ff6600"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          </svg>
          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-['JetBrains_Mono',monospace] text-[48px] text-white font-bold">
              {Math.round(progress)}%
            </p>
          </div>
        </div>

        {/* Stage Label */}
        <div className="text-center max-w-[280px]">
          <p className="font-['JetBrains_Mono',monospace] text-[13px] text-white/80 leading-relaxed">
            {STAGE_LABELS[stage]}
          </p>
          {stage === "error" && error && (
            <p className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Error: Retry Button */}
        {stage === "error" && (
          <button
            onClick={handleRetry}
            className="mt-8 w-full border-2 border-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-[#ff6600] font-bold uppercase tracking-wider hover:bg-[#ff6600]/10 transition-colors"
          >
            Retry Generation
          </button>
        )}

        {/* Success: Start Training Button */}
        {stage === "done" && (
          <button
            onClick={() => navigate("/app")}
            className="mt-12 w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors border-2 border-[#ff6600]"
          >
            Start Training →
          </button>
        )}
      </div>
    </div>
  );
}
