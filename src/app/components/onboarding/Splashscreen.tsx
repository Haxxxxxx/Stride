import { useEffect } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";
import { useAuth } from "../../contexts/AuthContext";
import { routeAfterAuth } from "../../utils/routeAfterAuth";

export default function Splashscreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is already authenticated, route them to the right place
  useEffect(() => {
    if (loading || !user) return;
    routeAfterAuth(user.uid, navigate);
  }, [user, loading]);

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: '100% 4px'
      }} />

      <div className="relative z-10 flex flex-col items-center justify-center gap-12 p-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="h-[148px] w-[221px] overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={imgRectangle7} 
                alt="Stride Logo" 
                className="w-[260px] h-[260px] object-contain"
              />
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/60 uppercase tracking-[3px] text-center">
            Personal Autonomy Protocol
          </div>
        </div>

        {/* Get Started Button */}
        <button
          onClick={() => navigate('/onboarding/welcome')}
          className="w-[327px] bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[12px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors border-2 border-[#ff6600]"
        >
          Initialize System →
        </button>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `
          linear-gradient(to right, white 1px, transparent 1px),
          linear-gradient(to bottom, white 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />
    </div>
  );
}