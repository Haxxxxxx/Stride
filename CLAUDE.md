# STRIDE - AI-Powered Fitness Training OS

## Project Overview
STRIDE is an AI-powered fitness training web app with a cyberpunk/military-ops UI aesthetic. It uses **free LLM models** to power conversational AI coaching agents that create, adapt, and manage personalized workout programs. The app has a sophisticated behavioral psychology layer (friction engine, micro-language system, pattern detection) that drives user accountability.

**Firebase Project**: `stride-a333e` (Stride)
**Stack**: Vite + React + TypeScript + Tailwind CSS v4 + React Router v7
**Design**: JetBrains Mono font, black/white/#ff6600 color scheme, scanline effects, military-ops terminology

---

## Architecture

### Current State (Figma Mockup)
The app was generated from Figma Make — all data is **hardcoded/localStorage**. The conversational AI uses **template string matching** (not real LLM). Ralph's job is to wire everything to Firebase + real free LLM APIs.

### Target Architecture
```
Frontend (Vite/React) → Firebase Auth → Firestore (user data, programs, behavior state)
                       → Free LLM API (conversational AI, program generation)
                       → Firebase Hosting (deployment)
                       → Firebase Storage (profile images)
```

---

## Design System (DO NOT CHANGE)
- **Font**: `JetBrains Mono` (monospace) — used everywhere
- **Colors**: Black background, white text, `#ff6600` accent (orange)
- **Border style**: Sharp corners (no border-radius except explicit cases)
- **Effects**: Scanline overlays, pulse animations on status indicators
- **Terminology**: "Operator" (user), "Protocol" (workout plan), "Module" (exercise), "Calibration" (workout session), "Alignment Score" (behavior metric), "Sequence" (workout in progress)
- **Icons**: Lucide-compatible SVG paths (already in svg imports)

---

## Key Features & Implementation Status

### 1. Authentication & Onboarding
**Status**: UI complete, needs Firebase Auth wiring
- Splash screen → Welcome → Phone/Email verify → Beta code → Profile creation
- 10-step personalization flow collecting: body profile, optimization goal, height, weight, goal weight (conditional), constraints, session time, experience level, training focuses, gym/equipment access
- Agent selection (Atlas/Orion/Kade) → Program "forging" animation → Dashboard
- **TODO**: Wire to Firebase Auth (email/password + Google Sign-In + anonymous for beta). Store onboarding data in Firestore `users/{uid}/profile` subcollection.

### 2. AI Training Agents (CORE FEATURE)
**Status**: Template-based responses, needs real LLM integration
- **3 Agents**: Atlas (The Enforcer - discipline), Orion (The Navigator - adaptive), Kade (The Rival - competitive)
- **4 Conversation Modes**: Clarification, Pattern Reflection, Identity Framing, Escalation
- **Current**: Hardcoded string arrays in `src/app/utils/agentLayer.ts` with keyword matching
- **TODO**: Replace with free LLM API calls. Each agent needs a system prompt that defines its personality. The conversation modes should guide the LLM's response style based on detected user behavior patterns.

#### Free LLM Integration Strategy
Use one or more of these free-tier LLM providers:
- **Groq** (free tier: Llama 3.3 70B, Mixtral) - fastest inference, best for real-time chat
- **Together AI** (free tier: Llama, Mistral models) - good alternative
- **OpenRouter** (free tier: various models) - aggregator with fallback
- **HuggingFace Inference API** (free: Mistral, Llama models) - reliable free tier

**Architecture**: Create a `src/services/llm.ts` service that:
1. Abstracts the LLM provider behind a common interface
2. Has fallback logic (try Groq first, fall back to Together, etc.)
3. Manages conversation context (last N messages)
4. Injects agent personality + behavioral state into system prompt
5. Handles rate limiting gracefully
6. API keys stored in `.env` / Firebase Remote Config for production

#### Agent System Prompts Must Include:
- Agent personality (Atlas=firm/disciplined, Orion=adaptive/strategic, Kade=competitive/bold)
- Current behavioral state (streak, alignment score, completion rate, consecutive misses)
- Active conversation mode (clarification/pattern/identity/escalation)
- User's profile data (goals, constraints, equipment, experience level)
- The micro-language tone guidelines (short, punchy, identity-reinforcing)

