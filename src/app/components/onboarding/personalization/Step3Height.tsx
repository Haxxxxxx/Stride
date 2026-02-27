import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps } from "../../../../stores/onboardingStore";

export default function Step3Height() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { height, setHeight } = store;

  const handleContinue = () => {
    if (height.value) {
      navigate('/onboarding/personalize/4');
    }
  };

  return (
    <PersonalizationLayout
      step={3}
      totalSteps={getTotalSteps(store)}
      title="Select Height"
      onContinue={handleContinue}
      canContinue={!!height.value}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => setHeight({ ...height, unit: "ft" })}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              height.unit === "ft"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Feet
          </button>
          <button
            onClick={() => setHeight({ ...height, unit: "cm" })}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              height.unit === "cm"
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
              value={height.value}
              onChange={(e) => setHeight({ ...height, value: e.target.value })}
              className="w-20 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
            />
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
            {height.unit}
          </div>
        </div>
      </div>
    </PersonalizationLayout>
  );
}
