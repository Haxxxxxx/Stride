import { useNavigate } from "react-router";
import { ReactNode } from "react";

interface PersonalizationLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  canContinue: boolean;
  onBack?: () => void;
}

export default function PersonalizationLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onContinue,
  canContinue,
  onBack,
}: PersonalizationLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (step > 1) {
      navigate(`/onboarding/personalize/${step - 1}`);
    } else {
      navigate('/onboarding/profile');
    }
  };

  return (
    <div className="relative size-full bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
        backgroundSize: '100% 4px'
      }} />

      <div className="relative z-10 w-full max-w-[375px] p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="size-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg className="size-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeWidth={2} d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-[2px]">
            Step {step} of {totalSteps}
          </div>

          <div className="size-6" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col py-12 min-h-0">
          {/* Title Section */}
          <div className="text-center mb-12 flex-shrink-0">
            <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider mb-4">
              {title}
            </div>
            {subtitle && (
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 leading-relaxed">
                {subtitle}
              </div>
            )}
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[11px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#ff6600]"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}