### 3. Program Generation (CORE FEATURE)
**Status**: Hardcoded workout data, needs LLM-powered generation
- After onboarding, the "Program Forging" screen should call the LLM to generate a personalized multi-week training program
- Programs stored in Firestore: `users/{uid}/programs/{programId}`
- Each program contains weekly cycles with daily workout modules
- **TODO**: Create a program generation prompt that takes the user's profile (goals, equipment, constraints, time, experience) and outputs structured JSON workout plans. Parse LLM response into Firestore documents.

### 4. Workout Execution
**Status**: UI complete in `WorkoutSequenceModal.tsx`, needs data wiring
- Timer, set/rep tracking, pause/resume
- Hesitation detection (30s idle → micro-language trigger)
- Post-workout reflection input (friction engineering)
- Neuroplastic encoding messages
- **TODO**: Wire actual workout data from Firestore programs. Save completed workout logs to `users/{uid}/workoutLogs/{logId}`. Update behavioral state in Firestore after completion/skip.

### 5. Behavioral Psychology Engine
**Status**: Logic complete in utils/, uses localStorage
- **Behavior Store** (`behaviorStore.ts`): Tracks streaks, completion rates, hesitation events, delay language, reset loops, alignment score
- **Friction Engine** (`frictionEngine.ts`): Detects contradictions (Goal-Behavior Conflict, Delay Pattern, Reset Loop, Constraint Mismatch). Delivers calibrated friction responses at 10-15% rate with safety blockers.
- **Micro-Language** (`microLanguage.ts`): 75+ event-triggered identity-anchoring messages across 10 categories (login, workout start, hesitation, completion, missed, streak milestone, streak broken, weekly insights, neuroplastic encoding)
- **TODO**: Migrate all state from localStorage to Firestore `users/{uid}/behaviorState`. Keep localStorage as offline cache with sync-on-reconnect.

### 6. Dashboard
**Status**: UI complete, needs live data
- System status (streak, consistency, alignment score)
- Weekly calendar with progress circles
- Active protocol display
- Protocol queue (exercise list)
- **TODO**: Read from Firestore user profile + active program. Calculate real consistency % from workout logs.

### 7. Progress Screen
**Status**: UI complete with mock data
- 4-week grid calendar with day detail drill-down
- Stats (total operations, streak, completion rate, avg duration)
- Performance trend chart
- Recent activity log
- **TODO**: Populate from Firestore workout logs. Build real aggregation queries.

### 8. Challenges & Squads (Social)
**Status**: UI complete, needs backend
- Community challenges with join/progress tracking
- Squad system with invite codes (SQD-XXXXXX)
- Squad creation with focus type selection
- User profile modals with progress card sharing (privacy toggle)
- **TODO**: Firestore collections: `challenges/{id}`, `squads/{id}`, `squads/{id}/members/{uid}`. Real-time listeners for leaderboards.

### 9. Profile & Settings
**Status**: UI complete, needs persistence
- Profile editing (name, email, bio, avatar)
- Shareable progress card with Web Share API
- System info + disconnect (logout)
- **TODO**: Wire to Firebase Auth profile + Firestore user doc. Use Firebase Storage for avatar uploads.

### 10. Notifications
**Status**: Component exists, needs implementation
- **TODO**: Firestore `users/{uid}/notifications` collection + Firebase Cloud Messaging for push.

---

## Firestore Data Model

```
users/{uid}
  ├── profile: { name, email, bio, avatarUrl, createdAt, onboardingComplete }
  ├── personalization: { bodyProfile, optimizationGoal, height, weight, goalWeight, constraints[], sessionTime, experience, trainingFocuses[], gymAccess, equipmentAccess, selectedAgent, sportFocus }
  ├── behaviorState: { ...BehaviorState interface from behaviorStore.ts }
  ├── programs/{programId}: { name, weeks[], createdAt, active, generatedBy }
  │     └── weeks/{weekId}/days/{dayId}: { exercises[], duration, targetVolume }
  ├── workoutLogs/{logId}: { programId, dayId, exercises[], duration, completedAt, reflection?, completionType }
  ├── notifications/{notifId}: { type, message, read, createdAt }
  └── settings: { agent, notifications, shareProgress }

challenges/{id}: { title, description, target, startDate, endDate, participantCount }
  └── participants/{uid}: { joinedAt, progress, shareProgress }

squads/{id}: { name, type, code, createdBy, createdAt }
  └── members/{uid}: { joinedAt, role, shareProgress }
```

