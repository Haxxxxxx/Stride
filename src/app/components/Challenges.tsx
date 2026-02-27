import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import imgImage7 from "figma:asset/bf6da9de1404bcbb96bc246c72916c15f2e89025.png";
import imgImage8 from "figma:asset/24b6a62b7bae129c46221394e6598883d13abaec.png";
import imgImage12 from "figma:asset/dd40dbe95c08e8ffafa5e44173f6b8033e5ccfed.png";
import imgImage10 from "figma:asset/f66d8c8b01a14e7f20794613021e602bd29e44f5.png";
import imgImage2 from "figma:asset/fa12b2e954b8d8835c7af0f64149782f3496b2f7.png";
import { useAuth } from "../contexts/AuthContext";
import { getDocument } from "../../services/firestore";
import {
  type Challenge,
  getActiveChallenges,
  joinChallenge as joinChallengeService,
  isParticipant,
  daysRemaining,
} from "../../services/challenges";
import {
  type Squad,
  createSquad as createSquadService,
  joinSquadByCode,
  getUserSquads,
  getSquadMembers,
} from "../../services/squads";
import { notifyChallengeJoined, notifySquadJoined } from "../../services/notifications";

// Join Challenge Modal
function JoinChallengeModal({
  isOpen,
  onClose,
  challenge,
  onJoined,
}: {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onJoined: () => void;
}) {
  const { user } = useAuth();
  const [shareProgress, setShareProgress] = useState(true);
  const [joining, setJoining] = useState(false);

  if (!isOpen || !challenge) return null;

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const profile = await getDocument<{ callsign?: string }>(`users/${user.uid}`);
      await joinChallengeService(challenge.id, user.uid, shareProgress, profile?.callsign);
      notifyChallengeJoined(user.uid, challenge.title).catch(console.warn);
      onJoined();
      onClose();
    } catch (err) {
      console.warn("Failed to join challenge:", err);
    } finally {
      setJoining(false);
    }
  };

  const days = daysRemaining(challenge.endDate);

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
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
                Community Challenge
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider">
                Join Challenge
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

          {/* Challenge Info */}
          <div className="border border-white/20 p-4 mb-6">
            <div className="font-['JetBrains_Mono',monospace] text-[14px] text-white font-bold uppercase mb-2">
              {challenge.title}
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 mb-3">
              {challenge.description}
            </div>
            <div className="flex items-center gap-4 text-[9px]">
              <div className="font-['JetBrains_Mono',monospace] text-white/40">
                <span className="text-[#ff6600] font-bold">{challenge.participantCount}</span> Participants
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-white/40">
                <span className="text-[#ff6600] font-bold">{days}</span> Days Left
              </div>
            </div>
          </div>

          {/* Share Progress Card Toggle */}
          <div className="border border-white/20 p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider mb-1">
                  Share Progress Card
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60">
                  Allow challenge participants to view your detailed progress metrics
                </div>
              </div>
              <button
                onClick={() => setShareProgress(!shareProgress)}
                className={`relative w-12 h-6 border transition-colors ${
                  shareProgress ? 'bg-[#ff6600] border-[#ff6600]' : 'bg-black border-white/30'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                    shareProgress ? 'translate-x-[26px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join Challenge →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Join Squad Modal
function JoinSquadModal({
  isOpen,
  onClose,
  onJoined,
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
}) {
  const { user } = useAuth();
  const [squadCode, setSquadCode] = useState("");
  const [shareProgress, setShareProgress] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
                Squad Management
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider">
                Join Squad
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

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                Enter Squad Code
              </label>
              <input
                type="text"
                value={squadCode}
                onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
                placeholder="SQD-XXXXXX"
                className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[14px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none tracking-[2px]"
              />
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 mt-2">
                Enter the code shared by the squad creator
              </div>
            </div>

            {/* Share Progress Card Toggle */}
            <div className="border border-white/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider mb-1">
                    Share Progress Card
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60">
                    Allow squad members to view your detailed progress metrics
                  </div>
                </div>
                <button
                  onClick={() => setShareProgress(!shareProgress)}
                  className={`relative w-12 h-6 border transition-colors ${
                    shareProgress ? 'bg-[#ff6600] border-[#ff6600]' : 'bg-black border-white/30'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                      shareProgress ? 'translate-x-[26px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 border border-red-500/30 bg-red-500/10 p-3">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-red-400 uppercase">
                {error}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!user || !squadCode.trim()) return;
                setJoining(true);
                setError("");
                try {
                  const profile = await getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${user.uid}`);
                  const result = await joinSquadByCode(squadCode.trim(), user.uid, shareProgress, profile?.callsign, profile?.avatarUrl);
                  if (result.success) {
                    notifySquadJoined(user.uid, squadCode.trim()).catch(console.warn);
                    onJoined();
                    onClose();
                    setSquadCode("");
                  } else {
                    setError(result.error ?? "Failed to join squad");
                  }
                } catch (err) {
                  setError("Failed to join squad");
                } finally {
                  setJoining(false);
                }
              }}
              disabled={joining || !squadCode.trim()}
              className="flex-1 bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join Squad →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Profile Modal
function UserProfileModal({
  isOpen,
  onClose,
  user
}: {
  isOpen: boolean;
  onClose: () => void;
  user: { uid: string; name: string; avatar: string; sharingProgress: boolean } | null;
}) {
  const [stats, setStats] = useState<{ streakDays: number; totalWorkoutsCompleted: number; alignmentScore: number } | null>(null);
  const [recentLogs, setRecentLogs] = useState<{ workoutName: string; completedAt: string }[]>([]);

  useEffect(() => {
    if (!user?.sharingProgress || !user.uid) return;
    // Load behavior state
    getDocument<{ streakDays?: number; totalWorkoutsCompleted?: number; alignmentScore?: number }>(
      `users/${user.uid}/behaviorState/data`
    )
      .then((doc) => {
        if (doc) setStats({ streakDays: doc.streakDays ?? 0, totalWorkoutsCompleted: doc.totalWorkoutsCompleted ?? 0, alignmentScore: doc.alignmentScore ?? 50 });
      })
      .catch(console.warn);
    // Load recent workout logs
    import("../../services/firestore").then(({ queryCollection, orderBy, limit }) => {
      queryCollection<{ workoutName: string; completedAt: string }>(
        `users/${user.uid}/workoutLogs`,
        [orderBy("completedAt", "desc"), limit(3)]
      )
        .then(setRecentLogs)
        .catch(console.warn);
    });
  }, [user]);

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
                    {stats?.streakDays ?? 0}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Day Streak
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    {stats?.totalWorkoutsCompleted ?? 0}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Total Sessions
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    {stats?.alignmentScore ?? 50}%
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Alignment
                  </div>
                </div>
                <div className="border border-white/20 p-4">
                  <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                    {recentLogs.length}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
                    Recent Ops
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="border border-white/20 p-4">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider mb-3">
                  Recent Activity
                </div>
                <div className="space-y-2">
                  {recentLogs.length > 0 ? recentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                      <div>
                        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white">
                          {log.workoutName}
                        </div>
                        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40">
                          {new Date(log.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="size-2 bg-[#ff6600]" />
                    </div>
                  )) : (
                    <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40">No recent activity</div>
                  )}
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

// Placeholder avatars for squad member display
const placeholderAvatars = [imgImage8, imgImage12, imgImage10, imgImage2];

export default function Challenges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinSquadModal, setShowJoinSquadModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState<{ uid: string; name: string; avatar: string; sharingProgress: boolean } | null>(null);

  // Live data
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [squads, setSquads] = useState<(Squad & { memberAvatars: string[] })[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Load challenges
  useEffect(() => {
    getActiveChallenges()
      .then(setChallenges)
      .catch(console.warn);
  }, [refreshKey]);

  // Load user squads
  useEffect(() => {
    if (!user) return;
    getUserSquads(user.uid)
      .then(async (userSquads) => {
        const enriched = await Promise.all(
          userSquads.map(async (s) => {
            const members = await getSquadMembers(s.id).catch(() => []);
            const avatars = members
              .slice(0, 4)
              .map((m, i) => m.avatarUrl || placeholderAvatars[i % placeholderAvatars.length]);
            return { ...s, memberAvatars: avatars };
          })
        );
        setSquads(enriched);
      })
      .catch(console.warn);
  }, [user, refreshKey]);

  // Check which challenges user has joined
  useEffect(() => {
    if (!user || challenges.length === 0) return;
    Promise.all(
      challenges.map(async (c) => {
        const joined = await isParticipant(c.id, user.uid);
        return joined ? c.id : null;
      })
    ).then((ids) => {
      setJoinedChallengeIds(new Set(ids.filter(Boolean) as string[]));
    });
  }, [user, challenges]);

  const featuredChallenge = challenges[0] ?? null;

  return (
    <div className="w-full p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-2">
          Mission System
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold uppercase tracking-wider">
          Challenges Hub
        </div>
      </div>

      {/* Featured Community Challenge */}
      {featuredChallenge ? (
      <div
        className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-5 mb-4 relative cursor-pointer hover:bg-[#ff6600]/10 transition-colors"
        onClick={() => !joinedChallengeIds.has(featuredChallenge.id) && setShowJoinModal(true)}
      >
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
                  {joinedChallengeIds.has(featuredChallenge.id) ? "Joined" : "Active Community Challenge"}
                </div>
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase mb-2">
                {featuredChallenge.title}
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/80">
                {featuredChallenge.description}
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
                  strokeDasharray={`${2 * Math.PI * 28 * (featuredChallenge.target / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="square"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold">
                  {featuredChallenge.target}%
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

          <button className="w-full border border-[#ff6600] bg-black/50 py-2 font-['JetBrains_Mono',monospace] text-[11px] text-[#ff6600] uppercase hover:bg-[#ff6600] hover:text-black transition-colors">
            {joinedChallengeIds.has(featuredChallenge.id) ? "Joined ✓" : "Start the Challenge →"}
          </button>
        </div>
      </div>
      ) : (
        <div className="border border-white/10 p-5 mb-4 text-center">
          <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/40 uppercase tracking-wider">
            No active challenges
          </div>
        </div>
      )}

      {/* Challenge Stats */}
      <div className="border border-white/20 p-5 mb-6">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider mb-4">
          Challenge Statistics
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-white/20 p-3 text-center">
            <div className="font-['JetBrains_Mono',monospace] text-[18px] text-[#ff6600] font-bold">
              {joinedChallengeIds.size}
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
              Joined
            </div>
          </div>
          <div className="border border-white/20 p-3 text-center">
            <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold">
              {challenges.length}
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
              Active
            </div>
          </div>
          <div className="border border-white/20 p-3 text-center">
            <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold">
              {squads.length}
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60 uppercase tracking-wider">
              Squads
            </div>
          </div>
        </div>
      </div>

      {/* Squads Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px]">
            Squads
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinSquadModal(true)}
              className="border border-white/30 px-3 py-1 font-['JetBrains_Mono',monospace] text-[8px] text-white uppercase hover:bg-white/5 transition-colors"
            >
              Join Squad
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="border border-[#ff6600] px-3 py-1 font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase hover:bg-[#ff6600] hover:text-black transition-colors"
            >
              + New Squad
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {squads.map((squad) => (
            <div
              key={squad.id}
              className="border border-white/20 p-4 hover:border-[#ff6600]/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Squad Icon */}
                  <div className="size-9 bg-[#ff6600] flex items-center justify-center">
                    <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
                      <path
                        d="M4.5 6.75H3.375C2.96875 6.75 2.625 7.09375 2.625 7.5V14.625C2.625 15.0312 2.96875 15.375 3.375 15.375H4.5M4.5 6.75V15.375M4.5 6.75H13.5M4.5 15.375H13.5M13.5 6.75H14.625C15.0312 6.75 15.375 7.09375 15.375 7.5V14.625C15.375 15.0312 15.0312 15.375 14.625 15.375H13.5M13.5 6.75V15.375M6.75 6.75V15.375M11.25 6.75V15.375M9 2.625V6.75M7.125 4.5H10.875"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </div>

                  {/* Squad Info */}
                  <div>
                    <div className="font-['JetBrains_Mono',monospace] text-[12px] text-white font-bold uppercase">
                      {squad.name}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase">
                      {squad.type}
                    </div>
                  </div>
                </div>

                {/* Member Avatars */}
                <div className="flex items-center -space-x-2">
                  {squad.memberAvatars.slice(0, 4).map((avatar, idx) => (
                    <div key={idx} className="size-5 border-2 border-black overflow-hidden">
                      <img src={avatar} alt="" className="size-full object-cover" />
                    </div>
                  ))}
                  {(squad.memberCount ?? 0) > 4 && (
                    <div className="size-5 border-2 border-black bg-white/10 flex items-center justify-center">
                      <span className="font-['JetBrains_Mono',monospace] text-[7px] text-white font-bold">
                        +{(squad.memberCount ?? 0) - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {squads.length === 0 && (
            <div className="border border-white/10 p-4 text-center">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wider">
                No squads yet — create or join one
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Squad Modal */}
      <CreateSquadModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={refresh} />
      {/* Join Challenge Modal */}
      <JoinChallengeModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} challenge={featuredChallenge} onJoined={refresh} />
      {/* Join Squad Modal */}
      <JoinSquadModal isOpen={showJoinSquadModal} onClose={() => setShowJoinSquadModal(false)} onJoined={refresh} />
      {/* User Profile Modal */}
      <UserProfileModal isOpen={!!showProfileModal} onClose={() => setShowProfileModal(null)} user={showProfileModal} />
    </div>
  );
}

// Create Squad Modal
function CreateSquadModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [squadName, setSquadName] = useState("");
  const [squadType, setSquadType] = useState("Consistency");
  const [shareProgress, setShareProgress] = useState(true);
  const [showShareCode, setShowShareCode] = useState(false);
  const [squadCode, setSquadCode] = useState("");
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90"
        onClick={() => {
          onClose();
          setShowShareCode(false);
        }}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />

        <div className="relative z-10">
          {!showShareCode ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
                    Squad Management
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider">
                    Create New Squad
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setShowShareCode(false);
                  }}
                  className="size-8 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4 mb-6">
                {/* Squad Name */}
                <div>
                  <label className="block font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                    Squad Name
                  </label>
                  <input
                    type="text"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="Enter squad name..."
                    className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none"
                  />
                </div>

                {/* Squad Type */}
                <div>
                  <label className="block font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                    Focus Type
                  </label>
                  <select
                    value={squadType}
                    onChange={(e) => setSquadType(e.target.value)}
                    className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white focus:border-[#ff6600] focus:outline-none"
                  >
                    <option>Consistency</option>
                    <option>Strength</option>
                    <option>Endurance</option>
                    <option>Volume</option>
                    <option>General</option>
                  </select>
                </div>

                {/* Share Progress Card Toggle */}
                <div className="border border-white/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider mb-1">
                        Share Progress Card
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/60">
                        Allow squad members to view your detailed progress metrics
                      </div>
                    </div>
                    <button
                      onClick={() => setShareProgress(!shareProgress)}
                      className={`relative w-12 h-6 border transition-colors ${
                        shareProgress ? 'bg-[#ff6600] border-[#ff6600]' : 'bg-black border-white/30'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                          shareProgress ? 'translate-x-[26px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    setShowShareCode(false);
                  }}
                  className="flex-1 border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!user || !squadName.trim()) return;
                    setCreating(true);
                    try {
                      const profile = await getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${user.uid}`);
                      const result = await createSquadService(
                        user.uid,
                        squadName.trim(),
                        squadType,
                        shareProgress,
                        profile?.callsign,
                        profile?.avatarUrl
                      );
                      setSquadCode(result.code);
                      setShowShareCode(true);
                      onCreated();
                    } catch (err) {
                      console.warn("Failed to create squad:", err);
                    } finally {
                      setCreating(false);
                    }
                  }}
                  disabled={creating || !squadName.trim()}
                  className="flex-1 bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Squad →"}
                </button>
              </div>
            </>
          ) : (
            /* Squad Created - Share Code */
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
                    Squad Created
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider">
                    Share Squad Code
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setShowShareCode(false);
                  }}
                  className="size-8 border border-white/30 flex items-center justify-center hover:border-[#ff6600] transition-colors"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-2 border-[#ff6600] bg-[#ff6600]/5 p-6 mb-6 text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider mb-3">
                  Squad Code
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[28px] text-[#ff6600] font-bold tracking-[4px] mb-4">
                  {squadCode}
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40">
                  Share this code with others to invite them to your squad
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(squadCode);
                }}
                className="w-full border border-[#ff6600] py-3 mb-3 font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider hover:bg-[#ff6600] hover:text-black transition-colors"
              >
                Copy Code to Clipboard
              </button>

              <button
                onClick={() => {
                  onClose();
                  setShowShareCode(false);
                }}
                className="w-full bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}