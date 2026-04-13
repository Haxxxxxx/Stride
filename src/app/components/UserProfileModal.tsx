import { useEffect } from "react";
import { Scanline } from "./Scanline";

export interface ProfileModalUser {
  uid: string;
  name: string;
  avatar: string;
  sharingProgress: boolean;
  // Stats from challenge participant doc (publicly readable)
  streakDays?: number;
  totalWorkoutsCompleted?: number;
  alignmentScore?: number;
  progress?: number;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileModalUser | null;
}) {

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6 max-h-[90vh] overflow-y-auto">
        <Scanline />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-12 overflow-hidden border-2 border-[#ff6600]">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-white/10 flex items-center justify-center">
                    <svg className="size-5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                    </svg>
                  </div>
                )}
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
              aria-label="Close"
              className="size-8 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {user.sharingProgress ? (
            /* Full Progress Card — stats from challenge participant doc */
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-[#ff6600] font-bold">
                    {user.streakDays ?? 0}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Day Streak
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    {user.totalWorkoutsCompleted ?? 0}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Total Sessions
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    {user.alignmentScore ?? 50}%
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Alignment
                  </div>
                </div>
              </div>

              {/* Challenge Progress */}
              {user.progress != null && (
                <div className="border border-white/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
                      Challenge Progress
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold">
                      {user.progress}%
                    </div>
                  </div>
                  <div className="relative h-2 bg-white/10 border border-white/20">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#ff6600]"
                      style={{ width: `${Math.min(user.progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Public Info Only */
            <div className="border border-white/20 p-6 text-center">
              <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white/60 uppercase tracking-wider mb-4">
                Progress Card Private
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 mb-6">
                This operator has not shared their detailed progress metrics with the squad.
              </div>

              {/* Public Stats Only */}
              <div className="border border-white/20 p-4 inline-block">
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider mb-2">
                  Public Stats
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold">
                  Active Member
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
