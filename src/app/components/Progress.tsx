import { Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import { CircularProgress } from "./CircularProgress";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToCollection, updateDocument, orderBy, limit } from "../../services/firestore";
import { getBehaviorState } from "../utils/behaviorStore";

interface WorkoutLog {
  id: string;
  workoutName: string;
  duration: number;
  completedAt: string;
  completionType: string;
  exercises: Array<{ name: string; sets: number; reps: string; rest: string }>;
}

function Header() {
  return (
    <div className="mb-6">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-2">
        Training Module
      </div>
      <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold uppercase tracking-wider">
        Progress Overview
      </div>
    </div>
  );
}

function WeeklyGrid({ logs }: { logs: WorkoutLog[] }) {
  const [selectedDay, setSelectedDay] = useState<{week: number; day: number} | null>(null);

  // Build a lookup: "YYYY-MM-DD" → WorkoutLog
  const logsByDate = new Map<string, WorkoutLog>();
  for (const log of logs) {
    const dateKey = new Date(log.completedAt).toISOString().split("T")[0];
    if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, log);
  }

  // Build 4-week grid ending at this week (Mon-Sun)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Find Monday of the current week
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - mondayOffset);
  currentMonday.setHours(0, 0, 0, 0);

  // Start 3 weeks before current Monday
  const gridStart = new Date(currentMonday);
  gridStart.setDate(gridStart.getDate() - 21);

  const weeks = Array.from({ length: 4 }, (_, weekIdx) => {
    const days = Array.from({ length: 7 }, (_, dayIdx) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIdx * 7 + dayIdx);
      const dateStr = date.toISOString().split("T")[0];
      const log = logsByDate.get(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      let status = 0;
      let progress = 0;
      if (log) {
        status = log.completionType === "full" ? 1 : 0.5;
        progress = log.completionType === "full" ? 100 : 50;
      } else if (isToday) {
        status = 0;
        progress = 0;
      } else if (isFuture) {
        status = 0;
        progress = 0;
      }

      return { status, progress, dateStr, log };
    });
    return { week: weekIdx + 1, days };
  });

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const getDayData = (weekIdx: number, dayIdx: number) => {
    const day = weeks[weekIdx]?.days[dayIdx];
    const log = day?.log;
    if (log) {
      return {
        exercises: log.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.rest || "--",
        })),
        duration: log.duration > 0 ? `${Math.round(log.duration / 60)} min` : "--",
        volume: `${log.exercises.reduce((sum, ex) => sum + ex.sets, 0)} sets`,
      };
    }
    return { exercises: [], duration: "--", volume: "--" };
  };

  return (
    <div className="w-full border border-white/20 p-5 mb-6">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-4">
        4-Week Cycle
      </div>
      
      <div className="space-y-3">
        {weeks.map((week, weekIdx) => (
          <div key={week.week} className="flex items-center gap-3">
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 w-8">
              W{week.week}
            </div>
            <div className="flex gap-2 flex-1">
              {week.days.map((day, dayIdx) => (
                <button
                  key={dayIdx}
                  onClick={() => day.status > 0 ? setSelectedDay({week: weekIdx, day: dayIdx}) : null}
                  className={`flex-1 h-10 border bg-black flex items-center justify-center transition-all ${
                    day.status === 1 
                      ? 'border-white/30 hover:border-white cursor-pointer' 
                      : day.status === 0.5 
                        ? 'border-[#ff6600] hover:border-[#ff8833] cursor-pointer' 
                        : 'border-white/10 cursor-not-allowed'
                  } ${selectedDay?.week === weekIdx && selectedDay?.day === dayIdx ? 'ring-2 ring-[#ff6600]' : ''}`}
                >
                  <CircularProgress 
                    progress={day.progress}
                    isComplete={day.status === 1}
                    isActive={day.status === 0.5}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <CircularProgress progress={100} isComplete={true} />
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">Complete</div>
        </div>
        <div className="flex items-center gap-2">
          <CircularProgress progress={50} isActive={true} />
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">Active</div>
        </div>
        <div className="flex items-center gap-2">
          <CircularProgress progress={0} />
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">Pending</div>
        </div>
      </div>

      {/* Day Detail View */}
      {selectedDay !== null && (
        <div className="mt-4 pt-4 border-t-2 border-[#ff6600]">
          <div className="flex items-center justify-between mb-3">
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider">
              Week {selectedDay.week + 1} • {dayNames[selectedDay.day]}
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="size-6 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {(() => {
            const dayData = getDayData(selectedDay.week, selectedDay.day);
            return (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-white/20 p-2">
                    <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">
                      Duration
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-bold">
                      {dayData.duration}
                    </div>
                  </div>
                  <div className="border border-white/20 p-2">
                    <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase">
                      Total Volume
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-bold">
                      {dayData.volume}
                    </div>
                  </div>
                </div>

                {/* Exercises */}
                <div className="border border-white/20 p-3">
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider mb-2">
                    Exercises
                  </div>
                  <div className="space-y-2">
                    {dayData.exercises.map((ex, idx) => (
                      <div key={idx} className="border-l-2 border-white/20 pl-2 py-1">
                        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white">
                          {ex.name}
                        </div>
                        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                          {ex.sets} × {ex.reps} @ {ex.weight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function Stats({ avgDuration }: { avgDuration: number }) {
  const state = getBehaviorState();
  const completionRate = Math.round(
    (state.workoutsCompletedThisWeek / Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1)) * 100
  );

  const stats = [
    { label: "Total Operations", value: String(state.totalWorkoutsCompleted), change: `This week: ${state.workoutsCompletedThisWeek}` },
    { label: "Active Streak", value: `${state.streakDays} Days`, change: "Current" },
    { label: "Completion Rate", value: `${completionRate}%`, change: `Alignment: ${state.alignmentScore}` },
    { label: "Avg Duration", value: avgDuration > 0 ? `${Math.round(avgDuration / 60)} min` : "--", change: "Per session" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="border border-white/20 p-4">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
            {stat.label}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold mb-1">
            {stat.value}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wide text-[#ff6600]">
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceChart({ logs }: { logs: WorkoutLog[] }) {
  // Derive weekly completion counts from logs (last 4 weeks)
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const data = [1, 2, 3, 4].map((weeksAgo) => {
    const start = now - weeksAgo * weekMs;
    const end = now - (weeksAgo - 1) * weekMs;
    const count = logs.filter((l) => {
      const t = new Date(l.completedAt).getTime();
      return t >= start && t < end;
    }).length;
    // Normalize: assume 5 sessions/week = 100%
    const value = Math.min(Math.round((count / 5) * 100), 100);
    return { week: `W${5 - weeksAgo}`, value: value || (logs.length === 0 ? 0 : 5) };
  }).reverse();

  return (
    <div className="border border-white/20 p-5 mb-6">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-4">
        Performance Trend
      </div>
      
      <div className="h-32 flex items-end gap-6 justify-between">
        {data.map((item) => (
          <div key={item.week} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col justify-end h-full">
              <div 
                className="w-full bg-white relative"
                style={{ height: `${item.value}%` }}
              >
                {item.week === "W4" && (
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-[#ff6600]" />
                )}
              </div>
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40">
              {item.week}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
          Completion rate by week (%)
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ logs }: { logs: WorkoutLog[] }) {
  return (
    <div className="border border-white/20 p-5">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-4">
        Recent Activity Log
      </div>

      {logs.length === 0 ? (
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/30">
          No activity recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const d = new Date(log.completedAt);
            const date = d.toISOString().split("T")[0].replace(/-/g, ".");
            const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            return (
              <div key={log.id} className="flex items-center justify-between border-l-2 border-white/20 pl-3 py-2">
                <div>
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
                    {log.workoutName}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                    {date} · {time} · {log.duration > 0 ? `${Math.round(log.duration / 60)}m` : "--"}
                  </div>
                </div>
                <div className={`size-2 ${log.completionType === "full" ? "bg-[#ff6600]" : "bg-white"}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<WorkoutLog>(
      `users/${user.uid}/workoutLogs`,
      [orderBy("completedAt", "desc"), limit(50)],
      (incoming) => {
        // Migrate stale "partial" logs from pre-fix bug (one-time patch per log)
        for (const log of incoming) {
          if (log.completionType === "partial") {
            updateDocument(`users/${user.uid}/workoutLogs/${log.id}`, { completionType: "full" }).catch(() => {});
          }
        }
        // Treat all logs as full (modal only saves on completion screen)
        setLogs(incoming.map(l => l.completionType === "partial" ? { ...l, completionType: "full" } : l));
      }
    );
    return unsub;
  }, [user]);

  const recentLogs = logs.slice(0, 5);
  const avgDuration = logs.length > 0
    ? logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.length
    : 0;

  return (
    <div className="w-full p-6 pb-24">
      <Header />
      <WeeklyGrid logs={logs} />
      <Stats avgDuration={avgDuration} />
      <PerformanceChart logs={logs} />
      <RecentActivity logs={recentLogs} />
    </div>
  );
}