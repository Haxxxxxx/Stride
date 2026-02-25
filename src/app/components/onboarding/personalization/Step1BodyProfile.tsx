import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { useOnboardingStore } from "../../../../stores/onboardingStore";

export default function Step1BodyProfile() {
  const navigate = useNavigate();
  const { bodyProfile: selected, setBodyProfile: setSelected } = useOnboardingStore();

  const handleContinue = () => {
    if (selected) {
      navigate('/onboarding/personalize/2');
    }
  };

  return (
    <PersonalizationLayout
      step={1}
      totalSteps={10}
      title="Body Profile"
      subtitle="Used to tailor recovery, volume, and load ranges"
      onContinue={handleContinue}
      canContinue={!!selected}
    >
      <div className="flex flex-col gap-6">
        {/* Woman Option */}
        <button
          onClick={() => setSelected("woman")}
          className={`w-full border-2 p-4 flex items-center gap-3 transition-colors ${
            selected === "woman"
              ? "border-[#ff6600] bg-[#ff6600]/10"
              : "border-white/20 bg-white/5 hover:border-white/40"
          }`}
        >
          <div className={`size-6 border-2 flex items-center justify-center ${
            selected === "woman" ? "border-[#ff6600]" : "border-white/40"
          }`}>
            {selected === "woman" && (
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
            Woman
          </div>
        </button>

        {/* Man Option */}
        <button
          onClick={() => setSelected("man")}
          className={`w-full border-2 p-4 flex items-center gap-3 transition-colors ${
            selected === "man"
              ? "border-[#ff6600] bg-[#ff6600]/10"
              : "border-white/20 bg-white/5 hover:border-white/40"
          }`}
        >
          <div className={`size-6 border-2 flex items-center justify-center ${
            selected === "man" ? "border-[#ff6600]" : "border-white/40"
          }`}>
            {selected === "man" && (
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
            Man
          </div>
        </button>
      </div>
    </PersonalizationLayout>
  );
}
