import { useState } from "react";
import { useNavigate } from "react-router";
import imgLogo from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";
import { useOnboardingStore } from "../../../stores/onboardingStore";

export function CTA() {
  const navigate = useNavigate();
  const { setEmail: setStoreEmail } = useOnboardingStore();
  const [email, setEmail] = useState("");

  const handleDeploy = () => {
    if (email) {
      setStoreEmail(email);
    }
    navigate("/onboarding/welcome");
  };

  return (
    <section id="cta" className="bg-black py-24 md:py-32 relative">
      <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f60]/[0.03] via-transparent to-transparent" />

      <div className="max-w-3xl mx-auto px-6 text-center relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={imgLogo} alt="Stride" className="h-20 w-auto object-contain opacity-40" />
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 bg-[#f60] animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60]">
            Awaiting Initialization
          </span>
        </div>

        <h2 className="font-['JetBrains_Mono'] text-[24px] md:text-[36px] tracking-[1px] uppercase text-white mb-6">
          Ready to Deploy?
        </h2>

        <p className="font-['JetBrains_Mono'] text-[12px] md:text-[13px] leading-[2] text-white/40 max-w-lg mx-auto mb-10">
          Join 12,847 operators running the STRIDE protocol.
          <br />
          Autonomous agents calibrate your training architecture in real time.
          <br />
          No static plans. No guesswork. Continuous adaptation.
        </p>

        {/* Email form */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <div className="flex-1 border border-white/20 flex items-center px-4 py-3 hover:border-white/30 transition-colors focus-within:border-[#f60]">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#f60] mr-3">{`>`}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDeploy()}
              placeholder="operator@email.sys"
              className="bg-transparent font-['JetBrains_Mono'] text-[11px] text-white/80 placeholder:text-white/25 outline-none w-full"
            />
          </div>
          <button
            onClick={handleDeploy}
            className="font-['JetBrains_Mono'] text-[11px] tracking-[1px] uppercase bg-[#f60] text-black px-6 py-3 hover:bg-[#ff8533] transition-colors whitespace-nowrap cursor-pointer"
          >
            Deploy →
          </button>
        </div>

        {/* Fine print */}
        <p className="font-['JetBrains_Mono'] text-[8px] tracking-[1px] uppercase text-white/20 mt-6">
          Free tier available • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
}