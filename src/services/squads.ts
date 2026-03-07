import {
  getDocument,
  batchWrite,
  queryCollection,
  where,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
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
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "SQD-";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
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

  await batchWrite([
    {
      type: "set",
      path: `squads/${id}`,
      data: {
        name,
        type,
        code,
        createdBy: uid,
        createdAt: serverTimestamp(),
        memberCount: 1,
      },
    },
    {
      type: "set",
      path: `squads/${id}/members/${uid}`,
      data: {
        joinedAt: serverTimestamp(),
        role: "leader",
        shareProgress,
        callsign: callsign ?? "",
        avatarUrl: avatarUrl ?? "",
      },
    },
    {
      type: "update",
      path: `users/${uid}`,
      data: { squadIds: arrayUnion(id) },
    },
  ]);

  return { squadId: id, code };
}

export async function getSquadByCode(code: string): Promise<Squad | null> {
  const results = await queryCollection<Squad>("squads", [where("code", "==", code)]);
  return results.length > 0 ? results[0] : null;
}

export async function getUserSquads(uid: string): Promise<Squad[]> {
  // Read squad IDs from user doc, then batch-fetch only those squads
  const userDoc = await getDocument<{ squadIds?: string[] }>(`users/${uid}`);
  const squadIds = userDoc?.squadIds ?? [];
  if (squadIds.length === 0) return [];

  // Firestore 'in' queries support up to 30 values
  const squads: Squad[] = [];
  for (let i = 0; i < squadIds.length; i += 30) {
    const batch = squadIds.slice(i, i + 30);
    const results = await queryCollection<Squad>("squads", [where("__name__", "in", batch)]);
    squads.push(...results);
  }

  return squads;
}

// ── Member operations ──────────────────────────────────

export async function joinSquad(
  squadId: string,
  uid: string,
  shareProgress: boolean,
  callsign?: string,
  avatarUrl?: string
): Promise<void> {
  await batchWrite([
    {
      type: "set",
      path: `squads/${squadId}/members/${uid}`,
      data: {
        joinedAt: serverTimestamp(),
        role: "member",
        shareProgress,
        callsign: callsign ?? "",
        avatarUrl: avatarUrl ?? "",
      },
    },
    {
      type: "update",
      path: `squads/${squadId}`,
      data: { memberCount: increment(1) },
    },
    {
      type: "update",
      path: `users/${uid}`,
      data: { squadIds: arrayUnion(squadId) },
    },
  ]);
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
