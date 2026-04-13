import type { NavigateFunction } from "react-router";
import { getDocumentFresh, ensureUserDoc } from "../../services/firestore";
import { auth } from "../../services/firebase";

/**
 * Central post-auth routing logic.
 * Ensures a user doc exists, then navigates to the correct destination:
 * - onboardingComplete → /app
 * - betaValidated → /onboarding/profile
 * - default → /onboarding/beta
 *
 * Uses server reads (not cache) to avoid stale betaValidated/onboardingComplete.
 * Retries once after a short delay if Firestore rejects due to auth token propagation lag.
 */
export async function routeAfterAuth(uid: string, navigate: NavigateFunction): Promise<void> {
  const attempt = async () => {
    // Force a fresh token so Firestore picks up the auth state
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    await ensureUserDoc(uid);
    return getDocumentFresh<{ onboardingComplete?: boolean; betaValidated?: boolean }>(
      `users/${uid}`
    );
  };

  try {
    let userDoc: { onboardingComplete?: boolean; betaValidated?: boolean } | null;
    try {
      userDoc = await attempt();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      // Firestore/App Check may need time to settle — retry with backoff
      if (code === "permission-denied" || String(err).includes("permissions")) {
        for (const delay of [1500, 3000]) {
          await new Promise((r) => setTimeout(r, delay));
          try { userDoc = await attempt(); break; } catch { /* continue */ }
        }
      } else {
        throw err;
      }
    }

    if (userDoc?.onboardingComplete) {
      navigate("/app", { replace: true });
      return;
    }
    if (userDoc?.betaValidated) {
      navigate("/onboarding/profile", { replace: true });
      return;
    }
  } catch (err) {
    console.error("routeAfterAuth failed:", err);
  }
  navigate("/onboarding/beta", { replace: true });
}
