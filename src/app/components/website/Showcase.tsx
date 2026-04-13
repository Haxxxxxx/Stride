import bannerImg from "figma:asset/72adf8c81e75bc2c83d8cccbb4260f37ad063c73.webp";

export function Showcase() {
  return (
    <section className="relative overflow-hidden">
      {/* Full-width cinematic banner */}
      <div className="relative h-[70vh] md:h-[80vh] flex items-center justify-center">
        {/* Background image — fills width */}
        <div className="absolute inset-0">
          <img
            src={bannerImg}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Heavy dark gradient overlays (top and bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-black/30" />

        {/* Centered content — minimal */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Decorative top accent */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-[#f60]/40" />
            <div className="w-2 h-2 bg-[#f60]" />
            <div className="h-px w-16 bg-[#f60]/40" />
          </div>

          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60] block mb-6">
            Field Operations
          </span>

          <h2 className="font-['JetBrains_Mono'] text-[32px] md:text-[48px] lg:text-[56px] tracking-[2px] uppercase text-white mb-6">
            Built for
            <br />
            Operators
          </h2>

          <p className="font-['JetBrains_Mono'] text-[12px] md:text-[14px] tracking-[3px] uppercase text-white/50">
            Ascend through calibrated resistance.
          </p>

          {/* Decorative bottom accent */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <div className="h-px w-12 bg-white/10" />
            <div className="w-1.5 h-1.5 bg-[#f60]/40" />
            <div className="h-px w-12 bg-white/10" />
          </div>
        </div>

        {/* Top border */}
        <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />
      </div>
    </section>
  );
}
