import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { routeAfterAuth } from "../utils/routeAfterAuth";
import LandingPage from "./website/LandingPage";

/**
 * Gate for the "/" route.
 * - If auth is loading → render nothing (black screen, no flash)
 * - If user is signed in → route to /app, /onboarding/profile, or /onboarding/beta
 * - If no user → render the public LandingPage
 */
export default function LandingGate() {
  const { user, loading, pendingRedirectUser } = useAuth();
  const navigate = useNavigate();
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (loading || !user || pendingRedirectUser) return;
    setRouting(true);
    routeAfterAuth(user.uid, navigate).catch(console.error);
  }, [user, loading, pendingRedirectUser]);

  // Show nothing while auth is resolving or we're routing away
  if (loading || routing) {
    return <div className="bg-black w-full min-h-screen" />;
  }

  // No user — show the public landing page
  return <LandingPage />;
}
