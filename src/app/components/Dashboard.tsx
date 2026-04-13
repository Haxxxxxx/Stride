import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import { CircularProgress } from "./CircularProgress";
import { WorkoutSequenceModal, loadAnyWIP, type WorkoutWIP } from "./WorkoutSequenceModal";
import { SystemMessage } from "./SystemMessage";
import { getRandomMessage, getStreakMilestoneMessage } from "../utils/microLanguage";
import { getBehaviorState, recordLogin, checkMissedWorkout } from "../utils/behaviorStore";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToDocument, subscribeToCollection, updateDocument, where, orderBy, limit } from "../../services/firestore";
import type { Program, WorkoutDay, Exercise } from "../../services/programGenerator";
import { toLocalDateStr, getMondayOf, getTodayDayIndex, getCurrentProgramWeek, isProgramExpired } from "../utils/dateUtils";
import { SkeletonBlock } from "./LoadingSkeleton";

interface DashboardWorkoutLog {
  id: string;
  completedAt: string;
  completionType: string;
  exercises?: { name: string }[];
  isActivity?: boolean;
  durationMinutes?: number;
  distance?: string;
}

function DefaultAvatar() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 size-[50px]">
      <div className="aspect-[54/54] h-full relative shrink-0 border border-white/40 bg-white/10 flex items-center justify-center">
        <svg className="size-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" fill="currentColor" stroke="none" />
        </svg>
      </div>
    </div>
  );
}

