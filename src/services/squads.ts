import {
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "./firestore";

// ── Types ──────────────────────────────────────────────

export interface Squad {
  id: string;
  name: string;
  type: string; // "Consistency" | "Strength" | "Endurance" | "Volume" | "General"
  code: string; // SQD-XXXXXX
  createdBy: string; // uid
  createdAt: unknown;
  memberCount: number;
}

export interface SquadMember {
  id: string; // uid
  joinedAt: unknown;
  role: "leader" | "member";
  shareProgress: boolean;
  callsign?: string;
  avatarUrl?: string;
}

// ── Code generation ────────────────────────────────────

function generateSquadCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SQD-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Squad CRUD ─────────────────────────────────────────

export async function createSquad(
  uid: string,
  name: string,
  type: string,
  shareProgress: boolean,
  callsign?: string,
  avatarUrl?: string
): Promise<{ squadId: string; code: string }> {
  const id = crypto.randomUUID().split("-")[0];
  const code = generateSquadCode();

  await setDocument(`squads/${id}`, {
    name,
    type,
    code,
    createdBy: uid,
    createdAt: serverTimestamp(),
    memberCount: 1,
  });

  // Add creator as leader
  await setDocument(`squads/${id}/members/${uid}`, {
    joinedAt: serverTimestamp(),
    role: "leader",
    shareProgress,
    callsign: callsign ?? "",
    avatarUrl: avatarUrl ?? "",
  });

  return { squadId: id, code };
}

export async function getSquad(squadId: string): Promise<Squad | null> {
  return getDocument<Squad>(`squads/${squadId}`);
}

export async function getSquadByCode(code: string): Promise<Squad | null> {
  const results = await queryCollection<Squad>("squads", [where("code", "==", code)]);
  return results.length > 0 ? results[0] : null;
}

export async function getUserSquads(uid: string): Promise<Squad[]> {
  // Firestore doesn't support collection group queries on subcollections easily
  // so we query all squads and filter client-side, or store squad IDs on the user doc
  // For now, query all squads and check membership
  const allSquads = await queryCollection<Squad>("squads", [orderBy("createdAt", "desc")]);
  const userSquads: Squad[] = [];

  for (const squad of allSquads) {
    const member = await getDocument(`squads/${squad.id}/members/${uid}`);
    if (member) userSquads.push(squad);
  }

  return userSquads;
}

// ── Member operations ──────────────────────────────────

export async function joinSquad(
  squadId: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string,
  avatarUrl?: string
): Promise<void> {
  await setDocument(`squads/${squadId}/members/${uid}`, {
    joinedAt: serverTimestamp(),
    role: "member",
    shareProgress,
    callsign: callsign ?? "",
    avatarUrl: avatarUrl ?? "",
  });

  // Atomically increment member count
  await updateDocument(`squads/${squadId}`, {
    memberCount: increment(1),
  });
}

export async function leaveSquad(squadId: string, uid: string): Promise<void> {
  await deleteDocument(`squads/${squadId}/members/${uid}`);

  // Atomically decrement member count
  await updateDocument(`squads/${squadId}`, {
    memberCount: increment(-1),
  });
}

export async function getSquadMembers(squadId: string): Promise<SquadMember[]> {
  return queryCollection<SquadMember>(`squads/${squadId}/members`, [
    orderBy("joinedAt", "asc"),
  ]);
}

export async function isMember(squadId: string, uid: string): Promise<boolean> {
  const doc = await getDocument(`squads/${squadId}/members/${uid}`);
  return doc !== null;
}

export async function joinSquadByCode(
  code: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string,
  avatarUrl?: string
): Promise<{ success: boolean; squadId?: string; error?: string }> {
  const squad = await getSquadByCode(code);
  if (!squad) return { success: false, error: "Invalid squad code" };

  const alreadyMember = await isMember(squad.id, uid);
  if (alreadyMember) return { success: false, error: "Already a member" };

  await joinSquad(squad.id, uid, shareProgress, callsign, avatarUrl);
  return { success: true, squadId: squad.id };
}
