import { createElement, lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSkeleton from "./components/LoadingSkeleton";
import RedirectHandler from "./components/RedirectHandler";
import LandingGate from "./components/LandingGate";
import OnboardingLayout from "./components/onboarding/OnboardingLayout";
import OnboardingGuard from "./components/onboarding/OnboardingGuard";
import Splashscreen from "./components/onboarding/Splashscreen";
import Welcome from "./components/onboarding/Welcome";
import Verify from "./components/onboarding/Verify";
import BetaCode from "./components/onboarding/BetaCode";
import CreateProfile from "./components/onboarding/CreateProfile";
import Step1BodyProfile from "./components/onboarding/personalization/Step1BodyProfile";
import Step2Optimization from "./components/onboarding/personalization/Step2Optimization";
import Step3Height from "./components/onboarding/personalization/Step3Height";
import Step4Weight from "./components/onboarding/personalization/Step4Weight";
import Step5GoalWeight from "./components/onboarding/personalization/Step5GoalWeight";
import Step6Constraints from "./components/onboarding/personalization/Step6Constraints";
import Step7SessionTime from "./components/onboarding/personalization/Step7SessionTime";
import Step8Experience from "./components/onboarding/personalization/Step8Experience";
import Step9TrainingFocuses from "./components/onboarding/personalization/Step9TrainingFocuses";
import Step10GymAccess from "./components/onboarding/personalization/Step10GymAccess";
import SportSelection from "./components/onboarding/personalization/SportSelection";
import EquipmentAccess from "./components/onboarding/personalization/EquipmentAccess";
import AgentSelection from "./components/onboarding/personalization/AgentSelection";
import ProgramForging from "./components/onboarding/ProgramForging";

// Lazy-loaded app screens (code splitting)
const Dashboard = lazy(() => import("./components/Dashboard"));
const Progress = lazy(() => import("./components/Progress"));
const Profile = lazy(() => import("./components/Profile"));
const Challenges = lazy(() => import("./components/Challenges"));
const ChallengeDetail = lazy(() => import("./components/ChallengeDetail"));
const AIAgent = lazy(() => import("./components/AIAgent"));
const Notifications = lazy(() => import("./components/Notifications"));

/** Wrap a lazy component in Suspense with the LoadingSkeleton fallback */
function withSuspense(LazyComponent: React.LazyExoticComponent<React.ComponentType>) {
  return function SuspenseWrapper() {
    return createElement(Suspense, { fallback: createElement(LoadingSkeleton) }, createElement(LazyComponent));
  };
}

export const router = createBrowserRouter([
  {
    // Root layout — handles Google redirect routing + auth error display
    Component: RedirectHandler,
    children: [
      // Landing page with auth-aware gate for returning users
      {
        path: "/",
        Component: LandingGate,
      },
      // Onboarding flow
      {
        path: "/onboarding",
        Component: OnboardingLayout,
        children: [
          // Public routes — no auth required
          { index: true, Component: Splashscreen },
          { path: "welcome", Component: Welcome },
          { path: "verify", Component: Verify },

          // Auth-gated onboarding routes — must be signed in
          {
            Component: OnboardingGuard,
            children: [
              { path: "beta", Component: BetaCode },
              { path: "profile", Component: CreateProfile },
              { path: "personalize/1", Component: Step1BodyProfile },
              { path: "personalize/2", Component: Step2Optimization },
              { path: "personalize/3", Component: Step3Height },
              { path: "personalize/4", Component: Step4Weight },
              { path: "personalize/5", Component: Step5GoalWeight },
              { path: "personalize/6", Component: Step6Constraints },
              { path: "personalize/7", Component: Step7SessionTime },
              { path: "personalize/8", Component: Step8Experience },
              { path: "personalize/9", Component: Step9TrainingFocuses },
              { path: "personalize/sport", Component: SportSelection },
              { path: "personalize/equipment", Component: EquipmentAccess },
              { path: "personalize/gym", Component: Step10GymAccess },
              { path: "personalize/agent", Component: AgentSelection },
              { path: "personalize/forging", Component: ProgramForging },
            ],
          },
        ],
      },
      // Main app (authenticated + onboarding complete)
      {
        path: "/app",
        Component: ProtectedRoute,
        children: [
          {
            Component: Root,
            children: [
              { index: true, Component: withSuspense(Dashboard) },
              { path: "progress", Component: withSuspense(Progress) },
              { path: "challenges", Component: withSuspense(Challenges) },
              { path: "challenges/:id", Component: withSuspense(ChallengeDetail) },
              { path: "profile", Component: withSuspense(Profile) },
              { path: "ai-agent", Component: withSuspense(AIAgent) },
              { path: "notifications", Component: withSuspense(Notifications) },
            ],
          },
        ],
      },
    ],
  },
]);
