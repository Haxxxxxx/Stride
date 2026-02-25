import { useState } from "react";
import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";

type SessionTime = "10-20" | "20-40" | "40+";

export default function Step7SessionTime() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SessionTime | null>(null);

  const options: { value: SessionTime; label: string }[] = [
    { value: "10-20", label: "10–20 Minutes" },
    { value: "20-40", label: "20–40 Minutes" },
    { value: "40+", label: "40+ Minutes" },
  ];

  const handleContinue = () => {
    if (selected) {
      navigate('/onboarding/personalize/8');
    }
  };

  return (
    <PersonalizationLayout
      step={7}
      totalSteps={10}
      title="Session Duration"
      subtitle="Choose what you can maintain on your worst week."
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={`w-full border-2 p-4 flex items-center gap-3 transition-colors ${
              selected === option.value
                ? "border-[#ff6600] bg-[#ff6600]/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div className={`size-6 border-2 flex items-center justify-center ${
              selected === option.value ? "border-[#ff6600]" : "border-white/40"
            }`}>
              {selected === option.value && (
                <svg className="size-4" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="#ff6600"
                    strokeWidth={3}
                    strokeLinecap="square"
                  />
                </svg>
              )}
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white uppercase tracking-wider">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </PersonalizationLayout>
  );
}
