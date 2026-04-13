import {
  getDocument,
  updateDocument,
  batchWrite,
  queryCollection,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "./firestore";

// ── Types ──────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number; // e.g. 80 for 80% consistency
  targetType: "consistency" | "streak" | "workouts"; // what the target measures
  startDate: string; // ISO date
  endDate: string; // ISO date
  participantCount: number;
  createdBy: string; // uid
  createdAt: unknown;
}

export interface ChallengeParticipant {
  id: string; // uid
  joinedAt: unknown;
  progress: number;
  shareProgress: boolean;
  callsign?: string;
  avatarUrl?: string;
  // Written by syncChallengeProgress — publicly readable stats
  streakDays?: number;
  totalWorkoutsCompleted?: number;
  alignmentScore?: number;
}

// ── Challenge CRUD ─────────────────────────────────────

export async function getActiveChallenges(): Promise<Challenge[]> {
  // Use local date to match how endDate is stored (YYYY-MM-DD local)
  const d = new Date();
  const now = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return queryCollection<Challenge>("challenges", [
    where("endDate", ">=", now),
    orderBy("endDate", "asc"),
  ]);
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  return getDocument<Challenge>(`challenges/${challengeId}`);
}

// ── Participant operations ─────────────────────────────

export async function joinChallenge(
  challengeId: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string,
  avatarUrl?: string
): Promise<void> {
  // Duplicate guard — don't increment participantCount if already joined
  const existing = await getDocument(`challenges/${challengeId}/participants/${uid}`);
  if (existing) return;

  await batchWrite([
    {
      type: "set",
      path: `challenges/${challengeId}/participants/${uid}`,
      data: {
        joinedAt: serverTimestamp(),
        progress: 0,
        shareProgress,
        callsign: callsign ?? "",
        avatarUrl: avatarUrl ?? "",
      },
    },
    {
      type: "update",
      path: `challenges/${challengeId}`,
      data: { participantCount: increment(1) },
    },
  ]);
}

export async function getChallengeParticipants(
  challengeId: string
): Promise<ChallengeParticipant[]> {
  return queryCollection<ChallengeParticipant>(
    `challenges/${challengeId}/participants`,
    [orderBy("progress", "desc")]
  );
}

export async function isParticipant(challengeId: string, uid: string): Promise<boolean> {
  const doc = await getDocument(`challenges/${challengeId}/participants/${uid}`);
  return doc !== null;
}

/** Leave a challenge (participant removes themselves) */
export async function leaveChallenge(challengeId: string, uid: string): Promise<void> {
  await batchWrite([
    { type: "delete", path: `challenges/${challengeId}/participants/${uid}` },
    { type: "update", path: `challenges/${challengeId}`, data: { participantCount: increment(-1) } },
  ]);
}

// ── Progress tracking ────────────────────────────────

/** Get all active challenges a user has joined */
export async function getUserJoinedChallenges(uid: string): Promise<Challenge[]> {
  const active = await getActiveChallenges();
  if (active.length === 0) return [];
  const checks = await Promise.all(
    active.map(c => getDocument(`challenges/${c.id}/participants/${uid}`).then(doc => doc ? c : null))
  );
  return checks.filter((c): c is Challenge => c !== null);
}

/**
 * Sync challenge progress for a user after a workout.
 * Calculates progress based on each challenge's targetType and updates Firestore.
 * Also keeps avatarUrl + callsign current on the participant doc.
 */
export async function syncChallengeProgress(
  uid: string,
  behaviorState: {
    workoutsCompletedThisWeek: number;
    workoutsSkippedThisWeek: number;
    workoutsCompleted14d?: number;
    workoutsSkipped14d?: number;
    streakDays: number;
    totalWorkoutsCompleted: number;
    alignmentScore: number;
  }
): Promise<void> {
  const [joined, profile] = await Promise.all([
    getUserJoinedChallenges(uid),
    getDocument<{ callsign?: string; avatarUrl?: string }>(`users/${uid}`),
  ]);
  if (joined.length === 0) return;

  await Promise.all(joined.map((challenge) => {
    let progress = 0;

    switch (challenge.targetType) {
      case "consistency": {
        const total14d = (behaviorState.workoutsCompleted14d ?? 0) + (behaviorState.workoutsSkipped14d ?? 0);
        progress = total14d > 0
          ? Math.round(((behaviorState.workoutsCompleted14d ?? 0) / total14d) * 100)
          : 0;
        break;
      }
      case "streak":
        progress = Math.min(Math.round((behaviorState.streakDays / challenge.target) * 100), 100);
        break;
      case "workouts":
        progress = Math.min(Math.round((behaviorState.totalWorkoutsCompleted / challenge.target) * 100), 100);
        break;
    }

    // Write progress + public stats + current profile to participant doc (readable by all authenticated users)
    return updateDocument(`challenges/${challenge.id}/participants/${uid}`, {
      progress: Math.min(Math.round(progress), 100),
      streakDays: behaviorState.streakDays,
      totalWorkoutsCompleted: behaviorState.totalWorkoutsCompleted,
      alignmentScore: behaviorState.alignmentScore,
      callsign: profile?.callsign ?? "",
      avatarUrl: profile?.avatarUrl ?? "",
    }).catch(console.warn);
  }));
}

/**
 * Sync the current user's profile (avatarUrl, callsign) to all their challenge participant docs.
 * Call on challenge page load so avatars stay current even without a recent workout.
 */
export async function syncParticipantProfile(
  uid: string,
  callsign: string,
  avatarUrl: string
): Promise<void> {
  const joined = await getUserJoinedChallenges(uid);
  if (joined.length === 0) return;
  await Promise.all(
    joined.map((c) =>
      updateDocument(`challenges/${c.id}/participants/${uid}`, {
        callsign,
        avatarUrl,
      }).catch(console.warn)
    )
  );
}

// ── Helpers ────────────────────────────────────────────

export function daysRemaining(endDate: string): number {
  // Parse end date as local midnight to avoid timezone offset errors
  const [y, m, d] = endDate.split("-").map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59); // end of the end date (local)
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
