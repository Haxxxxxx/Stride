import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthChange, checkRedirectResult } from "../../services/auth";
import { setAuthUid, syncFromFirestore } from "../utils/behaviorStore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Google redirect result (mobile flow)
    checkRedirectResult().catch(console.warn);

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);

      // Wire behaviorStore to Firestore sync
      setAuthUid(u?.uid ?? null);
      if (u) {
        syncFromFirestore(u.uid).catch(console.warn);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
