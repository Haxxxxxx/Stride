import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { getDocumentFresh } from "../../../services/firestore";

/**
 * Guards onboarding routes that require authentication.
 * Also enforces beta gate — routes beyond /onboarding/beta require betaValidated.
 */
export default function OnboardingGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const [betaValidated, setBetaValidated] = useState(false);
  // Track which pathname was last successfully checked
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const isBetaRoute = location.pathname === "/onboarding/beta";

  useEffect(() => {
    if (!user) return;
    if (isBetaRoute) {
      setCheckedPath(location.pathname);
      return;
    }

    let cancelled = false;
    getDocumentFresh<{ betaValidated?: boolean }>(`users/${user.uid}`)
      .then((doc) => {
        if (cancelled) return;
        setBetaValidated(doc?.betaValidated === true);
        setCheckedPath(location.pathname);
      })
      .catch(() => {
        if (!cancelled) setCheckedPath(location.pathname);
      });
    return () => { cancelled = true; };
  }, [user?.uid, location.pathname]);

  // True only when we've completed a check for this exact path
  const betaChecked = checkedPath === location.pathname;

  if (loading || (user && !isBetaRoute && !betaChecked)) {
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

  if (!isBetaRoute && !betaValidated) {
    return <Navigate to="/onboarding/beta" replace />;
  }

  return <Outlet />;
}
