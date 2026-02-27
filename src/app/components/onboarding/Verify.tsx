import image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51 from 'figma:asset/ed2679aab5c84af8a717c4d8b5f3c6d516a31e51.png'
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/dc33bf4dcbc192d6dda86d23d93b5f6dced4ef05.png";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { isEmailSignInLink, completeEmailSignIn, sendEmailSignInLink } from "../../../services/auth";

export default function Verify() {
  const { email, setEmail } = useOnboardingStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "completing" | "success" | "error">("waiting");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);

  // Check if user arrived via email link click
  useEffect(() => {
    if (isEmailSignInLink(window.location.href)) {
      setStatus("completing");
      const storedEmail = email || window.localStorage.getItem("emailForSignIn") || "";
      if (!storedEmail) {
        // Edge case: link opened in different browser — prompt for email
        setNeedsEmail(true);
        setError("Please enter your email to complete sign-in");
        setStatus("error");
        return;
      }
      completeEmailSignIn(storedEmail, window.location.href)
        .then(() => {
          window.localStorage.removeItem("emailForSignIn");
          setStatus("success");
          navigate("/onboarding/beta");
        })
        .catch((err: unknown) => {
          const firebaseErr = err as { message?: string };
          setError(firebaseErr.message || "Sign-in link expired or invalid");
          setStatus("error");
        });
    }
  }, []);

  const handleResend = async () => {
    const targetEmail = email || window.localStorage.getItem("emailForSignIn") || "";
    if (!targetEmail) return;
    try {
      await sendEmailSignInLink(targetEmail);
      setResent(true);
    } catch {
      setError("Failed to resend verification link");
    }
  };

  const handleFallbackSubmit = async () => {
    if (!fallbackEmail || !isEmailSignInLink(window.location.href)) return;
    setStatus("completing");
    setError("");
    try {
      await completeEmailSignIn(fallbackEmail, window.location.href);
      window.localStorage.removeItem("emailForSignIn");
      setStatus("success");
      navigate("/onboarding/beta");
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      setError(firebaseErr.message || "Sign-in link expired or invalid");
      setStatus("error");
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
              src={image_ed2679aab5c84af8a717c4d8b5f3c6d516a31e51} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider text-center">
            {status === "completing" ? "Verifying..." : "Check Your Email"}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 text-center">
            {status === "completing"
              ? "Completing sign-in..."
              : `We sent a sign-in link to ${email || window.localStorage.getItem("emailForSignIn") || "your email"}`}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center gap-4 w-full">
          {status === "completing" && (
            <div className="w-8 h-8 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
          )}
          {status === "waiting" && (
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 text-center px-4">
              Open the link in your email to continue. If you don't see it, check your spam folder.
            </div>
          )}
          {error && (
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-red-500 text-center">
              {error}
            </div>
          )}
          {needsEmail && status === "error" && (
            <div className="flex flex-col gap-3 w-full">
              <input
                type="email"
                value={fallbackEmail}
                onChange={(e) => setFallbackEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-white/5 border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff6600]"
              />
              <button
                onClick={handleFallbackSubmit}
                disabled={!fallbackEmail}
                className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-[#ff6600]/90 transition-colors"
              >
                Complete Sign-In
              </button>
            </div>
          )}
          {resent && (
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] text-center">
              Verification link resent
            </div>
          )}
        </div>

        {/* Resend */}
        <div className="flex items-center justify-center gap-1 font-['JetBrains_Mono',monospace] text-[9px]">
          <span className="text-white/40">Didn't receive the link?</span>
          <button
            onClick={handleResend}
            className="text-white/60 underline hover:text-[#ff6600] transition-colors text-[10px]"
          >
            Resend
          </button>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/onboarding/welcome")}
          className="w-full border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] hover:bg-white/5 transition-colors"
        >
          ← Back
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