import { useState } from "react";
import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";

export default function Step3Height() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [height, setHeight] = useState("175");

  const handleContinue = () => {
    if (height) {
      navigate('/onboarding/personalize/4');
    }
  };

  return (
    <PersonalizationLayout
      step={3}
      totalSteps={10}
      title="Select Height"
      onContinue={handleContinue}
      canContinue={!!height}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => setUnit("ft")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              unit === "ft"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Feet
          </button>
          <button
            onClick={() => setUnit("cm")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              unit === "cm"
                ? "bg-[#ff6600] text-black"
                : "text-white/40"
            }`}
          >
            Centimeter
          </button>
        </div>

        {/* Height Input */}
        <div className="flex items-center gap-3">
          <div className="border-2 border-white/40 bg-white/5 px-6 py-4">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
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