---

## File Structure
```
src/
  app/
    components/
      ui/              # shadcn/radix UI primitives (DO NOT MODIFY)
      onboarding/      # Onboarding flow screens
        personalization/  # 10-step personalization + agent selection
      figma/           # Figma asset components
      Dashboard.tsx    # Main dashboard
      Progress.tsx     # Progress overview
      Challenges.tsx   # Challenges hub + squads
      Profile.tsx      # User profile + settings
      AIAgent.tsx      # Chat interface with AI agents
      WorkoutSequenceModal.tsx  # Active workout execution
      SystemMessage.tsx # Micro-language display component
      CircularProgress.tsx # Progress circle component
      Root.tsx         # App shell with navbar + status bar
      Notifications.tsx
    utils/
      agentLayer.ts     # Agent conversation logic (→ replace with LLM calls)
      behaviorStore.ts  # Behavioral state management (→ sync to Firestore)
      frictionEngine.ts # Friction detection & delivery
      microLanguage.ts  # Event-based micro-language messages
      onboardingSteps.ts # Dynamic step calculator
    routes.ts          # React Router v7 routes
    App.tsx            # Root provider
  imports/             # Figma-generated SVG paths (DO NOT MODIFY)
  main.tsx             # Entry point
```

---

## Implementation Priority (Suggested Order)

### Phase 1: Foundation
1. Install dependencies: `firebase`, `zustand` (state management), env setup
2. Firebase Auth integration (email/password + Google Sign-In)
3. Create auth context/provider + protected routes
4. Wire onboarding flow to save profile data to Firestore
5. Create Firestore service layer (`src/services/firestore.ts`)

### Phase 2: LLM Integration (Core)
6. Create LLM service (`src/services/llm.ts`) with Groq/Together free tier
7. Define agent system prompts for Atlas, Orion, Kade
8. Replace `agentLayer.ts` template matching with real LLM conversation
9. Implement program generation via LLM (structured JSON output)
10. Wire "Program Forging" screen to actually generate a program

### Phase 3: Data Layer
11. Migrate behaviorStore from localStorage → Firestore (with offline cache)
12. Wire Dashboard to read live data from Firestore
13. Wire workout execution to save logs + update behavior state
14. Wire Progress screen to aggregate from workout logs
15. Wire Profile to Firebase Auth + Firestore + Storage (avatar)

### Phase 4: Social Features
16. Implement challenges backend (Firestore collections + queries)
17. Implement squads with invite codes
18. Real-time listeners for squad member activity
19. Notifications system (Firestore + optional FCM)

### Phase 5: Polish & Deploy
20. Error boundaries + loading states
21. Offline support (Firestore persistence)
22. Firebase Hosting deployment
23. Performance optimization (lazy routes, code splitting)
24. Security rules for Firestore + Storage

---

## Code Conventions
- TypeScript strict mode
- Functional components only
- ESM imports (`import`/`export`)
- Zustand for client state, TanStack Query for server state (optional)
- Environment variables in `.env` (VITE_* prefix for client-side)
- All LLM API keys in `.env`, NEVER in source code
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`
- Do NOT modify files in `src/imports/` or `src/app/components/ui/` unless absolutely necessary
- Preserve the existing design system — all new UI should match the JetBrains Mono / black / white / #ff6600 aesthetic

---

## Environment Variables Needed
```env
# Firebase (from firebase config)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=stride-a333e
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# LLM Providers (use at least one)
VITE_GROQ_API_KEY=
VITE_TOGETHER_API_KEY=
VITE_OPENROUTER_API_KEY=
```

---

## Critical Rules
1. **NEVER change the visual design** — the Figma mockup aesthetic is final
2. **NEVER modify `src/imports/`** — these are generated Figma asset files
3. **NEVER modify `src/app/components/ui/`** — these are shadcn primitives
4. **Always use JetBrains Mono** font for any new text
5. **LLM responses must stay in character** — short, punchy, identity-reinforcing (see agentLayer.ts for tone)
6. **Keep micro-language messages under 3 lines** — brevity is the design
7. **Friction engine rate limits are intentional** — do not increase friction delivery rate above 15%
8. **Safety blockers (injury/burnout flags) MUST suppress all friction** — never override this
9. **All Firestore writes must be authenticated** — use security rules
10. **API keys in .env only** — never commit secrets
