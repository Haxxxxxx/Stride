import { CircularProgress } from "./CircularProgress";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToCollection, orderBy, limit } from "../../services/firestore";
import { getBehaviorState } from "../utils/behaviorStore";
import { toLocalDateStr, getMondayOf } from "../utils/dateUtils";
import { SkeletonBlock } from "./LoadingSkeleton";
import { WIP_KEY, WIP_EXPIRY_MS } from "./WorkoutSequenceModal";
import type { ExerciseLog, ReadinessData } from "../../services/programGenerator";

const MONO = "font-['JetBrains_Mono',monospace]";

interface WorkoutLog {
  id: string;
  workoutName: string;
  duration: number;
  completedAt: string;
  completionType: string;
  totalVolume?: number;
  exercises: ExerciseLog[];
  isActivity?: boolean;
  durationMinutes?: number;
  distance?: string;
  readiness?: ReadinessData;
  avgRPE?: number;
}

/** Compute total volume for a workout log */
function computeVolume(log: WorkoutLog): number {
  return log.totalVolume ?? log.exercises.reduce((sum, ex) =>
    sum + (ex.actualSets || []).reduce((s, set) => s + (set.weight || 0) * (set.repsCompleted || 0), 0), 0
  );
}

/** Compute average RPE across all sets in a workout */
function computeAvgRPE(log: WorkoutLog): number {
  if (log.avgRPE) return log.avgRPE;
  const allSets = log.exercises.flatMap(ex => ex.actualSets || []);
  const rpeValues = allSets.filter(s => s.rpe > 0);
  if (rpeValues.length === 0) return 0;
  return Math.round(rpeValues.reduce((sum, s) => sum + s.rpe, 0) / rpeValues.length * 10) / 10;
}

