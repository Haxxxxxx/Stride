import imgLogo from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";

const footerLinks = [
  {
    title: "Protocol",
    links: ["Features", "Pricing"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-16 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand column */}
          <div>
            <img src={imgLogo} alt="Stride" className="h-8 w-auto object-contain mb-4 opacity-60" />
            <p className="font-['JetBrains_Mono'] text-[10px] leading-[1.8] text-white/30">
              Personal Autonomy Protocol.<br />
              A behavioral operating system where<br />
              autonomous agents design and dynamically<br />
              adapt your training based on live user inputs.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-1.5 h-1.5 bg-[#f60]" />
              <span className="font-['JetBrains_Mono'] text-[8px] tracking-[1px] uppercase text-[#f60]">
                Adaptive Protocol: Engaged
              </span>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-['JetBrains_Mono'] text-[10px] tracking-[2px] uppercase text-white/60 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-['JetBrains_Mono'] text-[10px] text-white/30 hover:text-[#f60] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-['JetBrains_Mono'] text-[8px] tracking-[1px] uppercase text-white/20">
            &copy; 2026 Stride Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Twitter", "Discord", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="font-['JetBrains_Mono'] text-[8px] tracking-[1px] uppercase text-white/20 hover:text-[#f60] transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}