import { useNavigate } from "react-router";
import imgLogo from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden pt-16"
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-black" />

      {/* Additional gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* System status indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-2 h-2 bg-[#f60] animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60]">
            System Online
          </span>
        </div>

        {/* Logo with animated glow */}
        <div className="flex justify-center mb-6 relative">
          {/* Animated glow pulse behind logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-64 h-64 md:w-80 md:h-80 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,102,0,0.4) 0%, rgba(255,102,0,0.1) 40%, transparent 70%)",
                animation: "glowPulse 4s ease-in-out infinite",
              }}
            />
          </div>
          <img
            src={imgLogo}
            alt="Stride"
            className="h-32 md:h-44 w-auto object-contain relative z-10"
          />
        </div>

        {/* Tagline */}
        <p className="font-['JetBrains_Mono'] text-[12px] md:text-[14px] tracking-[4px] uppercase text-white/50 mb-12">
          Personal Autonomy Protocol
        </p>

        {/* Description */}
        <div className="max-w-lg mx-auto mb-14 space-y-3">
          <p className="font-['JetBrains_Mono'] text-[13px] md:text-[14px] leading-[1.8] text-white/50">
            A behavioral operating system for physical execution powered by autonomous agents.
          </p>
          <p className="font-['JetBrains_Mono'] text-[13px] md:text-[14px] leading-[1.8] text-white/50">
            Calibrate your body. Track operational metrics.
          </p>
          <p className="font-['JetBrains_Mono'] text-[13px] md:text-[14px] leading-[1.8] text-white/50">
            Deploy uniquely tailored training protocols that evolve in real time.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/onboarding/welcome")}
            className="font-['JetBrains_Mono'] text-[12px] tracking-[1px] uppercase bg-[#f60] border-2 border-[#f60] text-black px-10 py-4 hover:bg-[#ff8533] hover:border-[#ff8533] transition-colors w-full sm:w-auto text-center cursor-pointer"
          >
            Initialize System →
          </button>
          <a
            href="#features"
            className="font-['JetBrains_Mono'] text-[12px] tracking-[1px] uppercase border border-white/30 text-white/70 px-10 py-4 hover:border-[#f60] hover:text-[#f60] transition-colors w-full sm:w-auto text-center backdrop-blur-sm"
          >
            View Protocol
          </a>
        </div>

        {/* Version tag */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-white/10" />
          <span className="font-['JetBrains_Mono'] text-[8px] tracking-[2px] uppercase text-white/20">
            V2.0 • Build 2026.02
          </span>
          <div className="h-px w-8 bg-white/10" />
        </div>
      </div>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f60]/40 to-transparent" />

      {/* Glow pulse keyframes */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.15); opacity: 0.45; }
        }
      `}</style>
    </section>
  );
}