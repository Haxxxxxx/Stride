import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../../imports/svg-v0sj4hk01y";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { useAuth } from "../../contexts/AuthContext";
import { setDocument, updateDocument } from "../../../services/firestore";
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

  // Run the full pipeline: save profile → generate program → store program
  useEffect(() => {
    if (startedRef.current || !user) return;
    startedRef.current = true;

    const run = async () => {
      try {
        // Stage 1: Save personalization (0-30%)
        setStage("saving");
        animateProgress(0, 30, 800);

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
        };

        await setDocument(`users/${user.uid}/personalization/data`, {
          ...personalization,
          height: store.height,
          weight: store.weight,
          goalWeight: store.goalWeight,
          selectedAgent: store.selectedAgent,
        });

        await updateDocument(`users/${user.uid}`, {
          onboardingComplete: true,
        });

        store.reset();

        // Stage 2: Generate program via LLM (30-80%)
        setStage("generating");
        animateProgress(30, 75, 2000);

        const program = await generateProgram(personalization);

        // Stage 3: Store program in Firestore (80-100%)
        setStage("storing");
        animateProgress(75, 95, 500);

        const programId = `program_${Date.now()}`;
        await setDocument(`users/${user.uid}/programs/${programId}`, {
          ...program,
          active: true,
          createdAt: new Date().toISOString(),
        });
        notifyProgramGenerated(user.uid, program.name).catch(console.warn);

        // Done
        setStage("done");
        setProgress(100);
      } catch (err) {
        console.error("Program forging failed:", err);
        setStage("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    run();
  }, [user]);

  // Smooth progress animation helper
  const animateProgress = (from: number, to: number, durationMs: number) => {
    const steps = Math.ceil(durationMs / 50);
    const increment = (to - from) / steps;
    let current = from;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(from + increment * step, to);
      setProgress(current);
      if (step >= steps) clearInterval(interval);
    }, 50);
  };

  const handleRetry = () => {
    startedRef.current = false;
    setProgress(0);
    setStage("saving");
    setError(null);
    // Re-trigger by forcing re-render (the effect checks startedRef)
    startedRef.current = false;
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
