import image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51 from 'figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.png'
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/dc33bf4dcbc192d6dda86d23d93b5f6dced4ef05.png";
import { useOnboardingStore } from "../../../stores/onboardingStore";

export default function Verify() {
  const { email } = useOnboardingStore();
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      navigate('/onboarding/beta');
    }
  };

  const isComplete = code.every(digit => digit !== "");

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
              src={image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider text-center">
            Verification Code
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 text-center">
            We sent a 6-digit code to {email || "your email address"}
          </div>
        </div>

        {/* Code Input */}
        <div className="flex gap-2 w-full justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-[44px] h-[44px] bg-black border border-white/20 font-['JetBrains_Mono',monospace] text-[20px] text-white text-center focus:border-[#ff6600] focus:outline-none"
            />
          ))}
        </div>

        {/* Resend */}
        <div className="flex items-center justify-center gap-1 font-['JetBrains_Mono',monospace] text-[9px]">
          <span className="text-white/40">Didn't receive the code?</span>
          <button className="text-white/60 underline hover:text-[#ff6600] transition-colors text-[10px]">
            Resend
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!isComplete}
          className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
        >
          Verify →
        </button>

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