import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../../imports/svg-v0sj4hk01y";

export default function ProgramForging() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Auto-navigate to dashboard after completion
    const timeout = setTimeout(() => {
      navigate("/app");
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

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
              stroke="#ff6600"
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

        {/* Description */}
        <div className="text-center max-w-[280px]">
          <p className="font-['JetBrains_Mono',monospace] text-[13px] text-white/80 leading-relaxed">
            FORGE creates a personalized training plan based on your profile, activity level, and
            goals.
          </p>
        </div>

        {/* Start Training Button (shown when complete) */}
        {progress >= 100 && (
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