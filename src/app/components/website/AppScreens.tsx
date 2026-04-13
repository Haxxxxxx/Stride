import { useState } from "react";

const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Real-time operational awareness. Track streak integrity, consistency index, and calibration cycles. Observe performance patterns as they unfold. The system records. The agent interprets. You execute.",
    mockup: (
      <div className="w-full aspect-[9/16] bg-black border border-white/10 relative overflow-hidden">
        {/* Status bar */}
        <div className="px-4 pt-3 pb-2 flex justify-between items-center">
          <span className="font-['JetBrains_Mono'] text-[8px] text-white/60">09:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-2 border border-white/40 rounded-sm" />
          </div>
        </div>

        {/* Operator header */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 border border-white/20" />
          <div>
            <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-white/40">Operator:</p>
            <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.5px] uppercase text-white">MarathonBill</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-[#f60] px-2 py-0.5 flex items-center gap-1">
              <span className="font-['JetBrains_Mono'] text-[8px] text-black">3</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mx-4" />

        {/* System Status */}
        <div className="mx-4 mt-4 p-4 border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/50">System Status</span>
            <div className="w-2 h-2 bg-[#f60]" />
          </div>
          <p className="font-['JetBrains_Mono'] text-[16px] tracking-[1px] uppercase text-white">Operational</p>
          <div className="flex gap-2 mt-3">
            <div className="flex-1 border border-white/10 p-2">
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-white/40">Current Streak</p>
              <p className="font-['JetBrains_Mono'] text-[18px] text-white mt-1">6</p>
              <p className="font-['JetBrains_Mono'] text-[6px] tracking-[1px] uppercase text-white/30">Days</p>
            </div>
            <div className="flex-1 border border-white/10 p-2">
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-white/40">Consistency</p>
              <p className="font-['JetBrains_Mono'] text-[18px] text-white mt-1">94%</p>
              <p className="font-['JetBrains_Mono'] text-[6px] tracking-[1px] uppercase text-white/30">Score</p>
            </div>
          </div>
        </div>

        {/* Week tracker */}
        <div className="mx-4 mt-4">
          <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/40 mb-2">Calibration Cycle → Week 04</p>
          <div className="flex gap-1">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d, i) => (
              <div key={d} className={`flex-1 flex flex-col items-center gap-1 py-1 ${i === 4 ? 'border border-[#f60]' : ''}`}>
                <div className={`w-4 h-4 rounded-full border ${i < 4 ? 'border-[#f60] bg-[#f60]/20' : i === 4 ? 'border-[#f60]' : 'border-white/20'} flex items-center justify-center`}>
                  {i < 4 && <svg width="6" height="6" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#f60" strokeWidth="1.5" /></svg>}
                </div>
                <span className="font-['JetBrains_Mono'] text-[5px] tracking-[0.5px] uppercase text-white/40">{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Protocol */}
        <div className="mx-4 mt-4 border-2 border-[#f60] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 bg-[#f60]" />
            <span className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-[#f60]">Active Protocol</span>
          </div>
          <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.5px] uppercase text-white">[02] Sit Up Module</p>
          <div className="flex gap-4 mt-2">
            {[
              { label: "Duration", value: "30 min" },
              { label: "Reps", value: "115" },
              { label: "Sets", value: "15" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-['JetBrains_Mono'] text-[6px] tracking-[1px] uppercase text-white/40">{s.label}</p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#f60] mt-3 py-2 text-center">
            <span className="font-['JetBrains_Mono'] text-[9px] tracking-[1px] uppercase text-black">Begin Calibration</span>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 flex">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`flex-1 py-2 flex justify-center ${i === 0 ? 'bg-[#f60]/10 border-t-2 border-[#f60]' : ''}`}>
              <div className={`w-4 h-4 ${i === 0 ? 'text-[#f60]' : 'text-white/30'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {i === 0 && <path d="M8 1L14 7V15H2V7L8 1Z" stroke="currentColor" strokeWidth="1" />}
                  {i === 1 && <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" />}
                  {i === 2 && <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1" />}
                  {i === 3 && <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1" />}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "challenges",
    label: "Challenges",
    description: "Mission-based trials engineered for progression. Form tactical units. Complete calibrated objectives. Compete across live leaderboards. Unlock higher operational tiers through sustained discipline.",
    mockup: (
      <div className="w-full aspect-[9/16] bg-black border border-white/10 relative overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex justify-between items-center">
          <span className="font-['JetBrains_Mono'] text-[8px] text-white/60">09:41</span>
          <div className="w-3 h-2 border border-white/40 rounded-sm" />
        </div>
        <div className="px-4 pt-2">
          <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/40">Mission System</p>
          <p className="font-['JetBrains_Mono'] text-[16px] tracking-[1px] uppercase text-white mt-1">Challenges Hub</p>
        </div>

        {/* Challenge card */}
        <div className="mx-4 mt-4 border-2 border-[#f60] p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 bg-[#f60]" />
            <span className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-[#f60]">Active Community Challenge</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.5px] uppercase text-white leading-[1.4]">February<br />Community<br />Challenge</p>
              <p className="font-['JetBrains_Mono'] text-[8px] text-white/40 mt-2 max-w-[140px] leading-[1.5]">Have a Consistency Score of at least 80% by the end of the month.</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-[#f60]/60 flex items-center justify-center">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#f60]">80%</span>
            </div>
          </div>
          <div className="border border-[#f60] mt-3 py-2 text-center">
            <span className="font-['JetBrains_Mono'] text-[8px] tracking-[1px] uppercase text-white">Start the Challenge →</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-4 mt-4">
          <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/40 mb-3">Challenge Statistics</p>
          <div className="flex gap-2">
            {[
              { value: "12", label: "Completed" },
              { value: "2", label: "Active" },
              { value: "1", label: "Locked" },
            ].map((s) => (
              <div key={s.label} className="flex-1 border border-white/10 p-3 text-center">
                <p className="font-['JetBrains_Mono'] text-[16px] text-[#f60]">{s.value}</p>
                <p className="font-['JetBrains_Mono'] text-[6px] tracking-[1px] uppercase text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Squads */}
        <div className="mx-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-['JetBrains_Mono'] text-[10px] tracking-[1px] uppercase text-white">Squads</p>
            <div className="flex gap-2">
              <span className="font-['JetBrains_Mono'] text-[7px] border border-white/20 px-2 py-0.5 text-white/50 uppercase">Join Squad</span>
              <span className="font-['JetBrains_Mono'] text-[7px] border border-[#f60] px-2 py-0.5 text-[#f60] uppercase">+ New Squad</span>
            </div>
          </div>
          <div className="border border-white/10 p-3 flex items-center gap-3">
            <div className="w-6 h-6 bg-[#f60]/20 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 7V15H2V7L8 1Z" stroke="#f60" strokeWidth="1" /></svg>
            </div>
            <div>
              <p className="font-['JetBrains_Mono'] text-[9px] tracking-[0.5px] uppercase text-white">Home Squad</p>
              <p className="font-['JetBrains_Mono'] text-[7px] text-white/40 uppercase">Consistency</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 flex">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`flex-1 py-2 flex justify-center ${i === 2 ? 'bg-[#f60] border-t-2 border-[#f60]' : ''}`}>
              <div className={`w-4 h-4 ${i === 2 ? 'text-black' : 'text-white/30'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {i === 0 && <path d="M8 1L14 7V15H2V7L8 1Z" stroke="currentColor" strokeWidth="1" />}
                  {i === 1 && <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" />}
                  {i === 2 && <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1" />}
                  {i === 3 && <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1" />}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    description: "Operator identity and performance archive. Total deployments logged. Progress analytics preserved. A living record of adaptation and output.",
    mockup: (
      <div className="w-full aspect-[9/16] bg-black border border-white/10 relative overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex justify-between items-center">
          <span className="font-['JetBrains_Mono'] text-[8px] text-white/60">09:41</span>
          <div className="w-3 h-2 border border-white/40 rounded-sm" />
        </div>

        {/* Profile card */}
        <div className="mx-4 mt-2 border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/5 border border-white/20" />
            <div>
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/40">Operator ID</p>
              <p className="font-['JetBrains_Mono'] text-[14px] tracking-[0.5px] uppercase text-white">MarathonBill</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-[#f60]" />
                <span className="font-['JetBrains_Mono'] text-[7px] tracking-[0.5px] uppercase text-[#f60]">Active Status</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-white/30">Email</p>
              <p className="font-['JetBrains_Mono'] text-[9px] text-white/70">bill@operator.sys</p>
            </div>
            <div>
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1px] uppercase text-white/30">Bio</p>
              <p className="font-['JetBrains_Mono'] text-[9px] text-white/70 leading-[1.5]">Optimizing performance metrics. Running the protocol.</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-4 mt-3 flex gap-2">
          {[
            { value: "28", label: "Days Active" },
            { value: "168", label: "Operations" },
            { value: "94%", label: "Success Rate" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-3 border border-white/10">
              <p className="font-['JetBrains_Mono'] text-[14px] text-white">{s.value}</p>
              <p className="font-['JetBrains_Mono'] text-[6px] tracking-[1px] uppercase text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-4 mt-3 border border-white/20 py-2 text-center">
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[1px] uppercase text-white">Edit Profile</span>
        </div>

        {/* Progress Report */}
        <div className="mx-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-['JetBrains_Mono'] text-[8px] tracking-[1.5px] uppercase text-white/50">Progress Report</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-[#f60]" />
              <span className="font-['JetBrains_Mono'] text-[7px] text-[#f60] uppercase">Shareable</span>
            </div>
          </div>
          <div className="border-2 border-[#f60] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-[#f60]" />
              <span className="font-['JetBrains_Mono'] text-[7px] tracking-[0.5px] uppercase text-[#f60]">Training OS</span>
            </div>
            <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.5px] uppercase text-white">MarathonBill</p>
            <p className="font-['JetBrains_Mono'] text-[7px] text-white/40 uppercase mt-0.5">Operator Progress Report</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-['JetBrains_Mono'] text-[7px] text-white/40 uppercase">Current Streak</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-['JetBrains_Mono'] text-[14px] text-white">6</span>
                  <span className="font-['JetBrains_Mono'] text-[7px] text-white/30 uppercase">Days</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-['JetBrains_Mono'] text-[7px] text-white/40 uppercase">Total Operations</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-['JetBrains_Mono'] text-[14px] text-white">168</span>
                  <span className="font-['JetBrains_Mono'] text-[7px] text-white/30 uppercase">Ops</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 flex">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`flex-1 py-2 flex justify-center ${i === 3 ? 'bg-[#f60] border-t-2 border-[#f60]' : ''}`}>
              <div className={`w-4 h-4 ${i === 3 ? 'text-black' : 'text-white/30'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {i === 0 && <path d="M8 1L14 7V15H2V7L8 1Z" stroke="currentColor" strokeWidth="1" />}
                  {i === 1 && <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" />}
                  {i === 2 && <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1" />}
                  {i === 3 && <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1" />}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "ai",
    label: "AI Agent",
    description: "An autonomous command intelligence. Analyzes your inputs, training metrics, and recovery signals. Generates uniquely tailored exercise protocols. Continuously recalibrates your program based on real-time data. The system learns. The protocol evolves.",
    mockup: (
      <div className="w-full aspect-[9/16] bg-black border border-white/10 relative overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-[#f60] px-4 py-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-['JetBrains_Mono'] text-[7px] tracking-[1.5px] uppercase text-white/50">Neural Interface</p>
              <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.5px] uppercase text-[#f60]">Command Channel</p>
              <p className="font-['JetBrains_Mono'] text-[7px] text-white/40 uppercase mt-1">Agent: Atlas ▸</p>
            </div>
            <div className="w-7 h-7 border border-white/30 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M2 2L10 10" stroke="white" strokeWidth="1.2" /></svg>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#f60]" />
            <span className="font-['JetBrains_Mono'] text-[8px] text-[#f60] uppercase">Online • Ready for input</span>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-4 space-y-4 flex-1">
          <div className="border-l-2 border-[#f60] pl-3">
            <p className="font-['JetBrains_Mono'] text-[7px] text-[#f60] uppercase">09:41 • SYS</p>
            <p className="font-['JetBrains_Mono'] text-[9px] text-white/80 mt-1 uppercase">Command Channel Established</p>
          </div>

          <div className="border border-white/10 p-3">
            <p className="font-['JetBrains_Mono'] text-[7px] text-white/30 uppercase">09:41 • Agent</p>
            <p className="font-['JetBrains_Mono'] text-[8px] text-white/70 mt-2 leading-[1.6]">
              Training protocol analysis complete. Six-day operational streak detected. System recommends calibration adjustment for optimal performance sustainability.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="absolute bottom-[52px] left-0 right-0 px-4 border-t border-white/10 py-2">
          <div className="flex gap-1 overflow-hidden">
            {["> Recalibrate plan", "> Report completion", "> Check streak"].map((cmd) => (
              <span key={cmd} className="font-['JetBrains_Mono'] text-[7px] border border-white/20 px-2 py-1 text-white/50 whitespace-nowrap">{cmd}</span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-black border-t-2 border-[#f60] px-4 py-3">
          <div className="border border-white/30 flex items-center px-3 py-2">
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#f60] mr-2">{`>`}</span>
            <span className="font-['JetBrains_Mono'] text-[9px] text-white/30">Enter command...</span>
            <div className="ml-auto border border-[#f60] px-2 py-0.5">
              <span className="font-['JetBrains_Mono'] text-[7px] text-[#f60] uppercase">Send</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function AppScreens() {
  const [activeScreen, setActiveScreen] = useState(0);

  return (
    <section id="screens" className="bg-black py-24 md:py-32 relative">
      <div className="absolute top-0 left-6 right-6 h-px bg-white/10" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-12">
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-[3px] uppercase text-[#f60] block mb-3">
            Interface Preview
          </span>
          <h2 className="font-['JetBrains_Mono'] text-[24px] md:text-[32px] tracking-[1px] uppercase text-white">
            System Interface
          </h2>
          <div className="w-12 h-[2px] bg-[#f60] mt-4" />
          <p className="font-['JetBrains_Mono'] text-[11px] leading-[1.8] text-white/40 mt-4 max-w-lg">
            A live operational console for the disciplined. Monitor readiness. Execute calibrated protocols. Adapt in real time through autonomous intelligence.
          </p>
        </div>

        {/* Screen tabs */}
        <div className="flex gap-px mb-10 overflow-x-auto">
          {screens.map((screen, i) => (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(i)}
              className={`font-['JetBrains_Mono'] text-[10px] tracking-[1.5px] uppercase px-5 py-3 transition-all whitespace-nowrap ${
                activeScreen === i
                  ? "bg-[#f60] text-black"
                  : "bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {screen.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Phone mockup */}
          <div className="w-[280px] md:w-[320px] shrink-0">
            <div className="relative">
              {/* Phone frame glow */}
              <div className="absolute -inset-4 bg-[#f60]/5 blur-xl" />
              <div className="relative">
                {screens[activeScreen].mockup}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-['JetBrains_Mono'] text-[9px] tracking-[2px] uppercase text-white/30">
                [{String(activeScreen + 1).padStart(2, "0")}]
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <h3 className="font-['JetBrains_Mono'] text-[20px] md:text-[24px] tracking-[1px] uppercase text-white mb-4">
              {screens[activeScreen].label}
            </h3>

            <p className="font-['JetBrains_Mono'] text-[12px] leading-[2] text-white/40 max-w-md">
              {screens[activeScreen].description}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {screens.map((screen, i) => (
                <button
                  key={screen.id}
                  onClick={() => setActiveScreen(i)}
                  className={`text-left flex items-center gap-3 group transition-all ${
                    activeScreen === i ? "opacity-100" : "opacity-30 hover:opacity-60"
                  }`}
                >
                  <div className={`w-6 h-px ${activeScreen === i ? "bg-[#f60]" : "bg-white/30"}`} />
                  <span className="font-['JetBrains_Mono'] text-[10px] tracking-[1px] uppercase text-white">
                    {screen.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}