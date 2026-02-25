import { Link } from "react-router";
import svgPaths from "../../imports/svg-2gts8wf65t";
import imgRectangle6 from "figma:asset/c92ce858c610970c9ceacaa61f2a4aa8318c963d.png";
import { CircularProgress } from "./CircularProgress";
import { useState, useEffect } from "react";
import { WorkoutSequenceModal } from "./WorkoutSequenceModal";
import { SystemMessage } from "./SystemMessage";
import { getRandomMessage, getStreakMilestoneMessage } from "../utils/microLanguage";
import { getBehaviorState, recordLogin } from "../utils/behaviorStore";

interface ActiveOperationProps {
  onOpenModal: () => void;
}

function Avatar() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 size-[50px]">
      <div className="aspect-[54/54] h-full relative shrink-0 border border-white/40">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full grayscale" src={imgRectangle6} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full pb-4 border-b border-white/10">
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
        <Avatar />
        <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0">
          <p className="font-['JetBrains_Mono',monospace] font-normal leading-[1.2] relative shrink-0 text-[10px] text-white/40 w-full uppercase tracking-[1px]">
            OPERATOR:
          </p>
          <p className="font-['JetBrains_Mono',monospace] font-bold leading-[1.2] relative shrink-0 text-[18px] text-white uppercase tracking-wider">
            marathonbill
          </p>
        </div>
      </div>
      
      <div className="content-stretch flex gap-[12px] h-[44px] items-center justify-center relative shrink-0">
        <Link to="/app/notifications" className="bg-black border border-white/30 content-stretch flex gap-[6px] items-center px-[10px] py-[6px] relative shrink-0 hover:border-[#ff6600] transition-colors">
          <div className="flex flex-col font-['JetBrains_Mono',monospace] font-medium justify-center leading-[0] relative shrink-0 text-[12px] text-center text-[#ff6600] whitespace-nowrap tracking-wider">
            <p className="leading-[1.2]">3</p>
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
            94%
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

function WeekOverview() {
  const days = [
    { day: "MON", date: "26", complete: true, progress: 100 },
    { day: "TUE", date: "27", complete: true, progress: 100 },
    { day: "WED", date: "28", complete: true, progress: 100 },
    { day: "THU", date: "29", complete: true, progress: 100 },
    { day: "FRI", date: "30", complete: false, active: true, progress: 28 },
    { day: "SAT", date: "31", complete: false, progress: 0 },
    { day: "SUN", date: "1", complete: false, progress: 0 },
  ];

  return (
    <div className="w-full">
      <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/60 uppercase tracking-[2px] mb-4">
        Calibration Cycle → Week 04
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

function ActiveOperation({ onOpenModal }: ActiveOperationProps) {
  return (
    <div className="w-full border-2 border-[#ff6600] bg-black p-5 relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-2 bg-[#ff6600] animate-pulse" />
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-[2px]">
          Active Protocol
        </div>
      </div>
      
      <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold uppercase tracking-wider mb-3">
        [02] Sit Up Module
      </div>
      
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Duration</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">30 min</div>
        </div>
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Reps</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">115</div>
        </div>
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Sets</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">15</div>
        </div>
        <div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Modules</div>
          <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-semibold">5</div>
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

function OperationsList() {
  const [operations, setOperations] = useState([
    { id: 1, name: "Jump Squat", complete: true },
    { id: 2, name: "Sit Up", complete: false, active: true },
    { id: 3, name: "Back Plank", complete: false },
    { id: 4, name: "Mountain Climber", complete: false },
  ]);

  const toggleComplete = (id: number) => {
    setOperations(ops => 
      ops.map(op => 
        op.id === id ? { ...op, complete: !op.complete } : op
      )
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
          Protocol Queue
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wide">
          10 modules · 1h 15m
        </div>
      </div>
      
      <div className="space-y-2">
        {operations.map((op) => (
          <div 
            key={op.id}
            className={`border p-3 flex items-center justify-between ${
              op.active 
                ? 'border-[#ff6600] bg-[#ff6600]/5' 
                : op.complete 
                  ? 'border-white/20 bg-white/5' 
                  : 'border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {op.active && (
                <div className="size-2 bg-[#ff6600] animate-pulse" />
              )}
              <div className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wide ${
                op.complete ? 'text-white/40 line-through' : op.active ? 'text-white' : 'text-white'
              }`}>
                [{op.id.toString().padStart(2, '0')}] {op.name}
              </div>
            </div>
            
            <button
              onClick={() => toggleComplete(op.id)}
              className={`size-[18px] border flex items-center justify-center transition-colors ${
                op.complete 
                  ? 'bg-white border-white' 
                  : 'border-white/40 hover:border-[#ff6600] hover:bg-[#ff6600]/10'
              }`}
            >
              {op.complete && (
                <div className="size-2 bg-black" />
              )}
            </button>
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState(true);

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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="w-full p-6 pb-24 space-y-6">
      <TopBar />

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
      <WeekOverview />
      <ActiveOperation onOpenModal={openModal} />
      <OperationsList />
      <WorkoutSequenceModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}