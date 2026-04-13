export function Manifesto() {
  return (
    <section className="bg-black relative">
      <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />

      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
        <p className="font-['JetBrains_Mono'] text-[11px] md:text-[12px] tracking-[2px] uppercase text-white/30 mb-8">
          Not a fitness app.
        </p>

        <p className="font-['JetBrains_Mono'] text-[13px] md:text-[15px] leading-[2] text-white/50">
          STRIDE is a behavioral architecture system
          <br />
          that uses training to reinforce identity.
        </p>
      </div>
    </section>
  );
}
