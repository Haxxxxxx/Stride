import { useState } from "react";
import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";

export default function Step5GoalWeight() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [goalWeight, setGoalWeight] = useState("55");

  const handleContinue = () => {
    if (goalWeight) {
      navigate('/onboarding/personalize/6');
    }
  };

  return (
    <PersonalizationLayout
      step={5}
      totalSteps={10}
      title="Select Target Weight"
      onContinue={handleContinue}
      canContinue={!!goalWeight}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => setUnit("lb")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              unit === "lb"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Pound
          </button>
          <button
            onClick={() => setUnit("kg")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              unit === "kg"
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
              step="0.1"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="w-20 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
            {unit}
          </div>
        </div>
      </div>
    </PersonalizationLayout>
  );
}
