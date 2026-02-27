import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Guards onboarding routes that require authentication (beta code, profile, personalization).
 * If user isn't authenticated, redirects back to Welcome.
 */
export default function OnboardingGuard() {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
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

  return <Outlet />;
}
