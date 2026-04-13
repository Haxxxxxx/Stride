import operationsImg from "figma:asset/557f66d0b5cfb2f6a33db758c75fd84743ec900f.webp";

const steps = [
  {
    id: "01",
    title: "Initialize System",
    description: "Establish your baseline metrics. Autonomous agents calibrate to your current capacity and recovery profile.",
  },
  {
    id: "02",
    title: "Configure Protocol",
    description: "Select mission objectives. The system generates uniquely tailored training architecture aligned with your operational targets.",
  },
  {
    id: "03",
    title: "Execute Operations",
    description: "Deploy calibrated protocols. Log completion data. Strengthen consistency cycles.",
  },
  {
    id: "04",
    title: "Analyze & Adapt",
    description: "Review performance reports. Consult the AI agent interface. Recalibrate protocols for continuous optimization.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black py-24 md:py-32 relative">
      <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60] block mb-3">
            Deployment Guide
          </span>
          <h2 className="font-['JetBrains_Mono'] text-[24px] md:text-[32px] tracking-[1px] uppercase text-white">
            Operations Manual
          </h2>
          <div className="w-12 h-[2px] bg-[#f60] mt-4" />
        </div>

        {/* Split layout: Image left, Steps right */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left side image */}
          <div className="lg:w-[42%] shrink-0 relative">
            <div className="relative overflow-hidden sticky top-24">
              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-[#f60]/5 blur-2xl" />
              <div className="relative border border-white/10">
                <img
                  src={operationsImg}
                  alt="Operations Manual"
                  className="w-full h-auto object-cover opacity-80"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

                {/* Corner frame accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#f60]/60" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#f60]/60" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#f60]/60" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#f60]/60" />

                {/* Overlay label */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#f60]" />
                    <span className="font-['JetBrains_Mono'] text-[8px] tracking-[2px] uppercase text-[#f60]">
                      Protocol Architecture
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side steps */}
          <div className="flex-1">
            <div className="space-y-0">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative group py-8 border-b border-white/5 last:border-b-0 first:pt-0"
                >
                  {/* Step connector line (vertical) */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[23px] top-[60px] bottom-0 w-px bg-white/5 group-hover:bg-[#f60]/20 transition-colors" />
                  )}

                  <div className="flex gap-6">
                    {/* Step number */}
                    <div className="w-12 h-12 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[#f60]/40 transition-colors">
                      <span className="font-['JetBrains_Mono'] text-[16px] text-[#f60]">{step.id}</span>
                    </div>

                    <div className="flex-1 pt-1">
                      <h3 className="font-['JetBrains_Mono'] text-[13px] tracking-[1px] uppercase text-white mb-3">
                        {step.title}
                      </h3>

                      <p className="font-['JetBrains_Mono'] text-[11px] leading-[1.8] text-white/40">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}