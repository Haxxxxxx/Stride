import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, type OnboardingState } from "../../../../stores/onboardingStore";

type OptimizationGoal = NonNullable<OnboardingState["optimizationGoal"]>;

export default function Step2Optimization() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { optimizationGoal: selected, setOptimizationGoal: setSelected } = store;

  const options: { value: OptimizationGoal; label: string }[] = [
    { value: "fat-loss", label: "Fat Loss" },
    { value: "general-conditioning", label: "General Conditioning" },
    { value: "strength", label: "Strength Development" },
    { value: "hypertrophy", label: "Hypertrophy" },
  ];

  const handleContinue = () => {
    if (selected) {
      navigate('/onboarding/personalize/3');
    }
  };

  return (
    <PersonalizationLayout
      step={2}
      totalSteps={getTotalSteps(store)}
      title="Primary Objective"
      subtitle="This sets your primary training bias. Everything else adapts around it."
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