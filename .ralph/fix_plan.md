# STRIDE — Fix Plan

## Phase 1: Foundation [MOSTLY COMPLETE]

### 1.1 Zustand onboarding store — DONE
- [x] Create `src/stores/onboardingStore.ts` with all fields, typed setters, persist middleware
- [x] Helper functions `getTotalSteps()` and `getCurrentStepNumber()` in the store
- [x] `onboardingSteps.ts` now re-exports from the store

### 1.2 Wire Welcome → Firebase Auth — DONE
- [x] `Welcome.tsx` calls `signUpWithEmail` / `signInWithEmail` with fallback on `auth/email-already-in-use`
- [x] Google Sign-In button wired to `signInWithGoogle()`
- [x] "Connect Wallet" shows "coming soon" error
- [x] Error display for auth failures
- [x] Email saved to onboardingStore

### 1.3 Verify screen — PARTIAL
- [x] Reads email from onboardingStore
- [ ] **Verify is still a pass-through** — any 6 digits navigates forward. This is acceptable as a placeholder but add a comment marking it as `// TODO: implement real email verification`

### 1.4 BetaCode screen — NOT DONE
- [ ] **BetaCode still accepts any 6 chars** — needs Firestore `betaCodes` validation. Wire it:
  - Import `getDocument`, `updateDocument` from `src/services/firestore.ts`
  - On submit: `getDocument('betaCodes/{code}')` → check `used === false` → `updateDocument('betaCodes/{code}', { used: true, usedBy: uid })`
  - Show error "Invalid or expired code" if doc doesn't exist or already used
  - **ALTERNATIVELY**: if beta codes aren't needed right now, just hardcode a bypass code like "STRIDE" and add a `// TODO: wire to Firestore betaCodes collection` comment

### 1.5 Wire CreateProfile → Firestore — DONE
- [x] `CreateProfile.tsx` uses `useAuth()` and `setDocument()` to save to `users/{uid}`
- [x] Reads callsign/avatar from onboardingStore
- [ ] **Avatar still saved as base64 data URL** — should upload to Firebase Storage and save download URL instead. Low priority, can be Phase 5.

### 1.6 Wire personalization steps to onboarding store — DONE
- [x] All 13 steps (Step1-Step10, SportSelection, EquipmentAccess, AgentSelection) read/write from onboardingStore
- [x] No more localStorage usage for personalization data
- [x] **Step10GymAccess routing bug FIXED** — now navigates to `/onboarding/personalize/agent` instead of `/app`

### 1.7 Save onboarding data to Firestore — DONE
- [x] `ProgramForging.tsx` aggregates all store data and writes to `users/{uid}/personalization/data`
- [x] Marks `users/{uid}.onboardingComplete = true`
- [x] Calls `store.reset()` after save

### 1.8 onboardingSteps.ts updated — DONE
- [x] Re-exports from onboardingStore

### 1.9 Dev Bypass gated — DONE
- [x] `Splashscreen.tsx` wraps Dev Bypass in `import.meta.env.DEV`

### 1.10 Remaining Phase 1 minor items
- [ ] **Verify.tsx `handleContinue`** still accepts any 6 digits — add `// TODO: implement real verification` comment if not already present
- [ ] **BetaCode.tsx** — wire to Firestore OR hardcode bypass (see 1.4 above)
- [ ] **`firestore.ts` is now used** by CreateProfile and ProgramForging — confirm no other onboarding screens need it

---

## Phase 2: LLM Integration [IN PROGRESS]

