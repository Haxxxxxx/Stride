import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import ErrorBoundary from "./ErrorBoundary";
import { useAuth } from "../contexts/AuthContext";
import { updateDocument } from "../../services/firestore";
import { Scanline } from "./Scanline";
import { loadAnyWIP, type WorkoutWIP } from "./WorkoutSequenceModal";

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
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

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
      <div className="absolute inset-[15.91%_70%_36.36%_5.6%]">
        <p className="absolute font-['JetBrains_Mono',monospace] font-medium leading-[normal] left-0 not-italic right-0 text-[11px] text-center text-white top-[calc(50%-3.5px)] tracking-[0.5px] whitespace-nowrap">{time}</p>
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
          aria-label="Dashboard"
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
          aria-label="Progress"
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
          aria-label="Challenges"
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
          aria-label="Profile"
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

/** Floating mini-timer — like YouTube's mini player. Shows on all pages when a workout is in progress. */
function FloatingWorkoutTimer() {
  const [wip, setWip] = useState<WorkoutWIP | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tick = () => {
      const w = loadAnyWIP();
      // Only update wip state when key fields change (avoids re-render every second from new JSON.parse reference)
      setWip(prev => {
        if (!w && !prev) return prev;
        if (!w || !prev) return w;
        if (prev.workoutName === w.workoutName && prev.currentSet === w.currentSet && prev.currentExerciseIdx === w.currentExerciseIdx && prev.savedAt === w.savedAt) return prev;
        return w;
      });
      if (w) {
        // Timer keeps "running" by computing elapsed from saved snapshot
        setElapsed(w.timer + Math.floor((Date.now() - w.savedAt) / 1000));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for the workout modal opening — hide floating timer while modal is active
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setModalOpen(true);
    const onClose = () => { setModalOpen(false); setWip(loadAnyWIP()); };
    window.addEventListener("stride:workoutModalOpen", onOpen);
    window.addEventListener("stride:workoutModalClose", onClose);
    return () => {
      window.removeEventListener("stride:workoutModalOpen", onOpen);
      window.removeEventListener("stride:workoutModalClose", onClose);
    };
  }, []);

  if (!wip || modalOpen) return null;

  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  const name = wip.workoutName.length > 18 ? wip.workoutName.slice(0, 16) + "…" : wip.workoutName;

  const handleTap = () => {
    if (location.pathname === "/app") {
      // Already on dashboard — dispatch event so Dashboard auto-opens the modal
      window.dispatchEvent(new CustomEvent("stride:resumeWorkout"));
    } else {
      // Navigate to dashboard with resume flag
      navigate("/app", { state: { resumeWorkout: true } });
    }
  };

  return (
    <button
      onClick={handleTap}
      className="absolute bottom-[72px] left-2 right-2 z-40 bg-black/95 border border-[#ff6600] backdrop-blur-sm flex items-center gap-3 px-3 py-2.5 group hover:bg-[#ff6600]/10 transition-colors"
    >
      {/* Pulsing indicator */}
      <div className="size-2 bg-[#ff6600] animate-pulse shrink-0" />

      {/* Workout name */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-[1.5px] truncate">
          {name}
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase tracking-wider">
          Set {wip.currentSet} · Ex {wip.currentExerciseIdx + 1}
        </div>
      </div>

      {/* Timer */}
      <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold tabular-nums shrink-0">
        {mm}:{ss}
      </div>

      {/* Resume label */}
      <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/30 uppercase tracking-wider shrink-0 group-hover:text-[#ff6600] transition-colors">
        TAP TO<br />RESUME
      </div>
    </button>
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
  const { user } = useAuth();

  // Heartbeat: update lastSeen every 2 minutes for online presence
  useEffect(() => {
    if (!user) return;
    const ping = () => updateDocument(`users/${user.uid}`, { lastSeen: new Date().toISOString() }).catch(() => {});
    ping(); // immediate on mount
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <div className="bg-black w-full min-h-screen flex items-center justify-center p-4">
      {/* iPhone Frame Container */}
      <div className="bg-black w-full max-w-[375px] h-[812px] max-h-[100dvh] flex flex-col border-2 border-white/10 relative overflow-hidden">
        {/* Subtle scanline effect */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <Scanline opacity="0.015" />
        </div>
        
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
            <FloatingWorkoutTimer />

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