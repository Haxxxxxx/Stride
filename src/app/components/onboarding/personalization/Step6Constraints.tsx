import { useState } from "react";
import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";

type Constraint = "injury" | "time" | "energy" | "equipment" | "none";

export default function Step6Constraints() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Constraint[]>([]);

  const options: { value: Constraint; label: string }[] = [
    { value: "injury", label: "Joint Pain or Injury" },
    { value: "time", label: "Limited Time" },
    { value: "energy", label: "Low Energy / Burnout" },
    { value: "equipment", label: "No Equipment" },
    { value: "none", label: "None" },
  ];

  const handleToggle = (value: Constraint) => {
    if (value === "none") {
      setSelected(selected.includes("none") ? [] : ["none"]);
    } else {
      const newSelected = selected.filter(v => v !== "none");
      if (newSelected.includes(value)) {
        setSelected(newSelected.filter(v => v !== value));
      } else {
        setSelected([...newSelected, value]);
      }
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/personalize/7');
  };

  return (
    <PersonalizationLayout
      step={6}
      totalSteps={10}
      title="System Constraints"
      subtitle="This helps the system adapt your plan safely and realistically"
      onContinue={handleContinue}
      canContinue={selected.length > 0}
    >
      <div className="flex flex-col gap-6">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`w-full border-2 p-4 flex items-center gap-3 transition-colors ${
              selected.includes(option.value)
                ? "border-[#ff6600] bg-[#ff6600]/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div className={`size-6 border-2 flex items-center justify-center ${
              selected.includes(option.value) ? "border-[#ff6600]" : "border-white/40"
            }`}>
              {selected.includes(option.value) && (
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
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white uppercase tracking-wider">
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </PersonalizationLayout>
  );
}
