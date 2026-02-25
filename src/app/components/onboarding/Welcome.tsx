import image_649dc395704951058b9543ab59c196ca800a5539 from 'figma:asset/649dc395704951058b9543ab59c196ca800a5539.png'
import image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51 from 'figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.png'
import { useState } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.png";

export default function Welcome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (email) {
      navigate('/onboarding/verify');
    }
  };

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: '100% 4px'
      }} />

      <div className="relative z-10 w-full max-w-[375px] p-6 flex flex-col items-center justify-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="h-[24px] w-[35px] overflow-hidden relative">
            <img 
              src={image_649dc395704951058b9543ab59c196ca800a5539} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider text-center">
            System Access
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-6 w-full">
          {/* Email Input */}
          <div className="flex flex-col gap-3">
            <label className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@system.net"
              className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none"
            />
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!email}
            className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
          >
            Continue →
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-white/20" />
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-[2px]">
              Or Continue With
            </div>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Wallet Connect Button */}
          <button className="w-full border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <svg className="size-4" fill="none" viewBox="0 0 18 18">
              <path 
                d="M3.75 5.625H2.25C1.83579 5.625 1.5 5.96079 1.5 6.375V13.5C1.5 13.9142 1.83579 14.25 2.25 14.25H3.75M3.75 5.625V14.25M3.75 5.625H14.25M3.75 14.25H14.25M14.25 5.625H15.75C16.1642 5.625 16.5 5.96079 16.5 6.375V13.5C16.5 13.9142 16.1642 14.25 15.75 14.25H14.25M14.25 5.625V14.25M6 5.625V14.25M12 5.625V14.25M9 2.25V5.625M7.5 3.75H10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
            Connect Wallet
          </button>
        </div>

        {/* Terms */}
        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 text-center">
          By continuing, you agree to our{" "}
          <span className="text-white/60 underline cursor-pointer">Terms of Service</span>
          {" "}and{" "}
          <span className="text-white/60 underline cursor-pointer">Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
