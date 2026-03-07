import {
  getDocument,
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
}

// ── Challenge CRUD ─────────────────────────────────────

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

// ── Participant operations ─────────────────────────────

export async function joinChallenge(
  challengeId: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string
): Promise<void> {
  await batchWrite([
    {
      type: "set",
      path: `challenges/${challengeId}/participants/${uid}`,
      data: {
        joinedAt: serverTimestamp(),
        progress: 0,
        shareProgress,
        callsign: callsign ?? "",
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

// ── Helpers ────────────────────────────────────────────

export function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

