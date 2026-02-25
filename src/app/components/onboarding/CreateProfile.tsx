import { useState } from "react";
import { useNavigate } from "react-router";
import imgRectangle7 from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.png";

export default function CreateProfile() {
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (pseudo) {
      // Save profile and navigate to personalization
      navigate('/onboarding/personalize/1');
    }
  };

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: '100% 4px'
      }} />

      <div className="relative z-10 w-full max-w-[375px] p-6 flex flex-col items-center justify-center gap-12">
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
            Operator Profile
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-8 w-full">
          {/* Avatar Upload */}
          <div className="flex items-center justify-center">
            <label className="relative size-[90px] border-2 border-white/20 bg-white/5 flex items-center justify-center hover:border-[#ff6600] transition-colors group cursor-pointer overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
              ) : (
                <svg className="size-8 text-white/60 group-hover:text-[#ff6600] transition-colors" fill="none" viewBox="0 0 32 32">
                  <path 
                    d="M16 8V24M8 16H24" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="square"
                  />
                  <circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="2" />
                  <path 
                    d="M9 24C9 20.6863 11.6863 18 15 18H17C20.3137 18 23 20.6863 23 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  />
                </svg>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Pseudo Input */}
          <div className="flex flex-col gap-3">
            <label className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
              Operator Callsign *
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="OPERATOR_001"
              className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!pseudo}
          className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
        >
          Initialize System →
        </button>
      </div>
    </div>
  );
}