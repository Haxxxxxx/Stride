import type { NavigateFunction } from "react-router";
import { getDocument, ensureUserDoc } from "../../services/firestore";

/**
 * Central post-auth routing logic.
 * Ensures a user doc exists, then navigates to the correct destination:
 * - onboardingComplete → /app
 * - betaValidated → /onboarding/profile
 * - default → /onboarding/beta
 */
export async function routeAfterAuth(uid: string, navigate: NavigateFunction): Promise<void> {
  try {
    await ensureUserDoc(uid);
    const userDoc = await getDocument<{ onboardingComplete?: boolean; betaValidated?: boolean }>(
      `users/${uid}`
    );
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
