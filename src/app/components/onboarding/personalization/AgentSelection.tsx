import { useState } from "react";
import { useNavigate } from "react-router";
import PersonalizationLayout from "./PersonalizationLayout";
import { getTotalSteps, getCurrentStepNumber } from "../../../utils/onboardingSteps";
import svgPaths from "../../../../imports/svg-oe8cws8da9";

type Agent = "atlas" | "orion" | "kade";

function CheckCircle() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p1e46b900} fill="#ff6600" />
      </svg>
    </div>
  );
}

function EmptyCircle() {
  return (
    <div className="flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-full shrink-0 size-[19.5px] border-2 border-[#ff6600]" />
    </div>
  );
}

interface AgentOption {
  value: Agent;
  name: string;
  description: string;
  recommended?: boolean;
}

export default function AgentSelection() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>("atlas");

  const agents: AgentOption[] = [
    {
      value: "atlas",
      name: "Atlas - The Enforcer",
      description:
        "A calm and firm guardian of discipline that establishes a non-negotiable baseline to protect your streaks against hesitation and rationalization.",
      recommended: true,
    },
    {
      value: "orion",
      name: "Orion - The Navigator",
      description:
        "A warm and strategic guide that intelligently adapts your training trajectory in real-time to navigate stress, injury, or schedule changes without breaking your flow.",
    },
    {
      value: "kade",
      name: "Kade - The Rival",
      description:
        "A bold and playful competitor that gamifies your daily execution with high-stakes dares, challenges and benchmarks to shatter complacency and drive momentum.",
    },
  ];

  const handleContinue = () => {
    if (selectedAgent) {
      localStorage.setItem('trainingAgent', selectedAgent);
      navigate("/onboarding/personalize/forging");
    }
  };

  const currentStep = getCurrentStepNumber(12);

  return (
    <PersonalizationLayout
      step={currentStep}
      totalSteps={getTotalSteps()}
      title="Choose your training agent"
      subtitle="This affects how FORGE pushes, adapts, and holds you accountable."
      onContinue={handleContinue}
      canContinue={selectedAgent !== null}
    >
      <div className="flex flex-col gap-6">
        {/* Agent Options */}
        <div className="flex flex-col gap-6">
          {agents.map((agent) => (
            <button
              key={agent.value}
              onClick={() => setSelectedAgent(agent.value)}
              className={`relative w-full bg-white/10 rounded-lg p-4 flex items-start gap-3 transition-all ${
                selectedAgent === agent.value
                  ? "border-2 border-[#ff6600] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]"
                  : "border-2 border-transparent"
              } ${agent.recommended ? "mt-4" : ""}`}
            >
              {/* Icon */}
              {selectedAgent === agent.value ? <CheckCircle /> : <EmptyCircle />}

              {/* Text Content */}
              <div className="flex-1 text-left">
                <p className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-medium mb-1">
                  {agent.name}
                </p>
                <p className="font-['JetBrains_Mono',monospace] text-[11px] text-white/60 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              {/* Recommended Badge */}
              {agent.recommended && (
                <div className="absolute -top-3 right-4 bg-[#ff6600] px-6 py-1 rounded-lg border border-white/10">
                  <p className="font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase">
                    Recommended
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-2">
          <p className="font-['JetBrains_Mono',monospace] text-[11px] text-white/60">
            You can change your agent at any time.
          </p>
        </div>
      </div>
    </PersonalizationLayout>
  );
}