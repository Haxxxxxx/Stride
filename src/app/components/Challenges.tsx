import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getDocument, queryCollection, limit } from "../../services/firestore";
import { getBehaviorState } from "../utils/behaviorStore";
import { SkeletonBlock } from "./LoadingSkeleton";
import {
  type Challenge,
  getActiveChallenges,
  joinChallenge as joinChallengeService,
  isParticipant,
  daysRemaining,
  syncParticipantProfile,
} from "../../services/challenges";
import {
  type Squad,
  createSquad as createSquadService,
  joinSquadByCode,
  getUserSquads,
  getSquadMembers,
  leaveSquad as leaveSquadService,
  deleteSquad as deleteSquadService,
  updateSquadInfo,
} from "../../services/squads";
import { notifyChallengeJoined, notifySquadJoined } from "../../services/notifications";
import { Scanline } from "./Scanline";
import UserProfileModal, { type ProfileModalUser } from "./UserProfileModal";

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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !challenge) return null;

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const profile = await getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${user.uid}`);
      await joinChallengeService(challenge.id, user.uid, shareProgress, profile?.callsign, profile?.avatarUrl);
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
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6 max-h-[90vh] overflow-y-auto">
        <Scanline />

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
              aria-label="Close"
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

// Edit Squad Modal
function EditSquadModal({
  isOpen,
  onClose,
  squad,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  squad: (Squad & { memberAvatars: string[] }) | null;
  onUpdated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Consistency");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (squad) {
      setName(squad.name);
      setType(squad.type);
    }
  }, [squad]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !squad) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateSquadInfo(squad.id, { name: name.trim(), type });
      onUpdated();
      onClose();
    } catch (err) {
      console.warn("Failed to update squad:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6 max-h-[90vh] overflow-y-auto">
        <Scanline />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
                Squad Management
              </div>
              <div className="font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider">
                Edit Squad
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

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                Squad Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white placeholder:text-white/30 focus:border-[#ff6600] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider mb-2">
                Focus Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black border border-white/20 px-4 py-3 font-['JetBrains_Mono',monospace] text-[12px] text-white focus:border-[#ff6600] focus:outline-none"
              >
                <option>Consistency</option>
                <option>Strength</option>
                <option>Endurance</option>
                <option>Volume</option>
                <option>General</option>
              </select>
            </div>
            <div className="border border-white/10 p-3">
              <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wider mb-1">Squad Code</div>
              <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold tracking-[2px]">{squad.code}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-white/20 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 bg-[#ff6600] py-3 font-['JetBrains_Mono',monospace] text-[10px] text-black font-bold uppercase tracking-wider hover:bg-[#ff8833] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
              aria-label="Close"
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
                    notifySquadJoined(user.uid, result.squadName ?? squadCode.trim()).catch(console.warn);
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

// No more stock photo placeholders — use inline SVG avatar for users without avatarUrl

export default function Challenges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinSquadModal, setShowJoinSquadModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<ProfileModalUser | null>(null);
  const [editingSquad, setEditingSquad] = useState<(Squad & { memberAvatars: string[] }) | null>(null);
  const [processingSquadId, setProcessingSquadId] = useState<string | null>(null);

  // Live data
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [squads, setSquads] = useState<(Squad & { memberAvatars: string[] })[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<{ callsign: string; avatarUrl?: string }[]>([]);
  const [challengesLoaded, setChallengesLoaded] = useState(false);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Load challenges
  useEffect(() => {
    getActiveChallenges()
      .then((c) => { setChallenges(c); setChallengesLoaded(true); })
      .catch(() => setChallengesLoaded(true));
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
              .map((m) => m.avatarUrl || "");
            return { ...s, memberAvatars: avatars };
          })
        );
        setSquads(enriched);
      })
      .catch(console.warn);
  }, [user, refreshKey]);

  // Check which challenges user has joined + sync their profile to participant docs
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
    // Keep participant docs in sync with current avatar/callsign
    getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${user.uid}`)
      .then((profile) => {
        if (profile) syncParticipantProfile(user.uid, profile.callsign ?? "", profile.avatarUrl ?? "");
      })
      .catch(console.warn);
  }, [user, challenges]);

  // Load active operators from challenge participant docs (publicly readable)
  useEffect(() => {
    if (challenges.length === 0) return;
    Promise.all(
      challenges.map((c) =>
        queryCollection<{ callsign?: string; avatarUrl?: string }>(
          `challenges/${c.id}/participants`,
          [limit(20)]
        ).catch(() => [] as { callsign?: string; avatarUrl?: string }[])
      )
    ).then((results) => {
      const seen = new Set<string>();
      const operators: { callsign: string; avatarUrl?: string }[] = [];
      for (const participants of results) {
        for (const p of participants) {
          if (p.callsign && !seen.has(p.callsign)) {
            seen.add(p.callsign);
            operators.push({ callsign: p.callsign, avatarUrl: p.avatarUrl });
          }
        }
      }
      setOnlineUsers(operators);
    });
  }, [challenges]);

  const featuredChallenge = challenges[0] ?? null;

  // Calculate user's progress for the featured challenge
  const behaviorState = getBehaviorState();
  const featuredProgress = (() => {
    if (!featuredChallenge) return 0;
    switch (featuredChallenge.targetType) {
      case "consistency": {
        // Use 14d window to match syncChallengeProgress calculation
        const completed14d = (behaviorState as Record<string, unknown>).workoutsCompleted14d as number | undefined ?? behaviorState.workoutsCompletedThisWeek;
        const skipped14d = (behaviorState as Record<string, unknown>).workoutsSkipped14d as number | undefined ?? behaviorState.workoutsSkippedThisWeek;
        const total = completed14d + skipped14d;
        return total > 0 ? Math.round((completed14d / total) * 100) : 0;
      }
      case "streak":
        return Math.min(Math.round((behaviorState.streakDays / featuredChallenge.target) * 100), 100);
      case "workouts":
        return Math.min(Math.round((behaviorState.totalWorkoutsCompleted / featuredChallenge.target) * 100), 100);
      default:
        return 0;
    }
  })();

  if (!challengesLoaded) {
    return (
      <div className="w-full p-6 pb-24 space-y-6">
        <div>
          <SkeletonBlock className="h-3 w-24 mb-2" />
          <SkeletonBlock className="h-7 w-48" />
        </div>
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-5 w-32" />
        <div className="space-y-3">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-32 w-full" />
      </div>
    );
  }

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
        onClick={() => {
          if (joinedChallengeIds.has(featuredChallenge.id)) {
            navigate(`/app/challenges/${featuredChallenge.id}`);
          } else {
            setSelectedChallenge(featuredChallenge);
            setShowJoinModal(true);
          }
        }}
      >
        <Scanline />

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
                  strokeDasharray={`${2 * Math.PI * 28 * (featuredProgress / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="square"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-['JetBrains_Mono',monospace] text-[14px] text-[#ff6600] font-bold">
                  {featuredProgress}%
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
            {joinedChallengeIds.has(featuredChallenge.id) ? `View Progress — ${featuredProgress}%` : "Start the Challenge →"}
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

      {/* Community Operators */}
      {onlineUsers.length > 0 && (
        <div className="border border-white/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Community · {onlineUsers.length} operator{onlineUsers.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <div
                key={u.callsign}
                className="flex items-center gap-2 border border-white/10 px-2.5 py-1.5"
              >
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="size-4 object-cover border border-white/20"
                  />
                ) : (
                  <div className="size-4 bg-white/10 border border-white/20 flex items-center justify-center">
                    <svg className="size-2.5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                    </svg>
                  </div>
                )}
                <span className="font-['JetBrains_Mono',monospace] text-[8px] text-white/70 uppercase tracking-wide">
                  {u.callsign}
                </span>
                <div className="size-1.5 bg-[#ff6600] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Challenges */}
      {challenges.length > 1 && (
        <div className="mb-6">
          <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white uppercase tracking-[2px] mb-4">
            All Challenges
          </div>
          <div className="space-y-3">
            {challenges.map((c) => {
              const joined = joinedChallengeIds.has(c.id);
              const days = daysRemaining(c.endDate);
              const typeLabel = c.targetType === "consistency" ? "Consistency" : c.targetType === "streak" ? "Streak" : "Workouts";
              return (
                <div
                  key={c.id}
                  className={`border p-4 transition-colors ${
                    joined ? "border-[#ff6600]/40 bg-[#ff6600]/5" : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {joined && <div className="size-1.5 bg-[#ff6600]" />}
                        <div className={`font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wider ${
                          joined ? "text-[#ff6600]" : "text-white/40"
                        }`}>
                          {typeLabel} · {days}d left
                        </div>
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[13px] text-white font-bold uppercase mb-1">
                        {c.title}
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/50">
                        {c.description}
                      </div>
                      <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/50 mt-2">
                        {c.participantCount} participant{c.participantCount !== 1 ? "s" : ""} · Target: {c.target}{c.targetType === "consistency" ? "%" : c.targetType === "streak" ? " days" : " sessions"}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {joined ? (
                        <button
                          onClick={() => navigate(`/app/challenges/${c.id}`)}
                          className="border border-[#ff6600] px-3 py-1.5 font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase hover:bg-[#ff6600] hover:text-black transition-colors"
                        >
                          View →
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedChallenge(c); setShowJoinModal(true); }}
                          className="bg-[#ff6600] px-3 py-1.5 font-['JetBrains_Mono',monospace] text-[8px] text-black font-bold uppercase hover:bg-[#ff8833] transition-colors"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          {squads.map((squad) => {
            const isCreator = squad.createdBy === user?.uid;
            return (
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
                        {squad.type} · {squad.memberCount ?? 0} member{(squad.memberCount ?? 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Member Avatars */}
                    <div className="flex items-center -space-x-2 mr-2">
                      {squad.memberAvatars.slice(0, 3).map((avatar, idx) => (
                        <div key={idx} className="size-5 border-2 border-black overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="size-full bg-white/10 flex items-center justify-center">
                              <svg className="size-2.5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {isCreator && (
                      <button
                        onClick={() => setEditingSquad(squad)}
                        className="size-7 border border-white/20 flex items-center justify-center hover:border-[#ff6600] transition-colors"
                        title="Edit squad"
                      >
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                          <path strokeLinecap="square" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path strokeLinecap="square" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!user || processingSquadId) return;
                        if (isCreator) {
                          if (!window.confirm("Delete this squad? This cannot be undone.")) return;
                        } else {
                          if (!window.confirm("Leave this squad?")) return;
                        }
                        setProcessingSquadId(squad.id);
                        try {
                          if (isCreator) {
                            await deleteSquadService(squad.id, user.uid);
                          } else {
                            await leaveSquadService(squad.id, user.uid);
                          }
                          refresh();
                        } catch (err) {
                          console.warn("Failed to update squad:", err);
                        } finally {
                          setProcessingSquadId(null);
                        }
                      }}
                      disabled={processingSquadId === squad.id}
                      className={`size-7 border flex items-center justify-center transition-colors disabled:opacity-30 ${
                        isCreator
                          ? "border-red-500/50 hover:border-red-500 hover:bg-red-500/10"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      title={isCreator ? "Delete squad" : "Leave squad"}
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke={isCreator ? "#ef4444" : "white"} strokeWidth="2">
                        {isCreator ? (
                          <>
                            <path strokeLinecap="square" d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </>
                        ) : (
                          <path strokeLinecap="square" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
      <JoinChallengeModal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setSelectedChallenge(null); }} challenge={selectedChallenge} onJoined={refresh} />
      {/* Join Squad Modal */}
      <JoinSquadModal isOpen={showJoinSquadModal} onClose={() => setShowJoinSquadModal(false)} onJoined={refresh} />
      {/* User Profile Modal */}
      <UserProfileModal isOpen={!!showProfileModal} onClose={() => setShowProfileModal(null)} user={showProfileModal} />
      {/* Edit Squad Modal */}
      <EditSquadModal isOpen={!!editingSquad} onClose={() => setEditingSquad(null)} squad={editingSquad} onUpdated={refresh} />
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !showShareCode) {
      setSquadName("");
      setSquadType("Consistency");
      setShareProgress(true);
      setCreating(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); setShowShareCode(false); }
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

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
      <div className="relative z-10 w-full max-w-md border-2 border-[#ff6600] bg-black p-6 max-h-[90vh] overflow-y-auto">
        <Scanline />

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
                  aria-label="Close"
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
                  aria-label="Close"
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