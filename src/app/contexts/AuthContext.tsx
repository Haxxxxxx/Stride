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
    // Track all timer handles for cleanup on unmount
    const timers: { polls: ReturnType<typeof setInterval>[]; timeouts: ReturnType<typeof setTimeout>[] } = {
      polls: [],
      timeouts: [],
    };

    // Handle Google redirect result FIRST, then start auth listener.
    // This prevents onAuthChange from setting loading=false before redirect is processed.
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

      // Wire behaviorStore to Firestore sync
      setAuthUid(u?.uid ?? null);
      if (u) {
        syncFromFirestore(u.uid).catch(console.warn);
      }

      // Only clear loading after redirect check is done to prevent
      // LandingGate/RedirectHandler from racing with each other
      if (redirectDone) {
        setLoading(false);
      } else {
        // onAuthChange fired before redirect resolved — wait for it
        const poll = setInterval(() => {
          if (redirectDone) {
            setLoading(false);
            clearInterval(poll);
          }
        }, 50);
        timers.polls.push(poll);
        // Safety: clear loading after 3s max regardless
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