### 2.1 Create LLM service — DONE
- [x] Create `src/services/llm.ts` with:
  - `type Message = { role: 'system' | 'user' | 'assistant'; content: string }`
  - `async function chatCompletion(messages: Message[], options?: { temperature?: number, maxTokens?: number }): Promise<string>`
  - Provider fallback chain: Groq → Together AI → OpenRouter
  - Groq: POST `https://api.groq.com/openai/v1/chat/completions` with model `llama-3.3-70b-versatile`, API key from `import.meta.env.VITE_GROQ_API_KEY`
  - Together: POST `https://api.together.xyz/v1/chat/completions` with model `meta-llama/Llama-3.3-70B-Instruct-Turbo`, API key from `import.meta.env.VITE_TOGETHER_API_KEY`
  - OpenRouter: POST `https://openrouter.ai/api/v1/chat/completions` with free model, API key from `import.meta.env.VITE_OPENROUTER_API_KEY`
  - On 429 or timeout (30s) or network error → try next provider
  - Return plain string response (parsed from `choices[0].message.content`)

### 2.2 Define agent system prompts — DONE
- [x] Create `src/services/agentPrompts.ts`:
  - `function buildSystemPrompt(agent: 'atlas' | 'orion' | 'kade', context: AgentContext): string`
  - `AgentContext = { behaviorState: BehaviorState, userProfile: any, conversationMode: string, recentWorkouts: string }`
  - **Atlas** system prompt: "You are Atlas, The Enforcer. A strict, no-BS military-style fitness coach. You speak in short, direct sentences. You never accept excuses. You hold the operator to the highest standard. Phrases: 'No negotiation.', 'Execute the protocol.', 'You committed. Now follow through.' Current operator state: {behaviorState}. Profile: {userProfile}."
  - **Orion** system prompt: "You are Orion, The Navigator. An adaptive, analytical training strategist. You adjust plans based on data and patterns. You explain the 'why' behind every recommendation. Phrases: 'Let's recalibrate.', 'The data suggests...', 'Here's the optimal path.' Current operator state: {behaviorState}. Profile: {userProfile}."
  - **Kade** system prompt: "You are Kade, The Rival. A competitive, bold trash-talker who pushes through provocation. You challenge the operator to prove themselves. Never cruel, always pushing harder. Phrases: 'Is that all you've got?', 'I wouldn't stop there.', 'Prove me wrong.' Current operator state: {behaviorState}. Profile: {userProfile}."
  - All prompts include: "Respond in 1-3 sentences max. Use the STRIDE military-ops tone. Never break character. If the operator asks about adjusting their program, provide specific exercise recommendations."
  - When friction mode is active, append: "FRICTION ACTIVE: The operator has shown contradictory behavior ({frictionType}). Deliver a short, calibrated identity-challenging message."

### 2.3 Replace template-based AI with LLM calls — DONE
- [x] In `AIAgent.tsx`:
  - Import `chatCompletion` from `src/services/llm.ts` and `buildSystemPrompt` from `src/services/agentPrompts.ts`
  - Replace the `setTimeout` + `generateAgentResponse` block with:
    1. Build system prompt with current agent + behavioral state + user profile from Firestore
    2. Build messages array: `[systemPrompt, ...conversationHistory.slice(-20), userMessage]`
    3. Call `chatCompletion(messages)`
    4. On success: add AI response to chat
    5. On error: fall back to existing `agentLayer.ts` response as backup
  - Add a "thinking..." indicator while waiting for LLM
  - Keep the `shouldDeliverFriction()` check — if true, add friction context to system prompt
  - Read `selectedAgent` from Firestore `users/{uid}/personalization/data` instead of localStorage `trainingAgent`
  - Agent switching should update Firestore (not just localStorage)

### 2.4 Create program generation service — DONE
- [x] Create `src/services/programGenerator.ts`:
  - `async function generateProgram(personalization: PersonalizationData): Promise<Program>`
  - Builds a prompt like: "Generate a {durationWeeks}-week training program for an operator with: Goal: {optimizationGoal}, Experience: {experience}, Equipment: {equipmentAccess}, Session time: {sessionTime}, Constraints: {constraints}. Output ONLY valid JSON with this structure: { name: string, durationWeeks: number, weeks: [{ weekNumber: number, days: [{ dayNumber: number, name: string, exercises: [{ name: string, sets: number, reps: string, rest: string, notes?: string }] }] }] }"
  - Parse response as JSON, validate structure
  - If invalid JSON: retry once with "Your previous response was not valid JSON. Output ONLY the JSON object, no markdown."
  - `type Program = { name: string, durationWeeks: number, weeks: Week[] }` etc.

