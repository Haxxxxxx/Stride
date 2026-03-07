import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { routeAfterAuth } from "../utils/routeAfterAuth";

/**
 * Root layout wrapper that handles:
 * 1. Google redirect auth completion (Bug 7) — routes the user after redirect sign-in
 * 2. Displays auth errors from redirect flow (Bug 6)
 *
 * Mounted at the router root so it's always present regardless of which route loaded.
 */
export default function RedirectHandler() {
  const { pendingRedirectUser, authError, clearPendingRedirect, clearAuthError } = useAuth();
  const navigate = useNavigate();

  // When a Google redirect completes, route the user to the right place
  useEffect(() => {
    if (!pendingRedirectUser) return;
    const uid = pendingRedirectUser.uid;
    clearPendingRedirect();
    routeAfterAuth(uid, navigate).catch(console.error);
  }, [pendingRedirectUser]);

  // Auto-dismiss auth error after 5 seconds
  useEffect(() => {
    if (!authError) return;
    const t = setTimeout(clearAuthError, 5000);
    return () => clearTimeout(t);
  }, [authError]);

  return (
    <>
      {authError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-full px-4">
          <div className="bg-red-900/90 border border-red-500/50 px-4 py-3 font-['JetBrains_Mono',monospace] text-[10px] text-white flex items-center justify-between gap-2">
            <span>{authError}</span>
            <button onClick={clearAuthError} className="text-white/60 hover:text-white shrink-0">
              &times;
            </button>
          </div>
        </div>
      )}
      <Outlet />
    </>
  );
}