function TopBar({ callsign, avatarUrl, unreadCount }: { callsign: string; avatarUrl?: string; unreadCount: number }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full pb-4 border-b border-white/10">
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
        {avatarUrl ? (
          <div className="content-stretch flex items-center relative shrink-0 size-[50px]">
            <div className="aspect-[54/54] h-full relative shrink-0 border border-white/40">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={avatarUrl} />
            </div>
          </div>
        ) : (
          <DefaultAvatar />
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
        <Link to="/app/notifications" aria-label="Notifications" className="bg-black border border-white/30 content-stretch flex gap-[6px] items-center px-[10px] py-[6px] relative shrink-0 hover:border-[#ff6600] transition-colors">
          <div className="flex flex-col font-['JetBrains_Mono',monospace] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-center text-[#ff6600] whitespace-nowrap tracking-wider">
            <p className="leading-[1.2]">{unreadCount}</p>
          </div>
          <div className="relative shrink-0 size-[14px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
              <path d={svgPaths.p305a1d00} fill="#ff6600" />
            </svg>
            <div className="absolute bg-[#ff6600] size-[6px] bottom-0 right-0" />
          </div>
        </Link>
        <Link to="/app/notifications" aria-label="Notifications" className="relative shrink-0 size-[22px] hover:opacity-70 transition-opacity">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <path d={svgPaths.p17c25080} fill="white" />
          </svg>
          <div className="absolute bg-[#ff6600] size-[6px] bottom-0 right-0" />
        </Link>
      </div>
    </div>
  );
}

function SystemStatus({ refreshKey }: { refreshKey: number }) {
  const state = getBehaviorState();
  // refreshKey forces re-read of localStorage after workout completion
  void refreshKey;

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
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase">
            Days
          </div>
        </div>

        <div className="border border-white/10 p-3">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
            Consistency
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold">
            {(() => {
              // Use 14d rolling counts for consistency (weekly resets to 0% every Monday)
              const total14d = state.workoutsCompleted14d + state.workoutsSkipped14d;
              return total14d > 0 ? Math.round((state.workoutsCompleted14d / total14d) * 100) : 0;
            })()}%
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase">
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
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 uppercase">
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

function WeekOverview({ programName, currentWeek, todayDayIndex, weekLogs, wip, bonusWip }: { programName: string; currentWeek: number; todayDayIndex: number; weekLogs: Map<string, DashboardWorkoutLog>; wip: WorkoutWIP | null; bonusWip: WorkoutWIP | null }) {
  const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const now = new Date();
  const monday = getMondayOf(now);
  // Either scheduled or bonus WIP counts as "in progress"
  const activeWip = wip || bonusWip;

  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const isToday = i === todayDayIndex;
    const log = weekLogs.get(dateStr);
    const hasLog = !!log;
    const isFullComplete = log?.completionType === "full";

    // Calculate progress: completed log > WIP progress > 0
    const wipTotal = activeWip?.snapshotExercises?.length || (activeWip ? activeWip.exerciseLogs.length + 1 : 1);
    const wipProgress = isToday && !hasLog && activeWip
      ? Math.round((activeWip.exerciseLogs.length / Math.max(wipTotal, 1)) * 100)
      : 0;

    return {
      day: label,
      date: d.getDate().toString(),
      complete: hasLog && isFullComplete,
      partial: hasLog && !isFullComplete,
      active: isToday && !hasLog,
      progress: hasLog ? (isFullComplete ? 100 : 50) : wipProgress,
      inProgress: isToday && !hasLog && !!activeWip,
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
              day.inProgress
                ? 'border-[#ff6600] bg-[#ff6600]/5'
                : day.active
                  ? 'border-[#ff6600]'
                  : day.complete
                    ? 'border-white/30'
                    : day.partial
                      ? 'border-[#ff6600]/40'
                      : 'border-white/10'
            }`}
          >
            <CircularProgress
              progress={day.progress}
              isComplete={day.complete}
              isActive={day.active || day.inProgress}
            />
            {day.inProgress && (
              <div className="size-1.5 bg-[#ff6600] animate-pulse rounded-full" />
            )}
            <div className={`font-['JetBrains_Mono',monospace] text-[7px] uppercase tracking-wide ${
              day.active || day.inProgress ? 'text-[#ff6600]' : day.complete ? 'text-white' : 'text-white/50'
            }`}>
              {day.day}
            </div>
            <div className={`font-['JetBrains_Mono',monospace] text-[7px] font-bold ${
              day.active || day.inProgress ? 'text-[#ff6600]' : 'text-white'
            }`}>
              {day.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Core circuit templates for add-on core training
const coreCircuitTemplates: { id: string; label: string; tag: string; duration: string; exercises: Exercise[] }[] = [
  {
    id: "quick",
    label: "Quick Core",
    tag: "3 Modules",
    duration: "~5 min",
    exercises: [
      { name: "Plank", sets: 3, reps: "30s", rest: "20s" },
      { name: "Crunches", sets: 3, reps: "15", rest: "20s" },
      { name: "Leg Raises", sets: 3, reps: "12", rest: "20s" },
    ],
  },
  {
    id: "full",
    label: "Full Core",
    tag: "5 Modules",
    duration: "~10 min",
    exercises: [
      { name: "Plank", sets: 3, reps: "45s", rest: "20s" },
      { name: "Russian Twists", sets: 3, reps: "20", rest: "20s" },
      { name: "Leg Raises", sets: 3, reps: "15", rest: "20s" },
      { name: "Mountain Climbers", sets: 3, reps: "20", rest: "20s" },
      { name: "Dead Bug", sets: 3, reps: "12", rest: "20s" },
    ],
  },
  {
    id: "advanced",
    label: "Advanced Core",
    tag: "4 Modules",
    duration: "~8 min",
    exercises: [
      { name: "Ab Wheel Rollout", sets: 3, reps: "10", rest: "30s" },
      { name: "Hanging Leg Raise", sets: 3, reps: "12", rest: "30s" },
      { name: "Cable Woodchop", sets: 3, reps: "15", rest: "30s" },
      { name: "Dragon Flag", sets: 3, reps: "6", rest: "45s" },
    ],
  },
];

// Quick workout templates for ad-hoc training after daily completion
const quickWorkoutOptions: { category: string; workout: WorkoutDay }[] = [
  {
    category: "Core",
    workout: {
      dayNumber: 0,
      name: "Quick Core Calibration",
      exercises: [
        { name: "Plank", sets: 3, reps: "45s", rest: "30s" },
        { name: "Sit Ups", sets: 3, reps: "15", rest: "30s" },
        { name: "Russian Twists", sets: 3, reps: "20", rest: "30s" },
        { name: "Leg Raises", sets: 3, reps: "12", rest: "30s" },
      ],
    },
  },
  {
    category: "Cardio",
    workout: {
      dayNumber: 0,
      name: "Quick Cardio Calibration",
      exercises: [
        { name: "Jumping Jacks", sets: 3, reps: "30", rest: "20s" },
        { name: "Burpees", sets: 3, reps: "10", rest: "30s" },
        { name: "Mountain Climbers", sets: 3, reps: "20", rest: "20s" },
        { name: "High Knees", sets: 3, reps: "30", rest: "20s" },
      ],
    },
  },
  {
    category: "Upper Body",
    workout: {
      dayNumber: 0,
      name: "Quick Upper Body Calibration",
      exercises: [
        { name: "Push Ups", sets: 3, reps: "15", rest: "45s" },
        { name: "Diamond Push Ups", sets: 3, reps: "10", rest: "45s" },
        { name: "Dips", sets: 3, reps: "12", rest: "45s" },
        { name: "Pike Push Ups", sets: 3, reps: "10", rest: "45s" },
      ],
    },
  },
  {
    category: "Lower Body",
    workout: {
      dayNumber: 0,
      name: "Quick Lower Body Calibration",
      exercises: [
        { name: "Bodyweight Squats", sets: 3, reps: "20", rest: "30s" },
        { name: "Lunges", sets: 3, reps: "12", rest: "30s" },
        { name: "Wall Sit", sets: 3, reps: "45s", rest: "30s" },
        { name: "Calf Raises", sets: 3, reps: "20", rest: "30s" },
      ],
    },
  },
  {
    category: "Stretching",
    workout: {
      dayNumber: 0,
      name: "Quick Stretch Calibration",
      exercises: [
        { name: "Hamstring Stretch", sets: 2, reps: "30s", rest: "10s" },
        { name: "Quad Stretch", sets: 2, reps: "30s", rest: "10s" },
        { name: "Hip Flexor Stretch", sets: 2, reps: "30s", rest: "10s" },
        { name: "Shoulder Stretch", sets: 2, reps: "30s", rest: "10s" },
      ],
    },
  },
];

function ActiveOperation({ onOpenModal, onResume, onResumeBonusWip, onQuickWorkout, todayWorkout, todayCompleted, todayLog, isRestDay, wip, bonusWip, generatingQuick, showQuickMenu, setShowQuickMenu }: { onOpenModal: () => void; onResume: () => void; onResumeBonusWip: () => void; onQuickWorkout: (day: WorkoutDay) => void; todayWorkout: WorkoutDay | null; todayCompleted: boolean; todayLog: DashboardWorkoutLog | null; isRestDay: boolean; wip: WorkoutWIP | null; bonusWip: WorkoutWIP | null; generatingQuick: boolean; showQuickMenu: boolean; setShowQuickMenu: (v: boolean) => void }) {
  if (!todayWorkout) {
    return (
      <div className="w-full border border-white/20 bg-black p-5 relative">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-3">
          {isRestDay ? "Recovery Day" : "Active Protocol"}
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[13px] text-white/60 mb-4">
          {isRestDay
            ? "No scheduled operation today. Recovery is adaptation. Use this time to recharge."
            : "No active program. Complete onboarding to generate your training protocol."}
        </div>
        {isRestDay && bonusWip ? (
          <button
            onClick={onResumeBonusWip}
            className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors"
          >
            Resume {bonusWip.workoutName}
          </button>
        ) : isRestDay ? (
          <>
            {generatingQuick && (
              <div className="w-full border border-[#ff6600]/50 bg-[#ff6600]/10 py-3 mb-2 text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider animate-pulse">
                  Generating personalized workout...
                </div>
              </div>
            )}
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              disabled={generatingQuick}
              className="w-full border border-[#ff6600] text-[#ff6600] font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
            >
              {showQuickMenu ? "Cancel" : "Optional Bonus Calibration"}
            </button>
          </>
        ) : (
          <Link
            to="/app/ai-agent"
            className="block w-full border border-[#ff6600] text-center text-[#ff6600] font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff6600]/10 transition-colors"
          >
            Talk to Agent →
          </Link>
        )}
        {isRestDay && showQuickMenu && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickWorkoutOptions.map((opt) => (
              <button
                key={opt.category}
                onClick={() => onQuickWorkout(opt.workout)}
                className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2 px-2 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors"
              >
                {opt.category}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const totalSets = todayWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalModules = todayWorkout.exercises.length;

  if (todayCompleted) {
    const isPartial = todayLog?.completionType === "partial";
    const loggedModules = todayLog?.exercises?.length ?? totalModules;

    return (
      <div className="w-full border border-white/30 bg-black p-5 relative">
        <div className="flex items-center gap-2 mb-4">
          <svg className="size-4" fill="none" viewBox="0 0 18 18">
            <path d="M5 9L8 12L13 6" stroke="#ff6600" strokeWidth="2" strokeLinecap="square" fill="none" />
          </svg>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
            {isPartial ? "Session Ended Early" : "Protocol Complete"}
          </div>
        </div>

        <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white/60 font-bold uppercase tracking-wider mb-3">
          {todayWorkout.name}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Sets</div>
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/50 font-semibold">{totalSets}</div>
          </div>
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Modules</div>
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/50 font-semibold">
              {isPartial ? `${loggedModules}/${totalModules}` : totalModules}
            </div>
          </div>
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Status</div>
            <div className={`font-['JetBrains_Mono',monospace] text-[12px] font-semibold ${isPartial ? "text-[#ff6600]/70" : "text-[#ff6600]"}`}>
              {isPartial ? "Partial" : "Done"}
            </div>
          </div>
        </div>

        {isPartial && (
          <button
            onClick={onResume}
            className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors mb-2"
          >
            Resume Session — {totalModules - loggedModules} modules remaining
          </button>
        )}

        <button
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          className="w-full border border-[#ff6600] text-[#ff6600] font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff6600]/10 transition-colors mb-2"
        >
          {showQuickMenu ? "Cancel" : "Add Quick Calibration"}
        </button>

        {showQuickMenu && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {quickWorkoutOptions.map((opt) => (
              <button
                key={opt.category}
                onClick={() => onQuickWorkout(opt.workout)}
                className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2 px-2 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors"
              >
                {opt.category}
              </button>
            ))}
          </div>
        )}

        <Link
          to="/app/progress"
          className="block w-full border border-white/20 text-center text-white/60 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:bg-white/5 transition-colors"
        >
          View Progress →
        </Link>
      </div>
    );
  }

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
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">{todayWorkout.dayNumber === 0 ? "Type" : "Day"}</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">{todayWorkout.dayNumber === 0 ? "Bonus" : todayWorkout.dayNumber}</div>
        </div>
      </div>

      {wip && (
        <div className="flex items-center gap-2 mb-3 border border-[#ff6600]/30 bg-[#ff6600]/5 px-3 py-2">
          <div className="size-2 bg-[#ff6600] animate-pulse" />
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wide">
            In Progress — Exercise {wip.currentExerciseIdx + 1}/{todayWorkout?.exercises.length ?? '?'} · Set {wip.currentSet}
          </div>
        </div>
      )}

      <button
        onClick={onOpenModal}
        className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors"
      >
        {wip ? "Resume Calibration" : "Begin Calibration"}
      </button>

      {/* Orphaned WIP from a different workout (e.g. agent renamed today's workout via regenerateDay) */}
      {!wip && bonusWip && (
        <button
          onClick={onResumeBonusWip}
          className="w-full border border-[#ff6600] text-[#ff6600] font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-2.5 mt-2 hover:bg-[#ff6600]/10 transition-colors"
        >
          Resume {bonusWip.workoutName.length > 24 ? bonusWip.workoutName.slice(0, 22) + "…" : bonusWip.workoutName}
        </button>
      )}
    </div>
  );
}

function OperationsList({ todayWorkout, todayCompleted, completedExerciseNames, wip, onReorder }: { todayWorkout: WorkoutDay | null; todayCompleted: boolean; completedExerciseNames: Set<string>; wip: WorkoutWIP | null; onReorder?: (exercises: Exercise[]) => void }) {
  const exercises = todayWorkout?.exercises ?? [];
  const [editing, setEditing] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // Number of fully completed exercises from saved WIP progress
  const completedExerciseCount = wip ? wip.exerciseLogs.length : 0;
  const currentExerciseIdx = wip ? wip.currentExerciseIdx : 0;

  const canEdit = !wip && exercises.length > 1 && onReorder;

  const moveExercise = (from: number, to: number) => {
    if (to < 0 || to >= exercises.length) return;
    const reordered = [...exercises];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorder?.(reordered);
  };

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

  const statusLabel = todayCompleted
    ? completedExerciseNames.size >= exercises.length
      ? "Completed"
      : `${completedExerciseNames.size}/${exercises.length} done`
    : wip
      ? `${completedExerciseCount}/${exercises.length} done`
      : `${exercises.length} modules`;

  const isBonus = todayWorkout?.dayNumber === 0;
  const queueLabel = isBonus ? todayWorkout?.name ?? "Bonus Calibration" : "Protocol Queue";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
          {queueLabel}
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => setEditing(!editing)}
              className={`font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider px-2 py-1 border transition-colors ${
                editing
                  ? "border-[#ff6600] text-[#ff6600] bg-[#ff6600]/10"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              {editing ? "Done" : "Reorder"}
            </button>
          )}
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wide">
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex, i) => {
          const isExerciseDone = (todayCompleted && completedExerciseNames.has(ex.name)) || (wip && i < completedExerciseCount);
          const isCurrentExercise = !todayCompleted && wip && i === currentExerciseIdx;
          const isNext = !todayCompleted && !wip && i === 0;
          const isDragging = dragIdx === i;

          return (
            <div
              key={`${ex.name}-${i}`}
              className={`border p-3 flex items-center justify-between transition-all ${
                isDragging
                  ? 'border-[#ff6600] bg-[#ff6600]/10 scale-[1.02]'
                  : isExerciseDone
                    ? 'border-white/10'
                    : isCurrentExercise
                      ? 'border-[#ff6600] bg-[#ff6600]/5'
                      : isNext
                        ? 'border-[#ff6600] bg-[#ff6600]/5'
                        : 'border-white/20'
              }`}
              draggable={editing}
              onDragStart={() => setDragIdx(i)}
              onDragEnd={() => setDragIdx(null)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) moveExercise(dragIdx, i); setDragIdx(null); }}
            >
              {editing && (
                <div className="flex flex-col gap-1 mr-3 shrink-0">
                  <button
                    onClick={() => moveExercise(i, i - 1)}
                    disabled={i === 0}
                    className="size-5 border border-white/20 flex items-center justify-center hover:border-[#ff6600] transition-colors disabled:opacity-20 disabled:hover:border-white/20"
                  >
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                      <path d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveExercise(i, i + 1)}
                    disabled={i === exercises.length - 1}
                    className="size-5 border border-white/20 flex items-center justify-center hover:border-[#ff6600] transition-colors disabled:opacity-20 disabled:hover:border-white/20"
                  >
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 flex-1">
                {!editing && (
                  isExerciseDone ? (
                    <svg className="size-3 shrink-0" fill="none" viewBox="0 0 18 18">
                      <path d="M5 9L8 12L13 6" stroke="#ff6600" strokeWidth="2" strokeLinecap="square" fill="none" />
                    </svg>
                  ) : isCurrentExercise ? (
                    <div className="size-2 bg-[#ff6600] animate-pulse" />
                  ) : isNext ? (
                    <div className="size-2 bg-[#ff6600] animate-pulse" />
                  ) : null
                )}
                {editing && (
                  <svg className="size-4 shrink-0 text-white/30 cursor-grab active:cursor-grabbing" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M4 8h16M4 16h16" />
                  </svg>
                )}
                <div className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wide ${
                  isExerciseDone ? 'text-white/40' : 'text-white'
                }`}>
                  [{(i + 1).toString().padStart(2, '0')}] {ex.name}
                </div>
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40">
                {ex.sets}x{ex.reps}
              </div>
            </div>
          );
        })}
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

function CoreCircuit({ activeProgram, currentWeek, todayWorkout, isRestDay, onQuickWorkout }: {
  activeProgram: (Program & { id?: string; createdAt?: string }) | null;
  currentWeek: number;
  todayWorkout: WorkoutDay | null;
  isRestDay: boolean;
  onQuickWorkout: (day: WorkoutDay) => void;
}) {
  const { user } = useAuth();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // Only render when an active program exists
  if (!activeProgram) return null;

  const handleAddToProtocol = async (template: typeof coreCircuitTemplates[0]) => {
    if (!user || !activeProgram?.id || !todayWorkout || isRestDay) return;
    setAdding(template.id);
    try {
      const targetDayNum = todayWorkout.dayNumber;
      const updatedWeeks = activeProgram.weeks.map((w, wi) => {
        if (wi !== currentWeek - 1) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.dayNumber !== targetDayNum) return d;
            return { ...d, exercises: [...d.exercises, ...template.exercises] };
          }),
        };
      });

      await updateDocument(`users/${user.uid}/programs/${activeProgram.id}`, {
        weeks: updatedWeeks,
      });

      setAddedId(template.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch (err) {
      console.warn("[CoreCircuit] Failed to add to protocol:", err);
    } finally {
      setAdding(null);
    }
  };

  const handleCoreOnly = (template: typeof coreCircuitTemplates[0]) => {
    onQuickWorkout({
      dayNumber: 0,
      name: `${template.label} Circuit`,
      exercises: template.exercises,
    });
  };

  return (
    <div className="w-full border border-white/20 p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
          Core Circuit
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase">
          Add-on Module
        </div>
      </div>
      <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/30 uppercase tracking-wider mb-4">
        Append core work to today's protocol or run standalone
      </div>

      <div className="space-y-3">
        {coreCircuitTemplates.map((tpl) => {
          const isAdded = addedId === tpl.id;
          const isAdding = adding === tpl.id;

          return (
            <div key={tpl.id} className="border border-white/15 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white font-bold uppercase tracking-wide">
                  {tpl.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">
                    {tpl.tag}
                  </span>
                  <span className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600]/70 uppercase">
                    {tpl.duration}
                  </span>
                </div>
              </div>

              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 mb-3 leading-relaxed">
                {tpl.exercises.map((ex) => ex.name).join(" · ")}
              </div>

              <div className="flex gap-2">
                {/* Add to Protocol — only when today has a scheduled workout */}
                {todayWorkout && !isRestDay && (
                  <button
                    onClick={() => handleAddToProtocol(tpl)}
                    disabled={isAdding || isAdded}
                    className={`flex-1 font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2 transition-colors ${
                      isAdded
                        ? "border border-[#ff6600] bg-[#ff6600]/20 text-[#ff6600]"
                        : isAdding
                          ? "border border-white/20 text-white/40"
                          : "border border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/10"
                    }`}
                  >
                    {isAdded ? "Added!" : isAdding ? "Adding..." : "Add to Protocol"}
                  </button>
                )}
                <button
                  onClick={() => handleCoreOnly(tpl)}
                  className="flex-1 border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors"
                >
                  Core Only
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState(true);
  const [callsign, setCallsign] = useState("Operator");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [activeProgram, setActiveProgram] = useState<(Program & { id?: string; createdAt?: string }) | null>(null);
  const [weekLogs, setWeekLogs] = useState<Map<string, DashboardWorkoutLog>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [programLoaded, setProgramLoaded] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickWorkoutDay, setQuickWorkoutDay] = useState<WorkoutDay | null>(null);

  // Check for bonus workout from AI agent (stored in localStorage by AIAgent)
  // Shows it on the dashboard (protocol queue + active operation) so the user can review before starting
  // Kept in localStorage until the workout is started — survives app restart
  useEffect(() => {
    const stored = localStorage.getItem("stride_bonus_workout");
    if (stored) {
      try {
        setQuickWorkoutDay(JSON.parse(stored) as WorkoutDay);
      } catch { /* ignore */ }
      // Don't remove — kept until workout modal opens (see openModal)
    }
  }, []);

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

  // Live-subscribe to unread notification count
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<{ id: string }>(
      `users/${user.uid}/notifications`,
      [where("read", "==", false), limit(100)],
      (docs) => setUnreadCount(docs.length)
    );
    return unsub;
  }, [user]);

  // Live-subscribe to this week's workout logs for week overview
  useEffect(() => {
    if (!user) return;
    const monday = getMondayOf(new Date());
    const mondayStr = toLocalDateStr(monday);

    const unsub = subscribeToCollection<DashboardWorkoutLog>(
      `users/${user.uid}/workoutLogs`,
      [where("completedAt", ">=", mondayStr), orderBy("completedAt", "asc")],
      (logs) => {
        const map = new Map<string, DashboardWorkoutLog>();
        for (const log of logs) {
          const dateKey = toLocalDateStr(new Date(log.completedAt));
          const existing = map.get(dateKey);
          const isActivity = log.isActivity === true;
          const existingIsWorkout = existing && !existing.isActivity;
          // Don't let an activity replace an actual workout log
          if (existingIsWorkout && isActivity) continue;
          // Keep the best log: prefer full > partial > activity
          if (!existing || (existing.completionType !== "full" && log.completionType === "full")) {
            map.set(dateKey, log);
          }
        }
        setWeekLogs(map);
      }
    );
    return unsub;
  }, [user]);

  // Live-subscribe to active program
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<Program & { id: string }>(
      `users/${user.uid}/programs`,
      [where("active", "==", true), limit(1)],
      (programs) => {
        if (programs.length > 0) {
          setActiveProgram(programs[0]);
        } else {
          setActiveProgram(null);
        }
        setProgramLoaded(true);
      }
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    // Record login and show login trigger message
    const state = recordLogin();

    // Show weekly insight instead of generic login message if user trained 3+ times this week
    if (state.workoutsCompletedThisWeek >= 3) {
      setLoginMessage(getRandomMessage("weeklyInsight"));
    } else {
      setLoginMessage(getRandomMessage("login"));
    }

    // Check for streak milestone
    const milestone = getStreakMilestoneMessage(state.streakDays);
    if (milestone) {
      setStreakMessage(milestone);
    }
  }, []);

  // Check for missed workouts (auto-detect if yesterday was skipped)
  useEffect(() => {
    if (activeProgram) {
      // Use current week's day count (not always week 1)
      const weekNum = getCurrentProgramWeek(activeProgram.createdAt, activeProgram.weeks.length);
      const wk = activeProgram.weeks?.[weekNum - 1] ?? activeProgram.weeks?.[0];
      if (wk?.days.length) {
        const prevStreak = getBehaviorState().streakDays;
        const prevMissed = getBehaviorState().consecutiveMissedSessions;
        checkMissedWorkout(wk.days.length);
        // Show streak-broken message if streak was just reset by the miss check
        const afterState = getBehaviorState();
        if (prevStreak > 0 && afterState.streakDays === 0) {
          setStreakMessage(getRandomMessage("streakBroken"));
        } else if (afterState.consecutiveMissedSessions > prevMissed) {
          // Missed training day(s) detected — show missed workout micro-language
          setLoginMessage(getRandomMessage("missed"));
        }
        // Force SystemStatus to re-read behaviorState (streak may have broken)
        setRefreshKey(k => k + 1);
      }
    }
  }, [activeProgram]);

  // Re-check date when tab becomes visible (handles midnight crossover)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const newDate = toLocalDateStr(new Date());
        if (newDate !== todayDateStrRef.current) {
          setRefreshKey(k => k + 1);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Derive today's date values — recompute on refreshKey so they update after midnight/workout
  const todayDayIndex = useMemo(() => getTodayDayIndex(), [refreshKey]);
  const todayDateStr = useMemo(() => toLocalDateStr(new Date()), [refreshKey]);
  const todayDateStrRef = useRef(todayDateStr);
  todayDateStrRef.current = todayDateStr;

  const { todayLog, todayCompleted, completedExerciseNames, currentWeek, todayWorkout, isRestDay, isSkippedDay, workoutName } = useMemo(() => {
    const log = weekLogs.get(todayDateStr) ?? null;
    const completed = !!log;
    const exNames = new Set(log?.exercises?.map((e) => e.name) ?? []);
    const week = activeProgram ? getCurrentProgramWeek(activeProgram.createdAt, activeProgram.weeks.length) : 1;
    const wData = activeProgram?.weeks?.[week - 1];
    const totalDays = wData?.days.length ?? 0;
    const rest = totalDays > 0 && todayDayIndex >= totalDays;
    const raw = rest ? null : (wData?.days?.[todayDayIndex] ?? null);
    const skipped = !!(raw && raw.exercises.length === 0);
    const workout = skipped ? null : raw;
    return {
      todayLog: log, todayCompleted: completed, completedExerciseNames: exNames,
      currentWeek: week, todayWorkout: workout, isRestDay: rest || skipped,
      isSkippedDay: skipped, workoutName: workout?.name ?? "Workout",
    };
  }, [weekLogs, todayDateStr, todayDayIndex, activeProgram]);

  // Detect if the program's cycle has fully elapsed
  const programExpired = activeProgram
    ? isProgramExpired(activeProgram.createdAt, activeProgram.weeks.length)
    : false;

  // Derive expiry dismissal directly from localStorage — no timing issues on re-mount.
  // refreshKey forces re-read after workout completion or explicit dismissal.
  const dismissedExpiry = useMemo(() => {
    if (!activeProgram?.id) return false;
    try {
      return localStorage.getItem("stride_dismissed_expiry") === activeProgram.id;
    } catch { return false; }
  }, [activeProgram?.id, refreshKey]);

  // Check for in-progress workout (WIP saved when modal was closed mid-workout)
  const [wip, setWip] = useState<WorkoutWIP | null>(null);
  const [bonusWip, setBonusWip] = useState<WorkoutWIP | null>(null);
  useEffect(() => {
    // Single localStorage read — check if WIP matches today's workout or is a bonus
    const anyWip = loadAnyWIP();
    if (anyWip?.workoutName === workoutName) {
      setWip(anyWip);
      setBonusWip(null);
    } else {
      setWip(null);
      setBonusWip(anyWip); // null if no WIP, or bonus WIP with different name
    }
  }, [workoutName, isModalOpen]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    window.dispatchEvent(new CustomEvent("stride:workoutModalClose"));
    setShowQuickMenu(false);
    // Keep quickWorkoutDay if WIP was saved (user can resume), clear otherwise
    const anyWip = loadAnyWIP();
    if (!anyWip || anyWip.workoutName !== quickWorkoutDay?.name) {
      setQuickWorkoutDay(null);
    }
    // Force re-read of behavior state after workout completion
    setRefreshKey(k => k + 1);
  };

  // Open modal and notify floating timer
  const openModal = () => {
    setIsModalOpen(true);
    // Workout is now starting — clear the durable bonus workout from localStorage
    try { localStorage.removeItem("stride_bonus_workout"); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("stride:workoutModalOpen"));
  };

  // Listen for resume events from the floating mini-timer (same page)
  useEffect(() => {
    const handleResumeEvent = () => {
      const anyWip = loadAnyWIP();
      if (!anyWip) return;
      // Set up the workout day from WIP snapshot so the modal can restore
      if (anyWip.snapshotExercises && anyWip.snapshotExercises.length > 0) {
        setQuickWorkoutDay({ dayNumber: 0, name: anyWip.workoutName, exercises: anyWip.snapshotExercises });
      }
      openModal();
    };
    window.addEventListener("stride:resumeWorkout", handleResumeEvent);
    return () => window.removeEventListener("stride:resumeWorkout", handleResumeEvent);
  }, []);

  // Handle navigation from floating timer on other pages (location.state.resumeWorkout)
  useEffect(() => {
    if (location.state?.resumeWorkout) {
      // Clear React Router's in-memory state to prevent re-triggering on re-render
      navigate("/app", { replace: true, state: {} });
      const anyWip = loadAnyWIP();
      if (anyWip) {
        if (anyWip.snapshotExercises && anyWip.snapshotExercises.length > 0) {
          setQuickWorkoutDay({ dayNumber: 0, name: anyWip.workoutName, exercises: anyWip.snapshotExercises });
        }
        openModal();
      }
    }
  }, [location.state, navigate]);

  /** Resume a partial workout — open modal with only the remaining exercises */
  const handleResume = () => {
    if (!todayWorkout || !todayLog?.exercises) return;
    const doneNames = new Set(todayLog.exercises.map((e) => e.name.toLowerCase()));
    const doneCount = todayLog.exercises.length;

    // Try name-based matching first; if program was modified (names changed),
    // fall back to index-based: skip the first N exercises (already completed)
    let remaining = todayWorkout.exercises.filter((ex) => !doneNames.has(ex.name.toLowerCase()));

    if (remaining.length === 0 && doneCount < todayWorkout.exercises.length) {
      // Names don't match (program was modified) — use position-based fallback
      remaining = todayWorkout.exercises.slice(doneCount);
    }

    if (remaining.length === 0) return;
    setQuickWorkoutDay({
      ...todayWorkout,
      name: `${todayWorkout.name} (Resumed)`,
      exercises: remaining,
    });
    openModal();
  };

  /** Resume a bonus workout WIP (rest day or orphaned session) */
  const handleResumeBonusWip = () => {
    if (!bonusWip) return;
    // Use the full snapshot if available (includes remaining exercises), else fall back to logs
    const wipExercises = bonusWip.snapshotExercises && bonusWip.snapshotExercises.length > 0
      ? bonusWip.snapshotExercises
      : bonusWip.exerciseLogs.map((log) => ({
          name: log.name,
          sets: log.plannedSets,
          reps: log.plannedReps,
          rest: log.rest,
        }));
    setQuickWorkoutDay({
      dayNumber: 0,
      name: bonusWip.workoutName,
      exercises: wipExercises.length > 0 ? wipExercises : [],
    });
    openModal();
  };

  const [generatingQuick, setGeneratingQuick] = useState(false);
  const handleQuickWorkout = async (day: WorkoutDay) => {
    setShowQuickMenu(false);
    // Try to generate a personalized workout via LLM
    if (user) {
      setGeneratingQuick(true);
      try {
        const { getDocument: getDoc } = await import("../../services/firestore");
        const { generateDay } = await import("../../services/programGenerator");
        const personalization = await getDoc(`users/${user.uid}/personalization/data`);
        const focus = day.name.replace(/Quick\s+/i, "").replace(/\s+Calibration/i, "").toLowerCase();
        const exercises = await generateDay(focus, day.exercises.length, personalization ?? undefined);
        if (exercises.length > 0) {
          setQuickWorkoutDay({ ...day, exercises });
          openModal();
          setGeneratingQuick(false);
          return;
        }
      } catch {
        // Fall through to hardcoded fallback
      }
      setGeneratingQuick(false);
    }
    // Fallback: use the hardcoded template
    setQuickWorkoutDay(day);
    openModal();
  };

  // Reorder exercises in a bonus/quick workout (local state only, no Firestore)
  const handleReorderBonusExercises = (reordered: Exercise[]) => {
    if (!quickWorkoutDay) return;
    const updated = { ...quickWorkoutDay, exercises: reordered };
    setQuickWorkoutDay(updated);
    // Update localStorage so it persists across navigations
    try { localStorage.setItem("stride_bonus_workout", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  // Reorder exercises in today's workout and persist to Firestore
  const handleReorderExercises = (reordered: Exercise[]) => {
    if (!user || !activeProgram?.id || !todayWorkout) return;
    const targetDayNum = todayWorkout.dayNumber;

    // Update local state immediately
    const updatedWeeks = activeProgram.weeks.map((w, wi) => {
      if (wi !== currentWeek - 1) return w;
      return {
        ...w,
        days: w.days.map((d) => {
          if (d.dayNumber !== targetDayNum) return d;
          return { ...d, exercises: reordered };
        }),
      };
    });
    setActiveProgram({ ...activeProgram, weeks: updatedWeeks });

    // Persist to Firestore
    updateDocument(`users/${user.uid}/programs/${activeProgram.id}`, {
      weeks: updatedWeeks,
    }).catch(console.warn);
  };

  if (!programLoaded) {
    return (
      <div className="w-full p-6 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-10 w-10" />
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-5 w-5" />
        </div>
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-24 w-full" />
        <div className="space-y-3">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 pb-24 space-y-6">
      <TopBar callsign={callsign} avatarUrl={avatarUrl} unreadCount={unreadCount} />

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

      <SystemStatus refreshKey={refreshKey} />
      <WeekOverview
        programName={activeProgram?.name ?? ""}
        currentWeek={currentWeek}
        todayDayIndex={todayDayIndex}
        weekLogs={weekLogs}
        wip={wip}
        bonusWip={bonusWip}
      />

      {/* Program Expiry Banner */}
      {programExpired && !dismissedExpiry && activeProgram && (
        <div className="w-full border-2 border-[#ff6600] bg-black p-5 relative">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 102, 0, 0.03) 2px, rgba(255, 102, 0, 0.03) 2px)`
          }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2 bg-[#ff6600] animate-pulse" />
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-[2px]">
                Protocol Cycle Complete
              </div>
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/70 leading-relaxed mb-4">
              Your <span className="text-white font-bold">{activeProgram.name}</span> protocol has completed its{" "}
              <span className="text-[#ff6600] font-bold">{activeProgram.weeks.length}-week</span> cycle.
              Generate a new protocol to continue progression.
            </div>
            <div className="flex gap-2">
              <Link
                to="/app/ai-agent"
                onClick={() => localStorage.setItem("stride_agent_prompt", "My current program has expired. Generate me a new program based on my profile and goals.")}
                className="flex-1 bg-[#ff6600] text-center text-black font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors"
              >
                Generate New Protocol →
              </Link>
              <button
                onClick={() => { try { localStorage.setItem("stride_dismissed_expiry", activeProgram?.id ?? ""); } catch {} setRefreshKey(k => k + 1); }}
                className="flex-1 border border-white/30 text-white/60 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-3 hover:border-white/50 hover:text-white/80 transition-colors"
              >
                Continue Current →
              </button>
            </div>
          </div>
        </div>
      )}

      <ActiveOperation onOpenModal={() => openModal()} onResume={handleResume} onResumeBonusWip={handleResumeBonusWip} onQuickWorkout={handleQuickWorkout} todayWorkout={quickWorkoutDay || todayWorkout} todayCompleted={todayCompleted && !quickWorkoutDay} todayLog={todayLog} isRestDay={(isRestDay || isSkippedDay) && !quickWorkoutDay} wip={quickWorkoutDay ? bonusWip : wip} bonusWip={bonusWip} generatingQuick={generatingQuick} showQuickMenu={showQuickMenu} setShowQuickMenu={setShowQuickMenu} />
      <OperationsList todayWorkout={quickWorkoutDay || todayWorkout} todayCompleted={todayCompleted && !quickWorkoutDay} completedExerciseNames={completedExerciseNames} wip={quickWorkoutDay ? bonusWip : wip} onReorder={quickWorkoutDay ? handleReorderBonusExercises : handleReorderExercises} />

      {/* Core Circuit Add-on */}
      <CoreCircuit activeProgram={activeProgram} currentWeek={currentWeek} todayWorkout={todayWorkout} isRestDay={isRestDay || isSkippedDay} onQuickWorkout={handleQuickWorkout} />

      {/* Bonus Workout Section */}
      {activeProgram && (
        <div className="w-full border border-white/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
              Bonus Calibration
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase">
              Extra Sessions
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {quickWorkoutOptions.slice(0, 3).map((opt) => (
              <button
                key={opt.category}
                onClick={() => handleQuickWorkout(opt.workout)}
                className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2.5 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors"
              >
                {opt.category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {quickWorkoutOptions.slice(3).map((opt) => (
              <button
                key={opt.category}
                onClick={() => handleQuickWorkout(opt.workout)}
                className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider py-2.5 hover:border-[#ff6600] hover:text-[#ff6600] transition-colors"
              >
                {opt.category}
              </button>
            ))}
          </div>

          <Link
            to="/app/ai-agent"
            className="block w-full border border-[#ff6600] text-center text-[#ff6600] font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider py-2.5 hover:bg-[#ff6600]/10 transition-colors"
          >
            Ask Agent for Custom Workout →
          </Link>
        </div>
      )}

      <WorkoutSequenceModal isOpen={isModalOpen} onClose={handleModalClose} workoutDay={quickWorkoutDay || todayWorkout} />
    </div>
  );
}