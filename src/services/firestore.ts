import {
  doc,
  getDoc,
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

// Generic typed get
export async function getDocument<T = DocumentData>(path: string): Promise<T | null> {
  const snap = await getDoc(doc(db, path));
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

// Real-time collection listener
export function subscribeToCollection<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionPath), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
  });
}

// Re-export constraint builders for convenience
export { where, orderBy, limit, serverTimestamp };
export { increment } from "firebase/firestore";
