import { setDocument, serverTimestamp } from "./firestore";

// ── Types ──────────────────────────────────────────────

export type NotificationType = "system" | "achievement" | "challenge" | "milestone";
export type NotificationPriority = "low" | "normal" | "high";

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
}

// ── Create notification ────────────────────────────────

export async function createNotification(
  uid: string,
  data: CreateNotificationData
): Promise<void> {
  const id = crypto.randomUUID().split("-")[0];
  await setDocument(`users/${uid}/notifications/${id}`, {
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority ?? "normal",
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ── Pre-built notification triggers ────────────────────

export async function notifyWorkoutComplete(
  uid: string,
  workoutName: string,
  duration: number
): Promise<void> {
  const mins = Math.round(duration / 60);
  await createNotification(uid, {
    type: "achievement",
    title: "Operation Complete",
    message: `${workoutName} — ${mins}m session logged successfully`,
    priority: "normal",
  });
}

export async function notifyStreakMilestone(
  uid: string,
  streakDays: number
): Promise<void> {
  await createNotification(uid, {
    type: "milestone",
    title: "Streak Milestone",
    message: `${streakDays}-day consecutive training streak achieved`,
    priority: "high",
  });
}

export async function notifyChallengeJoined(
  uid: string,
  challengeTitle: string
): Promise<void> {
  await createNotification(uid, {
    type: "challenge",
    title: "Challenge Accepted",
    message: `You have joined: ${challengeTitle}`,
    priority: "normal",
  });
}

export async function notifySquadJoined(
  uid: string,
  squadName: string
): Promise<void> {
  await createNotification(uid, {
    type: "system",
    title: "Squad Joined",
    message: `You are now a member of ${squadName}`,
    priority: "normal",
  });
}

export async function notifyProgramGenerated(
  uid: string,
  programName: string
): Promise<void> {
  await createNotification(uid, {
    type: "system",
    title: "Protocol Generated",
    message: `New training protocol "${programName}" is ready for deployment`,
    priority: "high",
  });
}

// ── Streak milestone check ─────────────────────────────
// Call after updating streak; fires notification at milestones

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 60, 75, 90, 100, 180, 365];

export function isStreakMilestone(streakDays: number): boolean {
  return STREAK_MILESTONES.includes(streakDays);
}
