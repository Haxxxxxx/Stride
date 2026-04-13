import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getDocument } from "../../services/firestore";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [betaValidated, setBetaValidated] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getDocument<{ onboardingComplete?: boolean; betaValidated?: boolean }>(`users/${user.uid}`)
      .then((doc) => {
        if (cancelled) return;
        setOnboardingComplete(doc?.onboardingComplete === true);
        setBetaValidated(doc?.betaValidated === true);
        setOnboardingChecked(true);
      })
      .catch(() => {
        if (!cancelled) setOnboardingChecked(true);
      });

    return () => { cancelled = true; };
  }, [user?.uid]);

  if (loading || (user && !onboardingChecked)) {
    return (
      <div className="bg-black w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {timedOut ? (
            <>
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
                Connection issue
              </div>
              <button
                onClick={() => window.location.reload()}
                className="border border-white/20 px-6 py-2 font-['JetBrains_Mono',monospace] text-[10px] text-white uppercase tracking-wider hover:border-[#ff6600] transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="size-3 bg-[#ff6600] animate-pulse" />
              <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px]">
                Initializing System...
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  if (!betaValidated) {
    return <Navigate to="/onboarding/beta" replace />;
  }

  if (!onboardingComplete) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}
