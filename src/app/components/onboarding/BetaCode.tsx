import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.png";
import { runTransaction, doc as firestoreDoc } from "firebase/firestore";
import { db } from "../../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function BetaCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Pasted multi-char string — distribute across inputs
    if (clean.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < clean.length && index + i < 6; i++) {
        newCode[index + i] = clean[i];
      }
      setCode(newCode);
      const nextIndex = Math.min(index + clean.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = clean;
    setCode(newCode);

    // Auto-focus next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setError("");
    setVerifying(true);
    try {
      const codeRef = firestoreDoc(db, "betaCodes", fullCode.toUpperCase());
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(codeRef);
        if (!snap.exists() || snap.data()?.used) {
          throw new Error("Invalid or expired beta code");
        }
        transaction.update(codeRef, {
          used: true,
          usedBy: user?.uid || null,
          usedAt: new Date().toISOString(),
        });
      });
      navigate("/onboarding/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "Invalid or expired beta code" ? msg : "Failed to verify code. Try again.");
      setVerifying(false);
    }
  };

  const isComplete = code.every(char => char !== "");

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
              src={imgRectangle7} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider text-center">
            Beta Access Code
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 text-center max-w-[280px]">
            To be part of Stride Beta experience, you need to have a beta code
          </div>
        </div>

        {/* Code Input */}
        <div className="flex gap-2 w-full justify-center">
          {code.map((char, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(index, e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-[44px] h-[44px] bg-black border border-white/20 font-['JetBrains_Mono',monospace] text-[20px] text-white text-center uppercase focus:border-[#ff6600] focus:outline-none"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-red-500 text-center -mb-4">
            {error}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!isComplete || verifying}
          className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
        >
          {verifying ? "Verifying..." : "Verify →"}
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