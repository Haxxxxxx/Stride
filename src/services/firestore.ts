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
import { db, auth, appCheck } from "./firebase";

// Resolved once App Check has a valid token (or gave up trying)
const appCheckReady: Promise<void> = appCheck
  ? import("firebase/app-check").then(({ getToken }) =>
      getToken(appCheck!, false).then(() => {})
    ).catch(() => {})
  : Promise.resolve();

/**
 * Wait for Firebase Auth + App Check to be ready before Firestore operations.
 */
async function ensureAuthReady(): Promise<void> {
  await appCheckReady;

  if (auth.currentUser) {
    await auth.currentUser.getIdToken();
    return;
  }
  // auth.currentUser may be null right after signInWithCustomToken/redirect
  // Wait for onAuthStateChanged to deliver the user
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2000);
    const unsubscribe = auth.onAuthStateChanged((u) => {
      unsubscribe();
      clearTimeout(timeout);
      if (u) {
        u.getIdToken().then(resolve).catch(resolve);
      } else {
        resolve();
      }
    });
  });
}

// Generic typed get (may return cached data with persistence enabled)
export async function getDocument<T = DocumentData>(path: string): Promise<T | null> {
  await ensureAuthReady();
  const snap = await getDoc(doc(db, path));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

// Force a server read — bypasses persistent cache. Use after server-side writes (Cloud Functions).
export async function getDocumentFresh<T = DocumentData>(path: string): Promise<T | null> {
  await ensureAuthReady();
  const snap = await getDocFromServer(doc(db, path));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

// Generic typed set (merge by default)
export async function setDocument(path: string, data: DocumentData, merge = true) {
  await ensureAuthReady();
  return setDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() }, { merge });
}

// Generic typed update
export async function updateDocument(path: string, data: DocumentData) {
  await ensureAuthReady();
  return updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
}

// Delete
export async function deleteDocument(path: string) {
  await ensureAuthReady();
  return deleteDoc(doc(db, path));
}

// Query a collection with constraints
export async function queryCollection<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  await ensureAuthReady();
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
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
  }, (err) => {
    console.warn(`[Firestore] subscribeToDocument error (${path}):`, err.message);
  });
}

// Real-time collection listener with change detection (prevents unnecessary re-renders)
export function subscribeToCollection<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, path), ...constraints);
  let lastJson = "";
  // Normalize Firestore Timestamps to seconds for stable JSON comparison
  const replacer = (_: string, v: unknown) =>
    v && typeof v === 'object' && 'seconds' in v && 'nanoseconds' in v ? (v as {seconds: number}).seconds : v;
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    const json = JSON.stringify(data, replacer);
    if (json !== lastJson) {
      lastJson = json;
      callback(data);
    }
  }, (err) => {
    console.warn(`[Firestore] subscribeToCollection error (${path}):`, err.message);
  });
}

// Ensure a user doc exists with sensible defaults — only creates if doc is missing.
// Uses a server read to avoid race with Cloud Functions that may have just created the doc.
export async function ensureUserDoc(uid: string, extra?: Record<string, unknown>): Promise<void> {
  await ensureAuthReady();
  const ref = doc(db, `users/${uid}`);
  let exists = false;
  try {
    const snap = await getDocFromServer(ref);
    exists = snap.exists();
  } catch {
    const snap = await getDoc(ref);
    exists = snap.exists();
  }
  if (!exists) {
    await setDoc(ref, {
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      ...extra,
    }, { merge: true });
  } else if (extra && Object.keys(extra).length > 0) {
    await setDoc(ref, { ...extra, updatedAt: serverTimestamp() }, { merge: true });
  }
}

// Atomic batch write — all-or-nothing for multiple document operations
// Automatically chunks into multiple batches if operations exceed Firestore's 500-op limit
export async function batchWrite(
  operations: Array<{
    type: "set" | "update" | "delete";
    path: string;
    data?: DocumentData;
    merge?: boolean;
  }>
): Promise<void> {
  await ensureAuthReady();
  const { writeBatch } = await import("firebase/firestore");
  const BATCH_LIMIT = 499;
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const chunk = operations.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const op of chunk) {
      const ref = doc(db, op.path);
      if (op.type === "delete") {
        batch.delete(ref);
      } else if (op.type === "set") {
        batch.set(ref, { ...op.data!, updatedAt: serverTimestamp() }, { merge: op.merge ?? true });
      } else {
        batch.update(ref, { ...op.data!, updatedAt: serverTimestamp() });
      }
    }
    await batch.commit();
  }
}

// Re-export constraint builders for convenience
export { where, orderBy, limit, serverTimestamp };
export { increment, arrayUnion, arrayRemove } from "firebase/firestore";