### 2.5 Wire ProgramForging to real LLM generation — DONE
- [x] In `ProgramForging.tsx`:
  - After saving personalization data to Firestore, call `generateProgram()` with that data
  - Replace the fake `setInterval` progress with real stages: "Analyzing profile..." (0-30%), "Generating program..." (30-80%), "Saving program..." (80-100%)
  - On success: save program to Firestore `users/{uid}/programs/{programId}` with `{ ...program, active: true, createdAt }`
  - On failure: show error message + "Retry" button instead of auto-navigating
  - Only navigate to `/app` after program is successfully saved
  - If LLM fails after retries, generate a basic template program locally (bodyweight exercises) as fallback

### 2.6 Handle LLM errors gracefully — DONE
- [x] In AIAgent: falls back to agentLayer.ts template responses on LLM failure
- [x] Fall back to `agentLayer.ts` template responses as last resort
- [x] Never show raw error messages to user (errors go to console.warn)

---

## Phase 3: Data Layer [MEDIUM PRIORITY]

### 3.1 Migrate behaviorStore to Firestore — DONE
- [x] Update `src/app/utils/behaviorStore.ts`:
  - **Fixed default values**: all zeros, alignmentScore: 50
  - Added `syncFromFirestore(uid)` — fetches `users/{uid}/behaviorState/data`, merges into localStorage
  - Added `syncToFirestore(uid)` — writes current state to Firestore
  - `updateBehaviorState()` auto-syncs to Firestore when `_authUid` is set
  - `setAuthUid()` called from AuthContext on auth state change
  - `syncFromFirestore()` called once on login in AuthContext

### 3.2 Wire Dashboard to live data — DONE
- [x] In `Dashboard.tsx`:
  - Read user callsign + avatar from Firestore via `subscribeToDocument`
  - Read active program from `queryCollection` with `where('active', '==', true)`
  - Derive week overview from program structure + current week calculation
  - Calculate real consistency % from behaviorStore
  - Today's workout derived from active program → active protocol + exercise queue
  - If no active program, show "No active program" prompt with link to agent

### 3.3 Wire WorkoutSequenceModal to real data
- [ ] Accept workout data (exercises array) as props from Dashboard
- [ ] Replace hardcoded exercise data with prop values
- [ ] On complete: write workout log to `users/{uid}/workoutLogs/{auto-id}`
- [ ] Update behaviorState in Firestore (streak, completions)

### 3.4 Wire Progress screen to Firestore
- [ ] Query `users/{uid}/workoutLogs` for past 28 days → build week grid
- [ ] Aggregate stats from logs (total ops, streak, completion rate, avg duration)
- [ ] Build performance chart from weekly completion rates
- [ ] Recent activity from last 5 workout logs

### 3.5 Wire Profile to Firebase + Firestore
- [ ] Read profile data from Firestore `users/{uid}` (callsign, bio, avatarUrl)
- [ ] Read email from `useAuth().user.email`
- [ ] Wire `handleSave()` to `updateDocument('users/{uid}', { callsign, bio })`
- [ ] Wire avatar upload to Firebase Storage `avatars/{uid}` → update profile avatarUrl
- [ ] Replace hardcoded stats with real behaviorStore values

### 3.6 Wire Notifications
- [ ] Query `users/{uid}/notifications` ordered by createdAt desc
- [ ] Wire Mark All Read / Clear Read buttons
- [ ] Wire filter tabs by notification type
- [ ] Show empty state for new users

---

## Phase 4: Social Features [MEDIUM PRIORITY]

