import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.png";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { logOut } from "../../../services/auth";
import { getDocumentFresh } from "../../../services/firestore";

export default function BetaCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Skip beta screen if user already validated a code
  const skipChecked = useRef(false);
  useEffect(() => {
    if (!user || verified || skipChecked.current) return;
    skipChecked.current = true;
    getDocumentFresh<{ betaValidated?: boolean; onboardingComplete?: boolean }>(`users/${user.uid}`)
      .then((doc) => {
        if (doc?.onboardingComplete) {
          navigate("/app", { replace: true });
        } else if (doc?.betaValidated) {
          setVerified(true);
          navigate("/onboarding/profile", { replace: true });
        }
      })
      .catch((err) => {
        console.error("Beta check failed:", err);
      });
  }, [user?.uid]);

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
    if (!user) {
      setError("You must be signed in to verify a beta code");
      navigate("/onboarding/welcome", { replace: true });
      return;
    }

    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    setError("");
    setVerifying(true);
    try {
      const validateBetaCode = httpsCallable(functions, "validateBetaCode");
      await validateBetaCode({ code: fullCode.toUpperCase() });
      // Force a server read to refresh the local Firestore cache with the
      // server-set betaValidated flag (set by the Cloud Function above)
      await getDocumentFresh(`users/${user.uid}`);
      setVerified(true);
      navigate("/onboarding/profile", { replace: true });
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      // Cloud Function HttpsError messages come through as-is
      const msg = firebaseErr.message || "";
      if (msg.includes("Invalid or expired beta code")) {
        setError("Invalid or expired beta code");
      } else {
        setError("Failed to verify code. Try again.");
      }
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
              id={`beta-code-${index}`}
              name={`beta-code-${index}`}
              type="text"
              inputMode="text"
              autoComplete="off"
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

        {/* Back to sign-in */}
        <button
          onClick={async () => {
            await logOut();
            navigate("/onboarding/welcome", { replace: true });
          }}
          className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
        >
          ← Back to sign in
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
