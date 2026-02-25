import { Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import imgRectangle6 from "figma:asset/c92ce858c610970c9ceacaa61f2a4aa8318c963d.png";
import { CircularProgress } from "./CircularProgress";
import { useState, useEffect } from "react";
import { WorkoutSequenceModal } from "./WorkoutSequenceModal";
import { SystemMessage } from "./SystemMessage";
import { getRandomMessage, getStreakMilestoneMessage } from "../utils/microLanguage";
import { getBehaviorState, recordLogin } from "../utils/behaviorStore";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToDocument, queryCollection, where } from "../../services/firestore";
import type { Program, WorkoutDay } from "../../services/programGenerator";

function Avatar() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 size-[50px]">
      <div className="aspect-[54/54] h-full relative shrink-0 border border-white/40">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full grayscale" src={imgRectangle6} />
      </div>
    </div>
  );
}

function TopBar({ callsign, avatarUrl }: { callsign: string; avatarUrl?: string }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full pb-4 border-b border-white/10">
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
        {avatarUrl ? (
          <div className="content-stretch flex items-center relative shrink-0 size-[50px]">
            <div className="aspect-[54/54] h-full relative shrink-0 border border-white/40">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full grayscale" src={avatarUrl} />
            </div>
          </div>
        ) : (
          <Avatar />
        )}
        <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0">
          <p className="font-['JetBrains_Mono',monospace] font-normal leading-[1.2] relative shrink-0 text-[10px] text-white/40 w-full uppercase tracking-[1px]">
            OPERATOR:
          </p>
          <p className="font-['JetBrains_Mono',monospace] font-bold leading-[1.2] relative shrink-0 text-[18px] text-white uppercase tracking-wider">
            {callsign}
          </p>
        </div>
      </div>

      <div className="content-stretch flex gap-[12px] h-[44px] items-center justify-center relative shrink-0">
        <Link to="/app/notifications" className="bg-black border border-white/30 content-stretch flex gap-[6px] items-center px-[10px] py-[6px] relative shrink-0 hover:border-[#ff6600] transition-colors">
          <div className="flex flex-col font-['JetBrains_Mono',monospace] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-center text-[#ff6600] whitespace-nowrap tracking-wider">
            <p className="leading-[1.2]">0</p>
          </div>
          <div className="relative shrink-0 size-[14px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
              <path d={svgPaths.p305a1d00} fill="#ff6600" />
            </svg>
            <div className="absolute bg-[#ff6600] size-[6px] bottom-0 right-0" />
          </div>
        </Link>
        <Link to="/app/notifications" className="relative shrink-0 size-[22px] hover:opacity-70 transition-opacity">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <path d={svgPaths.p17c25080} fill="white" />
          </svg>
          <div className="absolute bg-[#ff6600] size-[6px] bottom-0 right-0" />
        </Link>
      </div>
    </div>
  );
}