- [ ] Create `src/services/challenges.ts` — CRUD for challenges collection
- [ ] Create `src/services/squads.ts` — CRUD with invite code generation/validation
- [ ] Wire Challenges.tsx to Firestore (join challenge, create/join squad)
- [ ] Wire ChallengeDetail.tsx leaderboard from real participant data
- [ ] Wire UserProfileModal to read shared profiles
- [ ] Create `src/services/notifications.ts` — notification creation helper
- [ ] Add notification triggers (workout complete, streak milestone, challenge joined)

---

## Phase 5: Polish & Deploy [LOW PRIORITY]

- [ ] Error boundaries around main screens
- [ ] Loading skeletons for async reads (black bg, #ff6600 pulse)
- [ ] Firestore offline persistence (`enableIndexedDbPersistence`)
- [ ] Production Firestore security rules
- [ ] Firebase Storage security rules for avatars
- [ ] Firebase Hosting deployment config
- [ ] Route-level code splitting (`React.lazy()`)
- [ ] Upload avatar to Firebase Storage (currently saves base64 data URL)
- [ ] Final `npm run build` — zero errors/warnings

---

## Completed
- [x] Project initialization and Figma mockup review
- [x] Firebase project setup (stride-a333e) with Firestore, Auth, Hosting
- [x] CLAUDE.md specification document
- [x] Environment variables (.env) with Firebase SDK config
- [x] Git repository initialized
- [x] Core dependencies installed (firebase, zustand)
- [x] Firebase config service (`src/services/firebase.ts`)
- [x] Firebase Auth service (`src/services/auth.ts`)
- [x] Auth context/provider (`src/app/contexts/AuthContext.tsx`)
- [x] Protected route wrapper (`ProtectedRoute.tsx`)
- [x] Firestore service layer (`src/services/firestore.ts`)
- [x] Profile disconnect → Firebase sign out
- [x] Figma asset resolver Vite plugin
- [x] Zustand onboarding store with typed state + persist
- [x] Welcome.tsx wired to Firebase Auth (signup/signin/Google)
- [x] Verify.tsx reads email from store (OTP still placeholder)
- [x] CreateProfile.tsx saves to Firestore `users/{uid}`
- [x] ALL 13 personalization steps wired to onboarding store
- [x] ProgramForging saves all onboarding data to Firestore
- [x] Step10GymAccess routing bug fixed
- [x] Dev Bypass gated behind `import.meta.env.DEV`
- [x] onboardingSteps.ts migrated to store re-exports
- [x] Build passes: `npm run build` — 0 errors
- [x] LLM service (`src/services/llm.ts`) — Groq → Together → OpenRouter fallback chain
- [x] Agent system prompts (`src/services/agentPrompts.ts`) — Atlas, Orion, Kade with dynamic context
- [x] AIAgent.tsx wired to real LLM with agentLayer fallback
- [x] Program generator (`src/services/programGenerator.ts`) — LLM + fallback template
- [x] ProgramForging.tsx wired to generate + save program to Firestore
- [x] Agent switching persists to Firestore
- [x] Build passes after Phase 2: `npm run build` — 0 errors
- [x] behaviorStore migrated to Firestore sync with localStorage cache
- [x] Default values fixed (zeros instead of fake data)
- [x] AuthContext wired to sync behaviorState on login

## Notes
- The UI is COMPLETE from Figma — do not redesign, only wire to live data
- Free LLM providers: Groq (primary — fastest), Together AI (fallback), OpenRouter (fallback)
- All behavioral psychology logic (frictionEngine, microLanguage) stays client-side — just sync state to Firestore
- The 3 agents (Atlas/Orion/Kade) share conversation modes but have different personalities via system prompts
- Package manager: use npm (not pnpm)
- `firestore.ts` is now used by CreateProfile and ProgramForging — use it for ALL new Firestore reads/writes
- `agentLayer.ts` is kept as fallback — don't delete it, add LLM calls alongside
- behaviorStore defaults currently fake data (168 workouts, 6 streak) — reset to zeros for new users
- BetaCode still accepts any 6 chars — wire to Firestore or hardcode bypass
