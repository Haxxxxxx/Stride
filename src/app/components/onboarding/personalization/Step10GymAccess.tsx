import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, getCurrentStepNumber } from "../../../../stores/onboardingStore";

type GymAccess = "commercial" | "apartment" | "none";

export default function Step10GymAccess() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const selected = store.gymAccess;
  const setSelected = store.setGymAccess;

  const options: { value: GymAccess; label: string; description: string }[] = [
    {
      value: "commercial",
      label: "Yes — Full Commercial Gym",
      description: "Auto-selects Machines, Barbells, Dumbbells, Cables, Cardio.",
    },
    {
      value: "apartment",
      label: "Yes — Limited / Apartment Gym",
      description: "Auto-selects Dumbbells, Limited Machines, Cardio, Bands.",
    },
    {
      value: "none",
      label: "No — Home or Outdoor",
      description: "Defaults to Bodyweight (User manually adds others).",
    },
  ];

  const handleContinue = () => {
    if (selected) {
      navigate("/onboarding/personalize/agent");
    }
  };

  return (
    <PersonalizationLayout
      step={getCurrentStepNumber(12, store)}
      totalSteps={getTotalSteps(store)}
      title="Do You Have Access to a Gym?"
      subtitle=""
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
            <div
              className={`size-6 border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                selected === option.value ? "border-[#ff6600]" : "border-white/40"
              }`}
            >
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