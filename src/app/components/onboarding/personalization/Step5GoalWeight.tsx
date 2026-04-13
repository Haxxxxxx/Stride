import { useNavigate } from "react-router";
import { useEffect } from "react";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps } from "../../../../stores/onboardingStore";

export default function Step5GoalWeight() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { goalWeight, setGoalWeight, weight } = store;

  // Inherit the unit from the weight step so the user doesn't have to re-select.
  // Only runs once on mount when goalWeight still has its initial default value.
  useEffect(() => {
    if (weight.unit !== goalWeight.unit && !goalWeight.value) {
      setGoalWeight({ ...goalWeight, unit: weight.unit });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnitSwitch = (unit: "kg" | "lb") => {
    if (unit === goalWeight.unit) return;
    const num = parseFloat(goalWeight.value);
    if (!isNaN(num) && num > 0) {
      const converted = unit === "lb" ? Math.round(num * 2.205) : Math.round(num / 2.205);
      setGoalWeight({ value: converted.toString(), unit });
    } else {
      setGoalWeight({ value: "", unit });
    }
  };

  const handleContinue = () => {
    if (goalWeight.value && parseFloat(goalWeight.value) > 0) {
      navigate('/onboarding/personalize/6');
    }
  };

  return (
    <PersonalizationLayout
      step={5}
      totalSteps={getTotalSteps(store)}
      title="Select Target Weight"
      onContinue={handleContinue}
      canContinue={!!goalWeight.value && parseFloat(goalWeight.value) > 0}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => handleUnitSwitch("lb")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              goalWeight.unit === "lb"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Pound
          </button>
          <button
            onClick={() => handleUnitSwitch("kg")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              goalWeight.unit === "kg"
                ? "bg-[#ff6600] text-black"
                : "text-white/40"
            }`}
          >
            Kilogram
          </button>
        </div>

        {/* Goal Weight Input */}
        <div className="flex items-center gap-3">
          <div className="border-2 border-white/40 bg-white/5 px-6 py-4">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={goalWeight.value}
              onChange={(e) => setGoalWeight({ ...goalWeight, value: e.target.value })}
              className="w-20 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
            {goalWeight.unit}
          </div>
        </div>
      </div>
    </PersonalizationLayout>
  );
}
