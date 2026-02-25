import { Outlet, useLocation, Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import { useState } from "react";
import ErrorBoundary from "./ErrorBoundary";

function Battery() {
  return (
    <div className="absolute inset-[39.39%_3.82%_34.85%_89.69%]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.328 11.3333">
        <g>
          <rect height="10.3333" opacity="0.35" rx="2.16667" stroke="white" width="21" x="0.5" y="0.5" />
          <path d={svgPaths.p9ed9280} fill="white" opacity="0.4" />
          <rect fill="white" height="7.33333" rx="1.33333" width="18" x="2" y="2" />
        </g>
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="bg-black h-[44px] pointer-events-auto w-full border-b border-white/10 relative">
      <Battery />
      <div className="absolute inset-[39.39%_11.64%_35.61%_84.27%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.333 10.9999">
          <path d={svgPaths.p39712400} fill="white" />
        </svg>
      </div>
      <div className="absolute inset-[40.15%_17.07%_35.61%_78.4%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 10.667">
          <path d={svgPaths.p26d17600} fill="white" />
        </svg>
      </div>
      <div className="absolute inset-[15.91%_80%_36.36%_5.6%]">
        <p className="absolute font-['JetBrains_Mono',monospace] font-medium leading-[normal] left-0 not-italic right-0 text-[13px] text-center text-white top-[calc(50%-3.5px)] tracking-[0.5px]">09:41</p>
      </div>
    </div>
  );
}

function HouseSimple() {
  return (
    <svg className="size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <path d={svgPaths.p37582e00} fill="currentColor" />
    </svg>
  );
}

function Target() {
  return (
    <svg className="size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <path d={svgPaths.p2fc49e00} fill="currentColor" />
    </svg>
  );
}

function Trophy() {
  return (
    <svg className="size-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M6 9H4.5a2.5 2.5 0 000 5H6M18 9h1.5a2.5 2.5 0 010 5H18" />
      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M6.75 9v10.143A2.857 2.857 0 009.607 22h4.786a2.857 2.857 0 002.857-2.857V9M6.75 9V5.857A2.857 2.857 0 019.607 3h4.786A2.857 2.857 0 0117.25 5.857V9M6.75 9h10.5" />
    </svg>
  );
}

function User() {
  return (
    <svg className="size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <path d={svgPaths.p2402fb00} fill="currentColor" />
    </svg>
  );
}

function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/app" && location.pathname === "/app") return true;
    if (path !== "/app" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-full flex justify-center p-4">
      <div className="bg-black border border-white/20 flex h-[48px] items-center justify-between p-[2px] w-full max-w-[343px]">
        <Link 
          to="/app" 
          className={`flex flex-1 h-full items-center justify-center transition-colors ${
            isActive("/app") ? "bg-[#ff6600] text-black" : "text-white/50 hover:text-white"
          }`}
        >
          <div className="size-[22px]">
            <HouseSimple />
          </div>
        </Link>
        
        <Link 
          to="/app/progress" 
          className={`flex flex-1 h-full items-center justify-center transition-colors ${
            isActive("/app/progress") ? "bg-[#ff6600] text-black" : "text-white/50 hover:text-white"
          }`}
        >
          <div className="size-[22px]">
            <Target />
          </div>
        </Link>
        
        <Link 
          to="/app/challenges" 
          className={`flex flex-1 h-full items-center justify-center transition-colors ${
            isActive("/app/challenges") ? "bg-[#ff6600] text-black" : "text-white/50 hover:text-white"
          }`}
        >
          <div className="size-[22px]">
            <Trophy />
          </div>
        </Link>
        
        <Link 
          to="/app/profile" 
          className={`flex flex-1 h-full items-center justify-center transition-colors ${
            isActive("/app/profile") ? "bg-[#ff6600] text-black" : "text-white/50 hover:text-white"
          }`}
        >
          <div className="size-[22px]">
            <User />
          </div>
        </Link>
      </div>
    </div>
  );
}

function AIAgentButton() {
  return (
    <Link
      to="/app/ai-agent"
      className="absolute right-6 bottom-24 z-50 size-14 bg-[#ff6600] border-2 border-white/20 flex items-center justify-center group hover:bg-[#ff8833] transition-all"
      aria-label="Launch AI Agent"
    >
      <div className="relative">
        {/* AI Icon - Terminal/Command style */}
        <svg className="size-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2} />
        </svg>
        {/* Pulsing indicator */}
        <div className="absolute -top-1 -right-1 size-2 bg-white animate-pulse" />
      </div>
    </Link>
  );
}

export default function Root() {
  const location = useLocation();
  const isAIPage = location.pathname === '/app/ai-agent';

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
        
        {!isAIPage && (
          <div className="sticky top-0 z-30 w-full shrink-0">
            <StatusBar />
          </div>
        )}
        
        <div className={`w-full flex-1 overflow-y-auto ${isAIPage ? '' : 'pb-[90px]'}`}>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
        
        {!isAIPage && (
          <>
            <div className="absolute bottom-0 left-0 right-0 z-30">
              <Navbar />
            </div>

            <AIAgentButton />
          </>
        )}
      </div>
    </div>
  );
}