import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { getDocumentFresh } from "../../../services/firestore";

// Module-level flag — persists across mount/unmount cycles.
// Once beta is confirmed, we never need to re-check.
let confirmedBetaValidated = false;

/**
 * Guards onboarding routes that require authentication.
 * Also enforces beta gate — routes beyond /onboarding/beta require betaValidated.
 *
 * This is the SINGLE source of truth for onboarding routing.
 * BetaCode.tsx should NOT navigate on its own for skip checks — only after
 * the user explicitly enters a code.
 */
export default function OnboardingGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const [checkState, setCheckState] = useState<"pending" | "done">(
    confirmedBetaValidated ? "done" : "pending"
  );

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const isBetaRoute = location.pathname === "/onboarding/beta";

  // Check beta status once per session. The result is cached at module level
  // so re-mounts (from navigation) don't re-fetch or lose state.
  useEffect(() => {
    if (!user || confirmedBetaValidated) {
      setCheckState("done");
      return;
    }
    if (isBetaRoute) {
      setCheckState("done");
      return;
    }

    // Fetch from server — don't use persistent cache
    let active = true;
    getDocumentFresh<{ betaValidated?: boolean }>(`users/${user.uid}`)
      .then((doc) => {
        if (!active) return;
        if (doc?.betaValidated === true) {
          confirmedBetaValidated = true;
        }
        setCheckState("done");
      })
      .catch(() => {
        // On error, still mark done — will redirect to beta (fail-closed)
        if (active) setCheckState("done");
      });

    return () => { active = false; };
  }, [user?.uid, isBetaRoute]);

  // Show loading while checking (but not on the beta route itself)
  if (loading || (user && !isBetaRoute && checkState === "pending")) {
    return (
      <div className="bg-black w-full h-full flex items-center justify-center">
        {timedOut ? (
          <div className="flex flex-col items-center gap-4">
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
              Connection issue
            </div>
            <button
              onClick={() => window.location.reload()}
              className="border border-white/20 px-6 py-2 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="size-3 bg-[#ff6600] animate-pulse" />
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  // If on beta route but already validated → skip to profile
  if (isBetaRoute && confirmedBetaValidated) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  // If NOT on beta route and NOT validated → go to beta
  if (!isBetaRoute && !confirmedBetaValidated) {
    return <Navigate to="/onboarding/beta" replace />;
  }

  return <Outlet />;
}

/** Call this after successfully validating a beta code to update the guard state */
export function markBetaValidated() {
  confirmedBetaValidated = true;
}
