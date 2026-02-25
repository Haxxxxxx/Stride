import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps, getCurrentStepNumber } from "../../../../stores/onboardingStore";

type Equipment =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "machines"
  | "bands"
  | "cardio"
  | "field"
  | "other";

export default function EquipmentAccess() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const selectedEquipment = store.equipmentAccess;
  const setSelectedEquipment = store.setEquipmentAccess;

  const options: { value: Equipment; label: string }[] = [
    { value: "bodyweight", label: "Bodyweight Only" },
    { value: "dumbbells", label: "Dumbbells / Kettlebells" },
    { value: "barbell", label: "Barbell & Plates" },
    { value: "machines", label: "Machines (Commercial Gym)" },
    { value: "bands", label: "Bands / Cables / Suspension" },
    { value: "cardio", label: "Cardio Equipment (Treadmill, Rower, Bike)" },
    { value: "field", label: "Field / Track / Court" },
    { value: "other", label: "Other / Sport Specific" },
  ];

  const handleToggle = (value: Equipment) => {
    if (selectedEquipment.includes(value)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== value));
    } else {
      setSelectedEquipment([...selectedEquipment, value]);
    }
  };

  const handleContinue = () => {
    if (selectedEquipment.length > 0) {
      navigate("/onboarding/personalize/agent");
    }
  };

  return (
    <PersonalizationLayout
      step={getCurrentStepNumber(11, store)}
      totalSteps={getTotalSteps(store)}
      title="What equipment do you have access to?"
      subtitle="Select what you can reliably train with each week."
      onContinue={handleContinue}
      canContinue={selectedEquipment.length > 0}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => {
          const isSelected = selectedEquipment.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={`w-full border-2 p-4 flex items-center gap-3 transition-colors ${
                isSelected
                  ? "border-[#ff6600] bg-[#ff6600]/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div
                className={`size-6 border-2 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? "border-[#ff6600]" : "border-white/40"
                }`}
              >
                {isSelected && <div className="size-3 rounded-full bg-[#ff6600]" />}
              </div>
              <div className="flex-1 text-left">
                <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white uppercase tracking-wider">
                  {option.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </PersonalizationLayout>
  );
}