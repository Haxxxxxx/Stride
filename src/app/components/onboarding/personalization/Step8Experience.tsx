import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, getCurrentStepNumber } from "../../../../stores/onboardingStore";

export default function Step8Experience() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { experience: selected, setExperience: setSelected } = store;

  const options: { value: Experience; label: string; description: string }[] = [
    { 
      value: "beginner", 
      label: "Beginner",
      description: "New to training or restarting after time off"
    },
    { 
      value: "inconsistent", 
      label: "Inconsistent",
      description: "Train occasionally, but not on a steady schedule"
    },
    { 
      value: "intermediate", 
      label: "Intermediate",
      description: "Train consistently 3–5x per week"
    },
    { 
      value: "advanced", 
      label: "Advanced",
      description: "Train 5+ times per week with structured programs"
    },
  ];

  const handleContinue = () => {
    if (selected) {
      navigate('/onboarding/personalize/9');
    }
  };

  return (
    <PersonalizationLayout
      step={getCurrentStepNumber(8, store)}
      totalSteps={getTotalSteps(store)}
      title="Training Experience"
      subtitle="Used to scale volume, intensity, and recovery."
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={`w-full border-2 p-4 flex items-start gap-3 transition-colors ${
              selected === option.value
                ? "border-[#ff6600] bg-[#ff6600]/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div className={`size-6 border-2 flex items-center justify-center shrink-0 mt-0.5 ${
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
            <div className="flex-1 text-left">
              <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white uppercase tracking-wider mb-1">
                {option.label}
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 leading-relaxed">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </PersonalizationLayout>
  );
}