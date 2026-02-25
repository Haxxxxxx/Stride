import {
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  where,
  orderBy,
  serverTimestamp,
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
}

// ── Challenge CRUD ─────────────────────────────────────

export async function getChallenges(): Promise<Challenge[]> {
  return queryCollection<Challenge>("challenges", [orderBy("createdAt", "desc")]);
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const now = new Date().toISOString().split("T")[0];
  return queryCollection<Challenge>("challenges", [
    where("endDate", ">=", now),
    orderBy("endDate", "asc"),
  ]);
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  return getDocument<Challenge>(`challenges/${challengeId}`);
}

export async function createChallenge(
  data: Omit<Challenge, "id" | "createdAt" | "participantCount">
): Promise<string> {
  const id = crypto.randomUUID().split("-")[0];
  await setDocument(`challenges/${id}`, {
    ...data,
    participantCount: 0,
    createdAt: serverTimestamp(),
  });
  return id;
}

// ── Participant operations ─────────────────────────────

export async function joinChallenge(
  challengeId: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string
): Promise<void> {
  // Add participant
  await setDocument(`challenges/${challengeId}/participants/${uid}`, {
    joinedAt: serverTimestamp(),
    progress: 0,
    shareProgress,
    callsign: callsign ?? "",
  });

  // Increment participant count
  const challenge = await getChallenge(challengeId);
  if (challenge) {
    await updateDocument(`challenges/${challengeId}`, {
      participantCount: (challenge.participantCount || 0) + 1,
    });
  }
}

export async function leaveChallenge(challengeId: string, uid: string): Promise<void> {
  await deleteDocument(`challenges/${challengeId}/participants/${uid}`);

  const challenge = await getChallenge(challengeId);
  if (challenge && challenge.participantCount > 0) {
    await updateDocument(`challenges/${challengeId}`, {
      participantCount: challenge.participantCount - 1,
    });
  }
}

export async function getChallengeParticipants(
  challengeId: string
): Promise<ChallengeParticipant[]> {
  return queryCollection<ChallengeParticipant>(
    `challenges/${challengeId}/participants`,
    [orderBy("progress", "desc")]
  );
}

export async function updateParticipantProgress(
  challengeId: string,
  uid: string,
  progress: number
): Promise<void> {
  await updateDocument(`challenges/${challengeId}/participants/${uid}`, { progress });
}

export async function isParticipant(challengeId: string, uid: string): Promise<boolean> {
  const doc = await getDocument(`challenges/${challengeId}/participants/${uid}`);
  return doc !== null;
}

// ── Helpers ────────────────────────────────────────────

export function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isChallengeActive(challenge: Challenge): boolean {
  const now = new Date().toISOString().split("T")[0];
  return challenge.startDate <= now && challenge.endDate >= now;
}
