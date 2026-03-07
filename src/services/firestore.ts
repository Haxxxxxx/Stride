import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic typed get (may return cached data with persistence enabled)
export async function getDocument<T = DocumentData>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

// Force a server read — bypasses persistent cache. Use after server-side writes (Cloud Functions).
export async function getDocumentFresh<T = DocumentData>(path: string): Promise<T | null> {
  const snap = await getDocFromServer(doc(db, path));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

// Generic typed set (merge by default)
export async function setDocument(path: string, data: DocumentData, merge = true) {
  return setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() }, { merge });
}

// Generic typed update
export async function updateDocument(path: string, data: DocumentData) {
  return updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
}

// Delete
export async function deleteDocument(path: string) {
  return deleteDoc(doc(db, path));
}

// Query a collection with constraints
export async function queryCollection<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// Real-time listener
export function subscribeToDocument<T = DocumentData>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, path), (snap) => {
    callback(snap.exists() ? (snap.data() as T) : null);
  });
}

// Ensure a user doc exists with sensible defaults — only creates if doc is missing
export async function ensureUserDoc(uid: string, extra?: Record<string, unknown>): Promise<void> {
  const ref = doc(db, `users/${uid}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      ...extra,
    });
  } else if (extra && Object.keys(extra).length > 0) {
    await setDoc(ref, { ...extra, updatedAt: serverTimestamp() }, { merge: true });
  }
}

// Atomic batch write — all-or-nothing for multiple document operations
export async function batchWrite(
  operations: Array<{
    type: "set" | "update";
    path: string;
    data: DocumentData;
    merge?: boolean;
  }>
): Promise<void> {
  const { writeBatch } = await import("firebase/firestore");
  const batch = writeBatch(db);
  for (const op of operations) {
    const ref = doc(db, op.path);
    if (op.type === "set") {
      batch.set(ref, { ...op.data, updatedAt: serverTimestamp() }, { merge: op.merge ?? true });
    } else {
      batch.update(ref, { ...op.data, updatedAt: serverTimestamp() });
    }
  }
  await batch.commit();
}

// Re-export constraint builders for convenience
export { where, orderBy, limit, serverTimestamp };
export { increment, arrayUnion, arrayRemove } from "firebase/firestore";
