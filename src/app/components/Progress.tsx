import { Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import { CircularProgress } from "./CircularProgress";
import { useState } from "react";

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

function WeeklyGrid() {
  const [selectedDay, setSelectedDay] = useState<{week: number; day: number} | null>(null);
  
  const weeks = [
    { week: 1, days: [
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 0, progress: 0 },
      { status: 0, progress: 0 }
    ]},
    { week: 2, days: [
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 }
    ]},
    { week: 3, days: [
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 0, progress: 0 }
    ]},
    { week: 4, days: [
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 1, progress: 100 },
      { status: 0.5, progress: 28 },
      { status: 0, progress: 0 },
      { status: 0, progress: 0 }
    ]},
  ];

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const getDayData = (weekIdx: number, dayIdx: number) => {
    const mockData = {
      exercises: [
        { name: "Bench Press", sets: 4, reps: 8, weight: "185 lbs" },
        { name: "Squat", sets: 5, reps: 5, weight: "225 lbs" },
        { name: "Deadlift", sets: 3, reps: 8, weight: "275 lbs" }
      ],
      duration: "68 min",
      volume: "12,450 lbs"
    };
    return mockData;
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

function Stats() {
  const stats = [
    { label: "Total Operations", value: "168", change: "+12" },
    { label: "Active Streak", value: "6 Days", change: "Current" },
    { label: "Completion Rate", value: "94%", change: "+3%" },
    { label: "Avg Duration", value: "68 min", change: "-5 min" },
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
          <div className={`font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wide ${
            stat.change.includes('+') || stat.change === 'Current' ? 'text-[#ff6600]' : 'text-white/40'
          }`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceChart() {
  const data = [
    { week: "W1", value: 85 },
    { week: "W2", value: 92 },
    { week: "W3", value: 88 },
    { week: "W4", value: 94 },
  ];

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

function RecentActivity() {
  const activities = [
    { date: "2026.02.09", time: "14:30", op: "Jump Squat", status: "complete" },
    { date: "2026.02.09", time: "09:15", op: "Morning Run", status: "complete" },
    { date: "2026.02.08", time: "18:00", op: "Core Training", status: "complete" },
    { date: "2026.02.08", time: "10:30", op: "Strength Block", status: "complete" },
    { date: "2026.02.07", time: "16:45", op: "Cardio Cycle", status: "complete" },
  ];

  return (
    <div className="border border-white/20 p-5">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-4">
        Recent Activity Log
      </div>
      
      <div className="space-y-2">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-center justify-between border-l-2 border-white/20 pl-3 py-2">
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
                {activity.op}
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                {activity.date} · {activity.time}
              </div>
            </div>
            <div className="size-2 bg-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Progress() {
  return (
    <div className="w-full p-6 pb-24">
      <Header />
      <WeeklyGrid />
      <Stats />
      <PerformanceChart />
      <RecentActivity />
    </div>
  );
}