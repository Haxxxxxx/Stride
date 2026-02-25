import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingState {
  // Pre-personalization
  email: string;
  callsign: string;
  avatarPreview: string | null;

  // Personalization steps
  bodyProfile: "woman" | "man" | null;
  optimizationGoal: "fat-loss" | "general-conditioning" | "strength" | "hypertrophy" | null;
  height: { value: string; unit: "cm" | "ft" };
  weight: { value: string; unit: "kg" | "lb" };
  goalWeight: { value: string; unit: "kg" | "lb" };
  constraints: ("injury" | "time" | "energy" | "equipment" | "none")[];
  sessionTime: "10-20" | "20-40" | "40+" | null;
  experience: "beginner" | "inconsistent" | "intermediate" | "advanced" | null;
  trainingFocuses: ("strength" | "cardio" | "mobility" | "sport")[];
  sportFocus: ("field-court" | "combat" | "track-speed" | "endurance" | "strength" | "general")[];
  equipmentAccess: ("bodyweight" | "dumbbells" | "barbell" | "machines" | "bands" | "cardio" | "field" | "other")[];
  gymAccess: "commercial" | "apartment" | "none" | null;
  selectedAgent: "atlas" | "orion" | "kade" | null;
}

interface OnboardingActions {
  setEmail: (email: string) => void;
  setCallsign: (callsign: string) => void;
  setAvatarPreview: (preview: string | null) => void;
  setBodyProfile: (value: OnboardingState["bodyProfile"]) => void;
  setOptimizationGoal: (value: OnboardingState["optimizationGoal"]) => void;
  setHeight: (value: OnboardingState["height"]) => void;
  setWeight: (value: OnboardingState["weight"]) => void;
  setGoalWeight: (value: OnboardingState["goalWeight"]) => void;
  setConstraints: (value: OnboardingState["constraints"]) => void;
  setSessionTime: (value: OnboardingState["sessionTime"]) => void;
  setExperience: (value: OnboardingState["experience"]) => void;
  setTrainingFocuses: (value: OnboardingState["trainingFocuses"]) => void;
  setSportFocus: (value: OnboardingState["sportFocus"]) => void;
  setEquipmentAccess: (value: OnboardingState["equipmentAccess"]) => void;
  setGymAccess: (value: OnboardingState["gymAccess"]) => void;
  setSelectedAgent: (value: OnboardingState["selectedAgent"]) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  email: "",
  callsign: "",
  avatarPreview: null,
  bodyProfile: null,
  optimizationGoal: null,
  height: { value: "175", unit: "cm" },
  weight: { value: "60.3", unit: "kg" },
  goalWeight: { value: "55", unit: "kg" },
  constraints: [],
  sessionTime: null,
  experience: null,
  trainingFocuses: [],
  sportFocus: [],
  equipmentAccess: [],
  gymAccess: null,
  selectedAgent: null,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      ...initialState,
      setEmail: (email) => set({ email }),
      setCallsign: (callsign) => set({ callsign }),
      setAvatarPreview: (avatarPreview) => set({ avatarPreview }),
      setBodyProfile: (bodyProfile) => set({ bodyProfile }),
      setOptimizationGoal: (optimizationGoal) => set({ optimizationGoal }),
      setHeight: (height) => set({ height }),
      setWeight: (weight) => set({ weight }),
      setGoalWeight: (goalWeight) => set({ goalWeight }),
      setConstraints: (constraints) => set({ constraints }),
      setSessionTime: (sessionTime) => set({ sessionTime }),
      setExperience: (experience) => set({ experience }),
      setTrainingFocuses: (trainingFocuses) => set({ trainingFocuses }),
      setSportFocus: (sportFocus) => set({ sportFocus }),
      setEquipmentAccess: (equipmentAccess) => set({ equipmentAccess }),
      setGymAccess: (gymAccess) => set({ gymAccess }),
      setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
      reset: () => set(initialState),
    }),
    {
      name: "stride-onboarding",
    }
  )
);

// Helper functions that replace onboardingSteps.ts localStorage reads
export function getTotalSteps(state: OnboardingState): number {
  const hasFatLoss = state.optimizationGoal === "fat-loss";
  const hasSport = state.trainingFocuses.includes("sport");

  let total = 8; // base steps (1-4, 6-9)
  if (hasFatLoss) total += 1; // Goal Weight step
  if (hasSport) total += 1; // Sport Selection step
  total += 3; // Equipment + Gym + Agent

  return total;
}

export function getCurrentStepNumber(baseStep: number, state: OnboardingState): number {
  const hasFatLoss = state.optimizationGoal === "fat-loss";
  const hasSport = state.trainingFocuses.includes("sport");

  let adjusted = baseStep;
  if (baseStep > 5 && !hasFatLoss) adjusted -= 1;
  if (baseStep > 10 && !hasSport) adjusted -= 1;

  return adjusted;
}
