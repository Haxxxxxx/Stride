import { createElement, lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSkeleton from "./components/LoadingSkeleton";
import RedirectHandler from "./components/RedirectHandler";
import LandingGate from "./components/LandingGate";
import OnboardingLayout from "./components/onboarding/OnboardingLayout";
import OnboardingGuard from "./components/onboarding/OnboardingGuard";

// Lazy-loaded onboarding screens (code splitting)
const Splashscreen = lazy(() => import("./components/onboarding/Splashscreen"));
const Welcome = lazy(() => import("./components/onboarding/Welcome"));
const Verify = lazy(() => import("./components/onboarding/Verify"));
const BetaCode = lazy(() => import("./components/onboarding/BetaCode"));
const CreateProfile = lazy(() => import("./components/onboarding/CreateProfile"));
const Step1BodyProfile = lazy(() => import("./components/onboarding/personalization/Step1BodyProfile"));
const Step2Optimization = lazy(() => import("./components/onboarding/personalization/Step2Optimization"));
const Step3Height = lazy(() => import("./components/onboarding/personalization/Step3Height"));
const Step4Weight = lazy(() => import("./components/onboarding/personalization/Step4Weight"));
const Step5GoalWeight = lazy(() => import("./components/onboarding/personalization/Step5GoalWeight"));
const Step6Constraints = lazy(() => import("./components/onboarding/personalization/Step6Constraints"));
const Step7SessionTime = lazy(() => import("./components/onboarding/personalization/Step7SessionTime"));
const Step8Experience = lazy(() => import("./components/onboarding/personalization/Step8Experience"));
const Step9TrainingFocuses = lazy(() => import("./components/onboarding/personalization/Step9TrainingFocuses"));
const Step10GymAccess = lazy(() => import("./components/onboarding/personalization/Step10GymAccess"));
const SportSelection = lazy(() => import("./components/onboarding/personalization/SportSelection"));
const EquipmentAccess = lazy(() => import("./components/onboarding/personalization/EquipmentAccess"));
const AgentSelection = lazy(() => import("./components/onboarding/personalization/AgentSelection"));
const ProgramForging = lazy(() => import("./components/onboarding/ProgramForging"));

// Lazy-loaded app screens (code splitting)
const Dashboard = lazy(() => import("./components/Dashboard"));
const Progress = lazy(() => import("./components/Progress"));
const Profile = lazy(() => import("./components/Profile"));
const Challenges = lazy(() => import("./components/Challenges"));
const ChallengeDetail = lazy(() => import("./components/ChallengeDetail"));
const AIAgent = lazy(() => import("./components/AIAgent"));
const Notifications = lazy(() => import("./components/Notifications"));
const NotFound = lazy(() => import("./components/NotFound"));

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
          { index: true, Component: withSuspense(Splashscreen) },
          { path: "welcome", Component: withSuspense(Welcome) },
          { path: "verify", Component: withSuspense(Verify) },

          // Auth-gated onboarding routes — must be signed in
          {
            Component: OnboardingGuard,
            children: [
              { path: "beta", Component: withSuspense(BetaCode) },
              { path: "profile", Component: withSuspense(CreateProfile) },
              { path: "personalize/1", Component: withSuspense(Step1BodyProfile) },
              { path: "personalize/2", Component: withSuspense(Step2Optimization) },
              { path: "personalize/3", Component: withSuspense(Step3Height) },
              { path: "personalize/4", Component: withSuspense(Step4Weight) },
              { path: "personalize/5", Component: withSuspense(Step5GoalWeight) },
              { path: "personalize/6", Component: withSuspense(Step6Constraints) },
              { path: "personalize/7", Component: withSuspense(Step7SessionTime) },
              { path: "personalize/8", Component: withSuspense(Step8Experience) },
              { path: "personalize/9", Component: withSuspense(Step9TrainingFocuses) },
              { path: "personalize/sport", Component: withSuspense(SportSelection) },
              { path: "personalize/equipment", Component: withSuspense(EquipmentAccess) },
              { path: "personalize/gym", Component: withSuspense(Step10GymAccess) },
              { path: "personalize/agent", Component: withSuspense(AgentSelection) },
              { path: "personalize/forging", Component: withSuspense(ProgramForging) },
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
      // 404 catch-all
      {
        path: "*",
        Component: withSuspense(NotFound),
      },
    ],
  },
]);
