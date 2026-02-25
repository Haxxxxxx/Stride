import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Dashboard from "./components/Dashboard";
import Progress from "./components/Progress";
import Profile from "./components/Profile";
import Challenges from "./components/Challenges";
import ChallengeDetail from "./components/ChallengeDetail";
import AIAgent from "./components/AIAgent";
import Notifications from "./components/Notifications";
import OnboardingLayout from "./components/onboarding/OnboardingLayout";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: OnboardingLayout,
    children: [
      { index: true, Component: Splashscreen },
      { path: "onboarding/welcome", Component: Welcome },
      { path: "onboarding/verify", Component: Verify },
      { path: "onboarding/beta", Component: BetaCode },
      { path: "onboarding/profile", Component: CreateProfile },
      { path: "onboarding/personalize/1", Component: Step1BodyProfile },
      { path: "onboarding/personalize/2", Component: Step2Optimization },
      { path: "onboarding/personalize/3", Component: Step3Height },
      { path: "onboarding/personalize/4", Component: Step4Weight },
      { path: "onboarding/personalize/5", Component: Step5GoalWeight },
      { path: "onboarding/personalize/6", Component: Step6Constraints },
      { path: "onboarding/personalize/7", Component: Step7SessionTime },
      { path: "onboarding/personalize/8", Component: Step8Experience },
      { path: "onboarding/personalize/9", Component: Step9TrainingFocuses },
      { path: "onboarding/personalize/10", Component: Step10GymAccess },
      { path: "onboarding/personalize/sport", Component: SportSelection },
      { path: "onboarding/personalize/equipment", Component: EquipmentAccess },
      { path: "onboarding/personalize/gym", Component: Step10GymAccess },
      { path: "onboarding/personalize/agent", Component: AgentSelection },
      { path: "onboarding/personalize/forging", Component: ProgramForging },
    ],
  },
  {
    path: "/app",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "progress", Component: Progress },
      { path: "challenges", Component: Challenges },
      { path: "challenges/:id", Component: ChallengeDetail },
      { path: "profile", Component: Profile },
      { path: "ai-agent", Component: AIAgent },
      { path: "notifications", Component: Notifications },
    ],
  },
]);