// Helper functions to calculate dynamic step numbers in onboarding flow

export function getTotalSteps(): number {
  const hasFatLoss = localStorage.getItem('optimizationGoal') === 'fat-loss';
  const hasSport = localStorage.getItem('hasSportFocus') === 'true';
  
  // Base steps: 1-4, 6-9 = 8 steps
  // Optional: Step 5 (Goal Weight) if fat loss
  // Optional: Sport Selection if sport focus selected
  // Always: Equipment Access + Gym Access + Agent Selection = 3 steps
  
  let total = 8; // base steps
  if (hasFatLoss) total += 1; // Goal Weight
  if (hasSport) total += 1; // Sport Selection
  total += 3; // Equipment Access + Gym Access + Agent Selection
  
  return total;
}

export function getCurrentStepNumber(basestep: number): number {
  const hasFatLoss = localStorage.getItem('optimizationGoal') === 'fat-loss';
  const hasSport = localStorage.getItem('hasSportFocus') === 'true';
  
  // Adjust step number based on conditional steps that came before
  let adjustedStep = basestep;
  
  // If we're past step 5 and fat loss wasn't selected, subtract 1
  if (basestep > 5 && !hasFatLoss) {
    adjustedStep -= 1;
  }
  
  // If we're past the sport selection step and sport wasn't selected, subtract 1
  if (basestep > 10 && !hasSport) {
    adjustedStep -= 1;
  }
  
  return adjustedStep;
}