import LandingPage from "./website/LandingPage";

/**
 * Landing page at "/" — always visible regardless of auth state.
 * Logged-in users can navigate to /app via the navbar CTA.
 */
export default function LandingGate() {
  return <LandingPage />;
}
