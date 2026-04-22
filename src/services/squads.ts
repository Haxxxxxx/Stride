import {
  getDocument,
  updateDocument,
  batchWrite,
  queryCollection,
  where,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
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

  // Self-heal: prune stale squadIds (deleted squads) to prevent monotonic growth
  const foundIds = new Set(squads.map(s => s.id));
  const staleIds = squadIds.filter(id => !foundIds.has(id));
  if (staleIds.length > 0) {
    updateDocument(`users/${uid}`, { squadIds: arrayRemove(...staleIds) }).catch(() => {});
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
  // Duplicate guard — matches joinChallenge pattern. Prevents memberCount
  // double-increments if this is called twice (retry after network error,
  // cross-tab race, etc.). The member doc itself is idempotent via merge=true,
  // but the increment isn't.
  const existing = await getDocument(`squads/${squadId}/members/${uid}`);
  if (existing) return;

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
): Promise<{ success: boolean; squadId?: string; squadName?: string; error?: string }> {
  const squad = await getSquadByCode(code);
  if (!squad) return { success: false, error: "Invalid squad code" };

  const alreadyMember = await isMember(squad.id, uid);
  if (alreadyMember) return { success: false, error: "Already a member" };

  await joinSquad(squad.id, uid, shareProgress, callsign, avatarUrl);
  return { success: true, squadId: squad.id, squadName: squad.name };
}

// ── Leave / Delete / Update ──────────────────────────

/** Leave a squad (member removes themselves) */
export async function leaveSquad(squadId: string, uid: string): Promise<void> {
  await batchWrite([
    { type: "delete", path: `squads/${squadId}/members/${uid}` },
    { type: "update", path: `squads/${squadId}`, data: { memberCount: increment(-1) } },
    { type: "update", path: `users/${uid}`, data: { squadIds: arrayRemove(squadId) } },
  ]);
}

/** Delete a squad (creator only).
 *  Firestore rules only allow users to delete their OWN member doc,
 *  so the creator can only clean up their own membership + the squad doc.
 *  Other members' member docs become orphaned and are handled gracefully:
 *  - getUserSquads will return "squad not found" for the deleted squad
 *  - The orphaned member docs have no security impact (read-only for others)
 */
export async function deleteSquad(squadId: string, uid: string): Promise<void> {
  const ops: Parameters<typeof batchWrite>[0] = [];

  // Clean up creator's own membership (rules allow: request.auth.uid == uid)
  ops.push({ type: "update", path: `users/${uid}`, data: { squadIds: arrayRemove(squadId) } });
  ops.push({ type: "delete", path: `squads/${squadId}/members/${uid}` });

  // Delete the squad doc (rules allow: resource.data.createdBy == request.auth.uid)
  ops.push({ type: "delete", path: `squads/${squadId}` });

  await batchWrite(ops);
}

/** Update squad name/type (creator only) */
export async function updateSquadInfo(
  squadId: string,
  updates: { name?: string; type?: string }
): Promise<void> {
  await updateDocument(`squads/${squadId}`, updates);
}
