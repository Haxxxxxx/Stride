import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  type Challenge,
  type ChallengeParticipant,
  getChallenge,
  getChallengeParticipants,
  leaveChallenge,
  daysRemaining,
  syncParticipantProfile,
} from "../../services/challenges";
import { getDocument } from "../../services/firestore";
import { getBehaviorState } from "../utils/behaviorStore";
import { Scanline } from "./Scanline";
import UserProfileModal, { type ProfileModalUser } from "./UserProfileModal";

function AvatarPlaceholder() {
  return (
    <div className="size-full bg-white/10 flex items-center justify-center">
      <svg className="size-3 text-white/30" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
      </svg>
    </div>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState<ProfileModalUser | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  // User's own progress from behaviorStore, calculated per challenge targetType
  const behaviorState = getBehaviorState();
  const userProgress = (() => {
    if (!challenge) return 0;
    switch (challenge.targetType) {
      case "consistency": {
        const completed14d = behaviorState.workoutsCompleted14d ?? behaviorState.workoutsCompletedThisWeek;
        const skipped14d = behaviorState.workoutsSkipped14d ?? behaviorState.workoutsSkippedThisWeek;
        const total = completed14d + skipped14d;
        return total > 0 ? Math.round((completed14d / total) * 100) : 0;
      }
      case "streak":
        return Math.min(Math.round((behaviorState.streakDays / challenge.target) * 100), 100);
      case "workouts":
        return Math.min(Math.round((behaviorState.totalWorkoutsCompleted / challenge.target) * 100), 100);
      default:
        return 0;
    }
  })();

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [c, p] = await Promise.all([getChallenge(id!), getChallengeParticipants(id!)]);
        setChallenge(c);
        setParticipants(p);

        // Sync current user's avatar/callsign then re-fetch participants so UI is fresh
        if (user) {
          const profile = await getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${user.uid}`);
          if (profile) {
            await syncParticipantProfile(user.uid, profile.callsign ?? "", profile.avatarUrl ?? "");
            const updated = await getChallengeParticipants(id!);
            setParticipants(updated);
          }
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user]);

  if (loading) {
    return (
      <div className="w-full p-6 pb-24 flex items-center justify-center min-h-[50vh]">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wider animate-pulse">
          Loading challenge...
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="w-full p-6 pb-24 text-center">
        <Link to="/app/challenges" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider">
          ← Back to Challenges
        </Link>
        <p className="font-['JetBrains_Mono',monospace] text-[12px] text-white/40 uppercase tracking-wider mt-8">
          This challenge has ended or was removed.
        </p>
      </div>
    );
  }

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
          {challenge?.title ?? "Community Challenge"}
        </div>
      </div>

      {/* Featured Challenge Card */}
      <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-5 mb-6 relative">
        <Scanline />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 bg-[#ff6600] animate-pulse" />
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider">
                  {challenge ? `${daysRemaining(challenge.endDate)} days left` : "Active Community Challenge"}
                </div>
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase mb-2">
                {challenge?.title ?? "Challenge"}
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/80">
                {challenge?.description ?? ""}
              </div>
            </div>

            {/* Progress Circle */}
            <div className="relative shrink-0">
              <svg className="size-16" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="#ff6600" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28 * (userProgress / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="square" transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold">
                  {challenge?.targetType === "consistency"
                    ? `${challenge.target}%`
                    : challenge?.targetType === "streak"
                    ? `${challenge.target}d`
                    : `${challenge.target}`}
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

      {/* Your Progress Card — only shown if user has joined this challenge */}
      {user && participants.some(p => p.id === user.uid) && (
      <div className="border border-white/20 p-5 mb-6 relative">
        <Scanline />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-bold uppercase tracking-wider mb-1">
                Your Progress
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase">
                {challenge?.targetType === "streak" ? "Streak progress" : challenge?.targetType === "workouts" ? "Sessions progress" : "Current consistency"}
              </div>
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[28px] text-[#ff6600] font-bold">
              {userProgress}%
            </div>
          </div>

          <div className="relative h-2 bg-white/10 border border-white/20">
            <div
              className="absolute inset-y-0 left-0 bg-[#ff6600]"
              style={{ width: `${Math.min(userProgress, 100)}%` }}
            />
          </div>

          {/* Leave Challenge Button */}
          <button
            onClick={async () => {
              if (!user || !id) return;
              if (!confirm("Leave this challenge?")) return;
              setLeaving(true);
              try {
                await leaveChallenge(id, user.uid);
                navigate("/app/challenges");
              } catch (err) {
                console.warn("Failed to leave challenge:", err);
                setLeaving(false);
                window.alert("Failed to leave challenge. Check your connection and try again.");
              }
            }}
            disabled={leaving}
            className="mt-4 w-full border border-white/20 py-2 font-['JetBrains_Mono',monospace] text-[9px] text-white/50 uppercase tracking-wider hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {leaving ? "Leaving..." : "Leave Challenge"}
          </button>
        </div>
      </div>
      )}

      {/* Participants List */}
      <div className="border border-white/20 p-5">
        <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px] mb-4">
          Participants ({challenge?.participantCount ?? participants.length})
        </div>

        <div className="space-y-2">
          {participants.length === 0 ? (
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase text-center py-4">
              No participants yet
            </div>
          ) : (
            participants.map((p, idx) => {
              const rank = idx + 1;
              const isCurrentUser = p.id === user?.uid;
              return (
                <div
                  key={p.id}
                  className={`border p-3 flex items-center justify-between cursor-pointer hover:border-[#ff6600]/50 transition-colors ${
                    isCurrentUser ? "border-[#ff6600] bg-[#ff6600]/10" : "border-white/10"
                  }`}
                  onClick={() =>
                    !isCurrentUser &&
                    setShowProfileModal({
                      uid: p.id,
                      name: p.callsign || `Operator #${rank}`,
                      avatar: p.avatarUrl || "",
                      sharingProgress: p.shareProgress,
                      streakDays: p.streakDays,
                      totalWorkoutsCompleted: p.totalWorkoutsCompleted,
                      alignmentScore: p.alignmentScore,
                      progress: p.progress,
                    })
                  }
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`font-['JetBrains_Mono',monospace] text-[12px] font-bold w-8 ${rank === 1 ? "text-[#ff6600]" : "text-white/60"}`}>
                      #{rank.toString().padStart(2, "0")}
                    </div>
                    <div className="size-6 overflow-hidden">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <AvatarPlaceholder />
                      )}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white">
                      {p.callsign || `Operator #${rank}`}
                      {isCurrentUser && " (You)"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isCurrentUser && (
                      <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/40 uppercase">
                        {p.shareProgress ? "Sharing" : "Private"}
                      </div>
                    )}
                    <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-bold">
                      {p.progress}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <UserProfileModal isOpen={!!showProfileModal} onClose={() => setShowProfileModal(null)} user={showProfileModal} />
    </div>
  );
}