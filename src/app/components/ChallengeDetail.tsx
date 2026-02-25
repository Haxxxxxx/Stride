import { Link } from "react-router";
import { useState } from "react";
import imgImage8 from "figma:asset/24b6a62b7bae129c46221394e6598883d13abaec.png";
import imgImage12 from "figma:asset/dd40dbe95c08e8ffafa5e44173f6b8033e5ccfed.png";
import imgImage10 from "figma:asset/f66d8c8b01a14e7f20794613021e602bd29e44f5.png";
import imgImage2 from "figma:asset/fa12b2e954b8d8835c7af0f64149782f3496b2f7.png";

// User Profile Modal
function UserProfileModal({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  user: { name: string; avatar: string; sharingProgress: boolean } | null;
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-12 overflow-hidden border-2 border-[#ff6600]">
                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
              </div>
              <div>
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px]">
                  Operator Profile
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                  {user.name}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {user.sharingProgress ? (
            /* Full Progress Card */
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-[#ff6600] font-bold">
                    28
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Day Streak
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    142
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Total Sessions
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    92%
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Consistency
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    3.2K
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Total XP
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="border border-white/20 p-4">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider mb-3">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {[
                    { module: "Upper Body Protocol", date: "Today", status: "complete" },
                    { module: "Core Calibration", date: "Yesterday", status: "complete" },
                    { module: "Lower Body Protocol", date: "2 days ago", status: "complete" },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                      <div>
                        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white">
                          {activity.module}
                        </div>
                        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                          {activity.date}
                        </div>
                      </div>
                      <div className="size-2 bg-[#ff6600]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Public Info Only */
            <div className="border border-white/20 p-6 text-center">
              <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/60 uppercase tracking-wider mb-4">
                Progress Card Private
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 mb-6">
                This operator has not shared their detailed progress metrics with the challenge.
              </div>
              
              {/* Public Stats Only */}
              <div className="border border-white/20 p-4 inline-block">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider mb-2">
                  Public Stats
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                  Active Participant
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 mt-1">
                  Joined 3 weeks ago
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChallengeDetail() {
  const [showProfileModal, setShowProfileModal] = useState<{ name: string; avatar: string; sharingProgress: boolean } | null>(null);

  const participants = [
    { rank: 1, name: "Budi Santoso", avatar: imgImage8, score: 85, sharingProgress: true },
    { rank: 2, name: "Budi Santoso", avatar: imgImage12, score: 84, sharingProgress: false },
    { rank: 3, name: "Thomas Speed", avatar: imgImage10, score: 83, sharingProgress: true },
    { rank: 4, name: "Andy William", avatar: imgImage10, score: 82, sharingProgress: false },
    { rank: 5, name: "marathonbill", avatar: imgImage2, score: 81, isCurrentUser: true, sharingProgress: true },
    { rank: 6, name: "power_lifter", avatar: imgImage8, score: 79, sharingProgress: true },
    { rank: 7, name: "cardio_king", avatar: imgImage12, score: 78, sharingProgress: true },
    { rank: 8, name: "strength_seeker", avatar: imgImage10, score: 76, sharingProgress: false },
  ];

  return (
    <div className="w-full p-6 pb-24">
      {/* Back Button */}
      <Link to="/app/challenges" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="square" strokeWidth={2} d="M15 18l-6-6 6-6" />
        </svg>
        <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider">Back</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-2">
          Mission System
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold uppercase tracking-wider">
          Community Challenge
        </div>
      </div>

      {/* Featured Challenge Card */}
      <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-5 mb-6 relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 bg-[#ff6600] animate-pulse" />
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider">
                  Active Community Challenge
                </div>
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase mb-2">
                February Community Challenge
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/80">
                Have a Consistency Score of at least 80% by the end of the month.
              </div>
            </div>

            {/* Progress Circle */}
            <div className="relative shrink-0">
              <svg className="size-16" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.2"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#ff6600"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28 * 0.8} ${2 * Math.PI * 28}`}
                  strokeLinecap="square"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold">
                  80%
                </div>
                <svg className="size-4 mt-0.5" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M8 2.5C8 2.5 6.5 4 6.5 6C6.5 7.5 7.5 8 8 8.5C8.5 8 9.5 7.5 9.5 6C9.5 4 8 2.5 8 2.5Z M8 8.5C8 8.5 5.5 9.5 5.5 12C5.5 13.933 6.567 15 8 15C9.433 15 10.5 13.933 10.5 12C10.5 9.5 8 8.5 8 8.5Z"
                    fill="#ff6600"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Progress Card */}
      <div className="border border-white/20 p-5 mb-6 relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-bold uppercase tracking-wider mb-1">
                Your Progress
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase">
                Since 20 days ago
              </div>
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[28px] text-[#ff6600] font-bold">
              65%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 border border-white/20">
            <div 
              className="absolute inset-y-0 left-0 bg-[#ff6600]"
              style={{ width: '65%' }}
            />
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="border border-white/20 p-5">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px] mb-4">
          Participants (25)
        </div>

        <div className="space-y-2">
          {participants.map((participant) => (
            <div 
              key={participant.rank}
              className={`border p-3 flex items-center justify-between cursor-pointer hover:border-[#ff6600]/50 transition-colors ${
                participant.isCurrentUser 
                  ? 'border-[#ff6600] bg-[#ff6600]/10' 
                  : 'border-white/10'
              }`}
              onClick={() => !participant.isCurrentUser && setShowProfileModal({
                name: participant.name,
                avatar: participant.avatar,
                sharingProgress: participant.sharingProgress
              })}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`font-['JetBrains_Mono',monospace] text-[12px] font-bold w-8 ${
                  participant.rank === 1 
                    ? 'text-[#ff6600]' 
                    : 'text-white/60'
                }`}>
                  #{participant.rank.toString().padStart(2, '0')}
                </div>
                
                <div className="size-6 overflow-hidden">
                  <img 
                    src={participant.avatar} 
                    alt={participant.name}
                    className="size-full object-cover"
                  />
                </div>

                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white">
                  {participant.name}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!participant.isCurrentUser && (
                  <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase">
                    {participant.sharingProgress ? 'Sharing' : 'Private'}
                  </div>
                )}
                <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-bold">
                  {participant.score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={!!showProfileModal} onClose={() => setShowProfileModal(null)} user={showProfileModal} />
    </div>
  );
}