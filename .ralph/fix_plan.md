# STRIDE — Fix Plan

## Phase 1: Foundation [HIGH PRIORITY]
- [x] Install core dependencies (firebase, zustand)
- [x] Create Firebase config service (`src/services/firebase.ts`) using env vars from .env
- [x] Create Firebase Auth service (`src/services/auth.ts`) with email/password + Google Sign-In + anonymous
- [x] Create auth context/provider (`src/app/contexts/AuthContext.tsx`) with useAuth hook
- [x] Add protected route wrapper — redirect unauthenticated users to onboarding
- [x] Create Firestore service layer (`src/services/firestore.ts`) with typed CRUD operations
- [x] Update Profile disconnect button to call Firebase Auth sign out
- [x] Fix figma:asset/ build resolution (Vite plugin for production builds)
- [ ] Wire onboarding Welcome/Verify/BetaCode screens to Firebase Auth (sign up / sign in)
- [ ] Wire CreateProfile screen to save profile data to Firestore `users/{uid}/profile`
- [ ] Wire personalization steps (Steps 1-10) to save to Firestore `users/{uid}/personalization`
- [ ] Wire AgentSelection to save selected agent to Firestore

## Phase 2: LLM Integration [HIGH PRIORITY]
- [ ] Create LLM service abstraction (`src/services/llm.ts`) with provider fallback (Groq → Together → OpenRouter)
- [ ] Define agent system prompts for Atlas, Orion, Kade in `src/services/agentPrompts.ts`
- [ ] Replace template-based `agentLayer.ts` with real LLM conversation calls
- [ ] Inject behavioral state + user profile into system prompts dynamically
- [ ] Implement conversation history management (last N messages context)
- [ ] Create program generation prompt that outputs structured JSON workout plans
- [ ] Wire ProgramForging screen to call LLM and generate actual personalized program
- [ ] Save generated programs to Firestore `users/{uid}/programs/{programId}`
- [ ] Handle LLM rate limiting and error states gracefully in UI

## Phase 3: Data Layer [MEDIUM PRIORITY]
- [ ] Migrate behaviorStore from localStorage to Firestore `users/{uid}/behaviorState`
- [ ] Add offline localStorage cache with Firestore sync-on-reconnect
- [ ] Wire Dashboard SystemStatus to read live streak/alignment data from Firestore
- [ ] Wire Dashboard WeekOverview to read from active program weekly data
- [ ] Wire Dashboard ActiveOperation to read current day's workout from program
- [ ] Wire Dashboard OperationsList to read protocol queue from active program
- [ ] Wire WorkoutSequenceModal to load actual exercise data from Firestore program
- [ ] Save workout completion logs to Firestore `users/{uid}/workoutLogs/{logId}`
- [ ] Update behavioral state in Firestore after workout complete/skip
- [ ] Wire Progress screen stats from aggregated Firestore workout logs
- [ ] Wire Progress WeeklyGrid from actual program/log data
- [ ] Wire Progress RecentActivity from Firestore workout logs
- [ ] Wire Profile data from Firebase Auth + Firestore user doc
- [ ] Wire Profile avatar upload to Firebase Storage

## Phase 4: Social Features [MEDIUM PRIORITY]
- [ ] Create Firestore collections for challenges (`challenges/{id}`)
- [ ] Create Firestore collections for squads (`squads/{id}`, `squads/{id}/members/{uid}`)
- [ ] Wire Challenges page to read/write challenge data from Firestore
- [ ] Implement squad creation with invite code generation (persist to Firestore)
- [ ] Implement squad join with code validation
- [ ] Wire UserProfileModal to read other users' shared progress cards
- [ ] Implement JoinChallengeModal with real Firestore participant tracking
- [ ] Create Notifications collection (`users/{uid}/notifications`) and wire Notifications screen
- [ ] Add real-time Firestore listeners for squad activity updates

## Phase 5: Polish & Deploy [LOW PRIORITY]
- [ ] Add error boundaries for graceful failure handling
- [ ] Add loading states/skeletons for async data fetching
- [ ] Enable Firestore offline persistence for offline-first experience
- [ ] Write production Firestore security rules (replace expiring open rules)
- [ ] Write Firebase Storage security rules for avatar uploads
- [ ] Configure Firebase Hosting deployment (`firebase deploy --only hosting`)
- [ ] Add route-level code splitting with React.lazy() for performance
- [ ] Final build verification: `npm run build` with zero errors/warnings

## Completed
- [x] Project initialization and Figma mockup review
- [x] Firebase project setup (stride-a333e) with Firestore, Auth, Hosting
- [x] CLAUDE.md specification document
- [x] Environment variables (.env) with Firebase SDK config
- [x] Git repository initialized

## Notes
- The UI is COMPLETE from Figma — do not redesign, only wire to live data
- Free LLM providers: Groq (primary — fastest), Together AI (fallback), OpenRouter (fallback)
- All behavioral psychology logic (frictionEngine, microLanguage) stays client-side — just sync state to Firestore
- The 3 agents (Atlas/Orion/Kade) share conversation modes but have different personalities via system prompts
- Package manager: use npm (pnpm overrides in package.json but npm is the default)
