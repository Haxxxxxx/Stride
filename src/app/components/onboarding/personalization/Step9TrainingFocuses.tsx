import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, getCurrentStepNumber } from "../../../../stores/onboardingStore";

type Focus = "strength" | "cardio" | "mobility" | "sport";

interface FocusOption {
  value: Focus;
  label: string;
  description: string;
}

export default function Step9TrainingFocuses() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const selectedFocuses = store.trainingFocuses;
  const setSelectedFocuses = store.setTrainingFocuses;

  const options: FocusOption[] = [
    {
      value: "strength",
      label: "Strength / Hypertrophy",
      description: "Includes power training + calisthenics",
    },
    {
      value: "cardio",
      label: "Cardio / Endurance",
      description: "General conditioning + race/event prep later",
    },
    {
      value: "mobility",
      label: "Mobility & Recovery",
      description: "Stretching/yoga/maintenance",
    },
    {
      value: "sport",
      label: "Sport / Athletic Performance",
      description: "",
    },
  ];

  const handleToggle = (value: Focus) => {
    if (selectedFocuses.includes(value)) {
      setSelectedFocuses(selectedFocuses.filter((f) => f !== value));
    } else {
      if (selectedFocuses.length < 3) {
        setSelectedFocuses([...selectedFocuses, value]);
      }
    }
  };

  const getLabel = (value: Focus): string | null => {
    const index = selectedFocuses.indexOf(value);
    if (index === 0) return "Primary";
    if (index === 1) return "Secondary";
    if (index === 2) return "Tertiary";
    return null;
  };

  const handleContinue = () => {
    if (selectedFocuses.length >= 2) {
      const hasSport = selectedFocuses.includes('sport');
      if (hasSport) {
        navigate("/onboarding/personalize/sport");
      } else {
        navigate("/onboarding/personalize/equipment");
      }
    }
  };

  return (
    <PersonalizationLayout
      step={getCurrentStepNumber(9, store)}
      totalSteps={getTotalSteps(store)}
      title="Choose Your Training Focuses"
      subtitle="Select 2-3 focuses in order of importance."
      onContinue={handleContinue}
      canContinue={selectedFocuses.length >= 2}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => {
          const isSelected = selectedFocuses.includes(option.value);
          const label = getLabel(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={`w-full border-2 p-4 flex items-start gap-3 transition-colors relative ${
                isSelected
                  ? "border-[#ff6600] bg-[#ff6600]/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              {/* Priority Label */}
              {label && (
                <div className="absolute -top-3 right-4 bg-[#ff6600] px-6 py-1 border border-white/10">
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-black font-bold uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              )}

              {/* Checkbox */}
              <div
                className={`size-6 border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? "border-[#ff6600]" : "border-white/40"
                }`}
              >
                {isSelected && (
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

              {/* Text */}
              <div className="flex-1 text-left">
                <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white uppercase tracking-wider mb-1">
                  {option.label}
                </div>
                {option.description && (
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 leading-relaxed">
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </PersonalizationLayout>
  );
}