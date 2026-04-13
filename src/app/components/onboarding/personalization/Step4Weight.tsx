import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps } from "../../../../stores/onboardingStore";

export default function Step4Weight() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { weight, setWeight, optimizationGoal } = store;

  const handleUnitSwitch = (unit: "kg" | "lb") => {
    if (unit === weight.unit) return;
    const num = parseFloat(weight.value);
    if (!isNaN(num) && num > 0) {
      const converted = unit === "lb" ? Math.round(num * 2.205) : Math.round(num / 2.205);
      setWeight({ value: converted.toString(), unit });
    } else {
      setWeight({ value: "", unit });
    }
  };

  const handleContinue = () => {
    if (weight.value && parseFloat(weight.value) > 0) {
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
      canContinue={!!weight.value && parseFloat(weight.value) > 0}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => handleUnitSwitch("lb")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              weight.unit === "lb"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Pound
          </button>
          <button
            onClick={() => handleUnitSwitch("kg")}
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
              inputMode="decimal"
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