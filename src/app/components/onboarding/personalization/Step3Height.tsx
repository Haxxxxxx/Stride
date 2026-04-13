import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore, getTotalSteps } from "../../../../stores/onboardingStore";
import { useState } from "react";

export default function Step3Height() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { height, setHeight } = store;

  // Parse feet/inches from stored value when in ft mode (e.g. "5'11")
  const parseFtValue = (val: string) => {
    const match = val.match(/^(\d+)'(\d+)$/);
    if (match) return { feet: match[1], inches: match[2] };
    return { feet: val || "", inches: "0" };
  };

  const [feet, setFeet] = useState(() => parseFtValue(height.value).feet);
  const [inches, setInches] = useState(() => parseFtValue(height.value).inches);

  const cmToFt = (cm: number) => {
    const totalInches = Math.round(cm / 2.54);
    return { feet: Math.floor(totalInches / 12).toString(), inches: (totalInches % 12).toString() };
  };

  const ftToCm = (ft: string, inc: string) => {
    const totalInches = (parseInt(ft) || 0) * 12 + (parseInt(inc) || 0);
    return Math.round(totalInches * 2.54).toString();
  };

  const handleUnitSwitch = (unit: "cm" | "ft") => {
    if (unit === height.unit) return;
    if (unit === "ft") {
      const cm = parseInt(height.value);
      if (!isNaN(cm)) {
        const { feet: f, inches: i } = cmToFt(cm);
        setFeet(f);
        setInches(i);
        setHeight({ value: `${f}'${i}`, unit: "ft" });
      } else {
        setFeet("");
        setInches("0");
        setHeight({ value: "", unit: "ft" });
      }
    } else {
      const cmVal = ftToCm(feet, inches);
      setHeight({ value: cmVal, unit: "cm" });
    }
  };

  const handleFeetChange = (f: string) => {
    setFeet(f);
    setHeight({ ...height, value: `${f}'${inches}` });
  };

  const handleInchesChange = (i: string) => {
    const clamped = Math.min(parseInt(i) || 0, 11).toString();
    setInches(i === "" ? "" : clamped);
    setHeight({ ...height, value: `${feet}'${i === "" ? "0" : clamped}` });
  };

  const isValid = height.unit === "cm" ? !!height.value && parseInt(height.value) > 0 : !!feet;

  const handleContinue = () => {
    if (isValid) navigate("/onboarding/personalize/4");
  };

  return (
    <PersonalizationLayout
      step={3}
      totalSteps={getTotalSteps(store)}
      title="Select Height"
      onContinue={handleContinue}
      canContinue={isValid}
    >
      <div className="flex flex-col items-center gap-12">
        {/* Unit Toggle */}
        <div className="bg-white/10 border border-white/20 p-1 flex gap-1">
          <button
            onClick={() => handleUnitSwitch("ft")}
            className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider transition-colors ${
              height.unit === "ft"
                ? "bg-white/20 text-white"
                : "text-white/40"
            }`}
          >
            Feet
          </button>
          <button
            onClick={() => handleUnitSwitch("cm")}
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
        {height.unit === "cm" ? (
          <div className="flex items-center gap-3">
            <div className="border-2 border-white/40 bg-white/5 px-6 py-4">
              <input
                type="number"
                inputMode="decimal"
                value={height.value}
                onChange={(e) => setHeight({ ...height, value: e.target.value })}
                className="w-20 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
                placeholder="175"
              />
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
              cm
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="border-2 border-white/40 bg-white/5 px-4 py-4">
              <input
                type="number"
                inputMode="numeric"
                value={feet}
                onChange={(e) => handleFeetChange(e.target.value)}
                className="w-12 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
                placeholder="5"
                min={1}
                max={8}
              />
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
              ft
            </div>
            <div className="border-2 border-white/40 bg-white/5 px-4 py-4">
              <input
                type="number"
                inputMode="numeric"
                value={inches}
                onChange={(e) => handleInchesChange(e.target.value)}
                className="w-12 bg-transparent font-['JetBrains_Mono',monospace] text-[26px] text-white text-center focus:outline-none"
                placeholder="8"
                min={0}
                max={11}
              />
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white">
              in
            </div>
          </div>
        )}
      </div>
    </PersonalizationLayout>
  );
}
