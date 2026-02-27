import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps } from "../../../../stores/onboardingStore";

export default function Step4Weight() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { weight, setWeight, optimizationGoal } = store;

  const handleContinue = () => {
    if (weight.value) {
      if (optimizationGoal === 'fat-loss') {
        navigate('/onboarding/personalize/5');
      } else {
        navigate('/onboarding/personalize/6');
      }
    }
  };

  return (
    <PersonalizationLayout
      step={4}
      totalSteps={getTotalSteps(store)}
      title="Select Weight"
      onContinue={handleContinue}
      canContinue={!!weight.value}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => setWeight({ ...weight, unit: "lb" })}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              weight.unit === "lb"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Pound
          </button>
          <button
            onClick={() => setWeight({ ...weight, unit: "kg" })}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              weight.unit === "kg"
                ? "bg-[#ff6600] text-black"
                : "text-white/40"
            }`}
          >
            Kilogram
          </button>
        </div>

        {/* Weight Input */}
        <div className="flex items-center gap-3">
          <div className="border-2 border-white/40 bg-white/5 px-6 py-4">
            <input
              type="number"
              step="0.1"
              value={weight.value}
              onChange={(e) => setWeight({ ...weight, value: e.target.value })}
              className="w-20 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
            {weight.unit}
          </div>
        </div>
      </div>
    </PersonalizationLayout>
  );
}