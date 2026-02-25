import { Outlet } from "react-router";

export default function OnboardingLayout() {
  return (
    <div className="bg-black w-full min-h-screen flex items-center justify-center p-4">
      {/* iPhone Frame Container */}
      <div className="bg-black w-full max-w-[375px] h-[812px] flex flex-col border-2 border-white/10 relative overflow-hidden">
        {/* Subtle scanline effect */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.015]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />
        
        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="w-full h-full overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
