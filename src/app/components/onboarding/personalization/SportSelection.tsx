import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, getCurrentStepNumber } from "../../../../stores/onboardingStore";

type Sport =
  | "field-court"
  | "combat"
  | "track-speed"
  | "endurance"
  | "strength"
  | "general";

export default function SportSelection() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const selectedSports = store.sportFocus;
  const setSelectedSports = store.setSportFocus;

  const options: { value: Sport; label: string; description: string }[] = [
    {
      value: "field-court",
      label: "Field / Court Sports",
      description: "Football, Soccer, Basketball, Lacrosse, Rugby",
    },
    {
      value: "combat",
      label: "Combat Sports",
      description: "Boxing, MMA, Wrestling, Jiu-Jitsu, Muay Thai",
    },
    {
      value: "track-speed",
      label: "Track & Speed",
      description: "Sprinting, Hurdles, Jumps",
    },
    {
      value: "endurance",
      label: "Endurance Racing",
      description: "Running, Cycling, Triathlon, Rowing",
    },
    {
      value: "strength",
      label: "Strength Sports",
      description: "Powerlifting, Olympic Lifting, Strongman",
    },
    {
      value: "general",
      label: "Mixed / General Athlete",
      description: "No single sport — wants all-around athletic performance",
    },
  ];

  const handleToggle = (value: Sport) => {
    if (selectedSports.includes(value)) {
      setSelectedSports(selectedSports.filter((s) => s !== value));
    } else {
      setSelectedSports([...selectedSports, value]);
    }
  };

  const handleContinue = () => {
    if (selectedSports.length > 0) {
      navigate("/onboarding/personalize/equipment");
    }
  };

  return (
    <PersonalizationLayout
      step={getCurrentStepNumber(10, store)}
      totalSteps={getTotalSteps(store)}
      title="What sport are you training for?"
      subtitle=""
      onBack={() => navigate('/onboarding/personalize/9')}
      onContinue={handleContinue}
      canContinue={selectedSports.length > 0}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`w-full border-2 p-4 flex items-start gap-3 transition-colors ${
              selectedSports.includes(option.value)
                ? "border-[#ff6600] bg-[#ff6600]/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div
              className={`size-6 border-2 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                selectedSports.includes(option.value) ? "border-[#ff6600]" : "border-white/40"
              }`}
            >
              {selectedSports.includes(option.value) && (
                <div className="size-3 rounded-full bg-[#ff6600]" />
              )}
            </div>
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
        ))}
      </div>
    </PersonalizationLayout>
  );
}