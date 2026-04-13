import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import imgLogo from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.webp";

export function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Protocol", href: "#features" },
    { label: "Interface", href: "#screens" },
    { label: "Metrics", href: "#stats" },
    { label: "Operations", href: "#how-it-works" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <img src={imgLogo} alt="Stride" className="h-8 w-auto object-contain" />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-['JetBrains_Mono'] text-[11px] tracking-[2px] uppercase text-white/50 hover:text-[#f60] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <a
            href="#cta"
            onClick={(e) => { e.preventDefault(); navigate(user ? "/app" : "/onboarding/welcome"); }}
            className="font-['JetBrains_Mono'] text-[11px] tracking-[1px] uppercase bg-[#f60] text-black px-5 py-2.5 hover:bg-[#ff8533] transition-colors inline-block cursor-pointer"
          >
            {user ? "Launch App" : "Initialize System"}
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white/70 hover:text-[#f60] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen ? (
              <path d="M6 6L18 18M6 18L18 6" strokeLinecap="square" />
            ) : (
              <>
                <path d="M4 7H20" strokeLinecap="square" />
                <path d="M4 12H20" strokeLinecap="square" />
                <path d="M4 17H20" strokeLinecap="square" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-['JetBrains_Mono'] text-[11px] tracking-[2px] uppercase text-white/50 hover:text-[#f60] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={(e) => { e.preventDefault(); setMobileOpen(false); navigate(user ? "/app" : "/onboarding/welcome"); }}
            className="font-['JetBrains_Mono'] text-[11px] tracking-[1px] uppercase bg-[#f60] text-black px-5 py-2.5 hover:bg-[#ff8533] transition-colors text-center mt-2 cursor-pointer"
          >
            {user ? "Launch App" : "Initialize System"}
          </a>
        </div>
      )}
    </nav>
  );
}