function SystemStatus() {
  const state = getBehaviorState();

  return (
    <div className="w-full border border-white/20 bg-black p-6 relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
            System Status
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold uppercase tracking-wider">
            Operational
          </div>
        </div>
        <div className="size-3 bg-[#ff6600] animate-pulse" />
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-white/10 p-3">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
            Streak
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[24px] text-[#ff6600] font-bold">
            {state.streakDays}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase">
            Days
          </div>
        </div>
        
        <div className="border border-white/10 p-3">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
            Consistency
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold">
            {Math.round((state.workoutsCompletedThisWeek / Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1)) * 100)}%
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase">
            Score
          </div>
        </div>

        <div className="border border-white/10 p-3">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
            Alignment
          </div>
          <div className={`font-['JetBrains_Mono',monospace] text-[24px] font-bold ${state.alignmentScore >= 75 ? 'text-white' : 'text-[#ff6600]'}`}>
            {state.alignmentScore}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase">
            / 100
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.02) 2px, rgba(255, 255, 255, 0.02) 2px)`
      }} />
    </div>
  );
}

function WeekOverview({ programName, currentWeek, todayDayIndex }: { programName: string; currentWeek: number; todayDayIndex: number }) {
  const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const now = new Date();
  // Calculate the Monday of the current week
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isPast = i < todayDayIndex;
    const isToday = i === todayDayIndex;
    return {
      day: label,
      date: d.getDate().toString(),
      complete: isPast,
      active: isToday,
      progress: isPast ? 100 : isToday ? 28 : 0,
    };
  });

  return (
    <div className="w-full">
      <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/60 uppercase tracking-[2px] mb-4">
        {programName ? `${programName} → Week ${String(currentWeek).padStart(2, "0")}` : "Calibration Cycle"}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.day}
            className={`bg-black border p-2 flex flex-col items-center gap-1 ${
              day.active
                ? 'border-[#ff6600]'
                : day.complete
                  ? 'border-white/30'
                  : 'border-white/10'
            }`}
          >
            <CircularProgress
              progress={day.progress}
              isComplete={day.complete}
              isActive={day.active}
            />
            <div className={`font-['JetBrains_Mono',monospace] text-[7px] uppercase tracking-wide ${
              day.active ? 'text-[#ff6600]' : day.complete ? 'text-white' : 'text-white/50'
            }`}>
              {day.day}
            </div>
            <div className={`font-['JetBrains_Mono',monospace] text-[7px] font-bold ${
              day.active ? 'text-[#ff6600]' : 'text-white'
            }`}>
              {day.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveOperation({ onOpenModal, todayWorkout }: { onOpenModal: () => void; todayWorkout: WorkoutDay | null }) {
  if (!todayWorkout) {
    return (
      <div className="w-full border border-white/20 bg-black p-5 relative">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-3">
          Active Protocol
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[13px] text-white/60 mb-4">
          No active program. Complete onboarding to generate your training protocol.
        </div>
        <Link
          to="/app/agent"
          className="block w-full border border-[#ff6600] text-center text-[#ff6600] font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff6600]/10 transition-colors"
        >
          Talk to Agent →
        </Link>
      </div>
    );
  }

  const totalSets = todayWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalModules = todayWorkout.exercises.length;

  return (
    <div className="w-full border-2 border-[#ff6600] bg-black p-5 relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-2 bg-[#ff6600] animate-pulse" />
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-[2px]">
          Active Protocol
        </div>
      </div>

      <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold uppercase tracking-wider mb-3">
        {todayWorkout.name}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Sets</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">{totalSets}</div>
        </div>
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Modules</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">{totalModules}</div>
        </div>
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Day</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">{todayWorkout.dayNumber}</div>
        </div>
      </div>

      <button
        onClick={onOpenModal}
        className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors"
      >
        Begin Calibration
      </button>
    </div>
  );
}

function OperationsList({ todayWorkout }: { todayWorkout: WorkoutDay | null }) {
  const exercises = todayWorkout?.exercises ?? [];

  if (exercises.length === 0) {
    return (
      <div className="w-full">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px] mb-4">
          Protocol Queue
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40">
          No exercises queued.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
          Protocol Queue
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wide">
          {exercises.length} modules
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex, i) => (
          <div
            key={i}
            className={`border p-3 flex items-center justify-between ${
              i === 0
                ? 'border-[#ff6600] bg-[#ff6600]/5'
                : 'border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {i === 0 && (
                <div className="size-2 bg-[#ff6600] animate-pulse" />
              )}
              <div className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wide ${
                i === 0 ? 'text-white' : 'text-white'
              }`}>
                [{(i + 1).toString().padStart(2, '0')}] {ex.name}
              </div>
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40">
              {ex.sets}x{ex.reps}
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/app/progress"
        className="block w-full border border-white/20 text-center text-white/60 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 mt-3 hover:bg-white/5 transition-colors"
      >
        View Full Protocol →
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState(true);
  const [callsign, setCallsign] = useState("Operator");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [activeProgram, setActiveProgram] = useState<(Program & { id?: string; createdAt?: string }) | null>(null);

  // Subscribe to user profile for callsign
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDocument<Record<string, unknown>>(`users/${user.uid}`, (data) => {
      if (data) {
        if (data.callsign) setCallsign(data.callsign as string);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl as string);
      }
    });
    return unsub;
  }, [user]);

  // Load active program
  useEffect(() => {
    if (!user) return;
    queryCollection<Program & { id: string }>(
      `users/${user.uid}/programs`,
      [where("active", "==", true)]
    ).then((programs) => {
      if (programs.length > 0) {
        setActiveProgram(programs[0]);
      }
    }).catch(console.warn);
  }, [user]);

  useEffect(() => {
    // Record login and show login trigger message
    const state = recordLogin();
    setLoginMessage(getRandomMessage("login"));

    // Check for streak milestone
    const milestone = getStreakMilestoneMessage(state.streakDays);
    if (milestone) {
      setStreakMessage(milestone);
    }
  }, []);

  // Derive today's workout from active program
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
  const currentWeek = activeProgram ? Math.min(
    Math.ceil((Date.now() - new Date(activeProgram.createdAt ?? Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1,
    activeProgram.durationWeeks
  ) : 1;
  const weekData = activeProgram?.weeks?.[currentWeek - 1];
  const todayWorkout = weekData?.days?.[todayDayIndex % (weekData.days.length || 1)] ?? null;

  return (
    <div className="w-full p-6 pb-24 space-y-6">
      <TopBar callsign={callsign} avatarUrl={avatarUrl} />

      {/* Login Trigger Message */}
      {showLoginMessage && loginMessage && (
        <SystemMessage
          message={loginMessage}
          variant="default"
          onDismiss={() => setShowLoginMessage(false)}
          autoDismiss={8000}
        />
      )}

      {/* Streak Milestone Message */}
      {streakMessage && (
        <SystemMessage
          message={streakMessage}
          variant="streak"
          onDismiss={() => setStreakMessage(null)}
        />
      )}

      <SystemStatus />
      <WeekOverview
        programName={activeProgram?.name ?? ""}
        currentWeek={currentWeek}
        todayDayIndex={todayDayIndex}
      />
      <ActiveOperation onOpenModal={() => setIsModalOpen(true)} todayWorkout={todayWorkout} />
      <OperationsList todayWorkout={todayWorkout} />
      <WorkoutSequenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}