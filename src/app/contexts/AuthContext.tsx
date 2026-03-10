import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthChange, checkRedirectResult } from "../../services/auth";
import { setAuthUid, syncFromFirestore } from "../utils/behaviorStore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** User returned from a Google redirect flow (needs routing) */
  pendingRedirectUser: User | null;
  /** Error from redirect auth (e.g. Google sign-in failure) */
  authError: string | null;
  clearPendingRedirect: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  pendingRedirectUser: null,
  authError: null,
  clearPendingRedirect: () => {},
  clearAuthError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRedirectUser, setPendingRedirectUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let redirectDone = false;
    const timers: { polls: ReturnType<typeof setInterval>[]; timeouts: ReturnType<typeof setTimeout>[] } = {
      polls: [],
      timeouts: [],
    };

    checkRedirectResult()
      .then((result) => {
        if (result?.user) {
          setPendingRedirectUser(result.user);
        }
      })
      .catch((err: unknown) => {
        const firebaseErr = err as { message?: string; code?: string };
        const message = firebaseErr.message || "Authentication redirect failed";
        console.error("Redirect auth error:", firebaseErr.code, message);
        setAuthError(message);
      })
      .finally(() => {
        redirectDone = true;
      });

    const unsubscribe = onAuthChange((u) => {
      setUser(u);

      // Wire behaviorStore to Firestore sync — getIdToken ensures the auth
      // token is ready before any Firestore reads (ensureAuthReady in firestore.ts
      // handles this too, but belt-and-suspenders for the behavior store).
      setAuthUid(u?.uid ?? null);
      if (u) {
        u.getIdToken()
          .then(() => syncFromFirestore(u.uid))
          .catch(console.warn);
      }

      if (redirectDone) {
        setLoading(false);
      } else {
        const poll = setInterval(() => {
          if (redirectDone) {
            setLoading(false);
            clearInterval(poll);
          }
        }, 50);
        timers.polls.push(poll);
        const safety = setTimeout(() => {
          clearInterval(poll);
          setLoading(false);
        }, 3000);
        timers.timeouts.push(safety);
      }
    });

    return () => {
      unsubscribe();
      timers.polls.forEach(clearInterval);
      timers.timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingRedirectUser,
        authError,
        clearPendingRedirect: () => setPendingRedirectUser(null),
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