/** Shared detail view for a single workout log -- collapsible exercises with set-by-set data */
function WorkoutDetailView({ log }: { log: WorkoutLog }) {
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());

  const toggleExercise = (idx: number) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalVol = computeVolume(log);
  const avgRPE = computeAvgRPE(log);

  return (
    <div className="space-y-3">
      {/* Workout-level summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-white/20 p-2">
          <div className={`${MONO} text-[8px] text-white/40 uppercase`}>Duration</div>
          <div className={`${MONO} text-[14px] text-white font-bold`}>
            {log.duration > 0 ? `${Math.round(log.duration / 60)} min` : "--"}
          </div>
        </div>
        <div className="border border-white/20 p-2">
          <div className={`${MONO} text-[8px] text-white/40 uppercase`}>Total Volume</div>
          <div className={`${MONO} text-[14px] text-white font-bold`}>
            {totalVol > 0 ? `${totalVol.toLocaleString()} lbs` : "--"}
          </div>
        </div>
        <div className="border border-white/20 p-2">
          <div className={`${MONO} text-[8px] text-white/40 uppercase`}>Avg RPE</div>
          <div className={`${MONO} text-[14px] text-white font-bold`}>
            {avgRPE > 0 ? `${avgRPE}/10` : "--"}
          </div>
        </div>
        <div className="border border-white/20 p-2">
          <div className={`${MONO} text-[8px] text-white/40 uppercase`}>Status</div>
          <div className={`${MONO} text-[14px] font-bold ${log.completionType === "full" ? "text-[#ff6600]" : "text-white/60"}`}>
            {log.completionType === "full" ? "COMPLETE" : "PARTIAL"}
          </div>
        </div>
      </div>

      {/* Readiness data if available */}
      {log.readiness && (log.readiness.sleepQuality > 0 || log.readiness.energyLevel > 0) && (
        <div className="border border-white/10 p-3">
          <div className={`${MONO} text-[8px] text-white/40 uppercase tracking-wider mb-2`}>
            Pre-Session Readiness
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className={`${MONO} text-[8px] text-white/50`}>SLEEP</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`w-3 h-2 ${n <= log.readiness!.sleepQuality ? "bg-[#ff6600]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <div className={`${MONO} text-[9px] text-white/60`}>{log.readiness.sleepQuality}/5</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${MONO} text-[8px] text-white/50`}>ENERGY</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`w-3 h-2 ${n <= log.readiness!.energyLevel ? "bg-[#ff6600]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <div className={`${MONO} text-[9px] text-white/60`}>{log.readiness.energyLevel}/5</div>
            </div>
            {log.readiness.painReported && (
              <div className="flex items-center gap-1">
                <div className={`${MONO} text-[8px] text-red-400`}>PAIN</div>
                {log.readiness.painLocation && (
                  <div className={`${MONO} text-[8px] text-red-400/70`}>{log.readiness.painLocation}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible exercises */}
      <div className="border border-white/20 p-3">
        <div className={`${MONO} text-[8px] text-white/60 uppercase tracking-wider mb-2`}>
          Exercises ({log.exercises.length})
        </div>
        <div className="space-y-1">
          {log.exercises.map((ex, idx) => {
            const isExpanded = expandedExercises.has(idx);
            const sets = ex.actualSets || [];
            const exVolume = sets.reduce((s, set) => s + (set.weight || 0) * (set.repsCompleted || 0), 0);
            const exRpeValues = sets.filter(s => s.rpe > 0);
            const exAvgRpe = exRpeValues.length > 0
              ? Math.round(exRpeValues.reduce((s, set) => s + set.rpe, 0) / exRpeValues.length * 10) / 10
              : 0;

            return (
              <div key={idx}>
                <button
                  onClick={() => toggleExercise(idx)}
                  className={`w-full text-left border-l-2 pl-2 py-1.5 transition-colors ${
                    isExpanded ? "border-[#ff6600] bg-white/[0.02]" : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`${MONO} text-[9px] text-white`}>{ex.name}</div>
                    <div className="flex items-center gap-2">
                      <div className={`${MONO} text-[8px] text-white/40`}>
                        {sets.length || ex.plannedSets}s / {ex.plannedReps}r
                      </div>
                      <svg
                        className={`size-3 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-4 border-l border-white/10 pl-3 py-2 space-y-2">
                    {/* Exercise summary */}
                    <div className="flex gap-4">
                      {exVolume > 0 && (
                        <div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Volume</div>
                          <div className={`${MONO} text-[10px] text-white`}>{exVolume.toLocaleString()} lbs</div>
                        </div>
                      )}
                      {exAvgRpe > 0 && (
                        <div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Avg RPE</div>
                          <div className={`${MONO} text-[10px] text-white`}>{exAvgRpe}/10</div>
                        </div>
                      )}
                      <div>
                        <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Planned</div>
                        <div className={`${MONO} text-[10px] text-white/60`}>{ex.plannedSets} x {ex.plannedReps} / {ex.rest}</div>
                      </div>
                    </div>

                    {/* Set-by-set data */}
                    {sets.length > 0 && (
                      <div>
                        {/* Header row */}
                        <div className="grid grid-cols-5 gap-1 mb-1">
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Set</div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Weight</div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Reps</div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>RPE</div>
                          <div className={`${MONO} text-[7px] text-white/30 uppercase`}>Form</div>
                        </div>
                        {sets.map((set, si) => (
                          <div key={si} className="grid grid-cols-5 gap-1 py-0.5 border-t border-white/5">
                            <div className={`${MONO} text-[9px] text-white/50`}>#{set.setNumber}</div>
                            <div className={`${MONO} text-[9px] text-white`}>
                              {set.weight > 0 ? `${set.weight}lbs` : "--"}
                            </div>
                            <div className={`${MONO} text-[9px] text-white`}>{set.repsCompleted}</div>
                            <div className={`${MONO} text-[9px] ${
                              set.rpe >= 9 ? "text-red-400" : set.rpe >= 7 ? "text-[#ff6600]" : "text-white/60"
                            }`}>
                              {set.rpe > 0 ? set.rpe : "--"}
                            </div>
                            <div className={`${MONO} text-[9px] text-white/60`}>
                              {set.formQuality > 0 ? `${set.formQuality}/5` : "--"}
                              {set.pain && set.pain !== "none" && (
                                <span className="text-red-400 ml-1">{set.pain === "severe" ? "!!" : "!"}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sets.length === 0 && (
                      <div className={`${MONO} text-[8px] text-white/30 italic`}>
                        No set data recorded
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <div className={`${MONO} text-[10px] text-white/40 uppercase tracking-[2px] mb-2`}>
        Training Module
      </div>
      <div className={`${MONO} text-[24px] text-white font-bold uppercase tracking-wider`}>
        Progress Overview
      </div>
    </div>
  );
}

function WeeklyGrid({ logs }: { logs: WorkoutLog[] }) {
  const [selectedDay, setSelectedDay] = useState<{week: number; day: number} | null>(null);

  // Build a lookup: "YYYY-MM-DD" → WorkoutLog
  const logsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog>();
    for (const log of logs) {
      const d = new Date(log.completedAt);
      if (isNaN(d.getTime())) continue;
      const dateKey = toLocalDateStr(d);
      if (!map.has(dateKey)) map.set(dateKey, log);
    }
    return map;
  }, [logs]);

  // Build 4-week grid ending at this week (Mon-Sun)
  const today = new Date();
  const todayStr = toLocalDateStr(today);

  // Find Monday of the current week
  const currentMonday = getMondayOf(today);

  // Start 3 weeks before current Monday
  const gridStart = new Date(currentMonday);
  gridStart.setDate(gridStart.getDate() - 21);

  const weeks = Array.from({ length: 4 }, (_, weekIdx) => {
    const days = Array.from({ length: 7 }, (_, dayIdx) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIdx * 7 + dayIdx);
      const dateStr = toLocalDateStr(date);
      const log = logsByDate.get(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      let status = 0;
      let progress = 0;
      if (log) {
        status = log.completionType === "full" ? 1 : 0.5;
        progress = log.completionType === "full" ? 100 : 50;
      } else if (isToday) {
        // Check for in-progress workout
        try {
          const raw = localStorage.getItem(WIP_KEY);
          if (raw) {
            const wip = JSON.parse(raw);
            if (Date.now() - wip.savedAt < WIP_EXPIRY_MS && wip.exerciseLogs?.length > 0) {
              status = 0.5;
              const totalExercises = wip.snapshotExercises?.length ?? (wip.exerciseLogs.length + 1);
              progress = Math.round((wip.exerciseLogs.length / Math.max(totalExercises, 1)) * 100);
            }
          }
        } catch { /* ignore */ }
      } else if (isFuture) {
        status = 0;
        progress = 0;
      }

      return { status, progress, dateStr, log };
    });
    return { week: weekIdx + 1, days };
  });

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const getLogForDay = (weekIdx: number, dayIdx: number): WorkoutLog | undefined => {
    return weeks[weekIdx]?.days[dayIdx]?.log;
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
      {selectedDay !== null && (() => {
        const dayLog = getLogForDay(selectedDay.week, selectedDay.day);
        return (
          <div className="mt-4 pt-4 border-t-2 border-[#ff6600]">
            <div className="flex items-center justify-between mb-3">
              <div className={`${MONO} text-[10px] text-[#ff6600] uppercase tracking-wider`}>
                Week {selectedDay.week + 1} — {dayNames[selectedDay.day]} — {dayLog?.workoutName || "Session"}
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
            {dayLog ? (
              <WorkoutDetailView log={dayLog} />
            ) : (
              <div className={`${MONO} text-[9px] text-white/30`}>No data available</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function Stats({ avgDuration }: { avgDuration: number }) {
  const state = getBehaviorState();
  // Use 14-day rolling window for meaningful completion rate (matches Dashboard)
  const total14d = state.workoutsCompleted14d + state.workoutsSkipped14d;
  const completionRate = total14d > 0
    ? Math.round((state.workoutsCompleted14d / total14d) * 100)
    : 0;

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
  // Derive weekly completion counts from logs (last 4 calendar weeks, aligned with Dashboard)
  const currentMonday = getMondayOf(new Date());
  const data = [3, 2, 1, 0].map((weeksBack) => {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - weeksBack * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = logs.filter((l) => {
      const t = new Date(l.completedAt).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    }).length;
    const target = getBehaviorState().scheduleDaysPerWeek || 5;
    const value = Math.min(Math.round((count / target) * 100), 100);
    return { week: `W${4 - weeksBack}`, value };
  });

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="border border-white/20 p-5">
      <div className={`${MONO} text-[10px] text-white/60 uppercase tracking-[2px] mb-4`}>
        Recent Activity Log
      </div>

      {logs.length === 0 ? (
        <div className={`${MONO} text-[10px] text-white/50`}>
          No activity recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const d = new Date(log.completedAt);
            const date = toLocalDateStr(d).replace(/-/g, ".");
            const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            const isExpanded = expandedId === log.id;
            const hasExercises = !log.isActivity && log.exercises?.length > 0;

            return (
              <div key={log.id}>
                <button
                  onClick={() => hasExercises ? setExpandedId(isExpanded ? null : log.id) : undefined}
                  className={`w-full text-left flex items-center justify-between border-l-2 pl-3 py-2 transition-colors ${
                    isExpanded
                      ? "border-[#ff6600] bg-white/[0.02]"
                      : hasExercises
                        ? "border-white/20 hover:border-white/40 cursor-pointer"
                        : "border-white/20 cursor-default"
                  }`}
                >
                  <div>
                    <div className={`${MONO} text-[10px] text-white flex items-center gap-2`}>
                      {log.workoutName}
                      {log.isActivity && (
                        <span className="text-[7px] text-black bg-white/60 px-1 py-0.5 font-bold uppercase">Activity</span>
                      )}
                    </div>
                    <div className={`${MONO} text-[8px] text-white/40`}>
                      {date} · {time} · {log.isActivity
                        ? `${log.durationMinutes || 0}m${log.distance ? ` · ${log.distance}` : ""}`
                        : log.duration > 0 ? `${Math.round(log.duration / 60)}m` : "--"}
                      {hasExercises && !isExpanded && ` · ${log.exercises.length} exercises`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`size-2 ${log.completionType === "full" ? "bg-[#ff6600]" : "bg-white"}`} />
                    {hasExercises && (
                      <svg
                        className={`size-3 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </button>

                {isExpanded && hasExercises && (
                  <div className="ml-3 border-l border-[#ff6600]/30 pl-3 pt-3 pb-1">
                    <WorkoutDetailView log={log} />
                  </div>
                )}
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
  const [logsLoaded, setLogsLoaded] = useState(false);
  // Force re-render on tab focus (handles midnight crossover + stale behavior state)
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") forceUpdate(k => k + 1); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection<WorkoutLog>(
      `users/${user.uid}/workoutLogs`,
      [orderBy("completedAt", "desc"), limit(50)],
      (incoming) => { setLogs(incoming); setLogsLoaded(true); }
    );
    return unsub;
  }, [user]);

  const recentLogs = logs.slice(0, 5);
  // Exclude activity logs (they use durationMinutes, not duration) from avg calculation
  const workoutLogs = logs.filter(l => !l.isActivity && (l.duration || 0) > 0);
  const avgDuration = workoutLogs.length > 0
    ? workoutLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / workoutLogs.length
    : 0;

  if (!logsLoaded) {
    return (
      <div className="w-full p-6 pb-24 space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

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