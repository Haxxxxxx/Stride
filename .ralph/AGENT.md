# STRIDE — Agent Build Instructions

## Project Setup
```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example and fill in values)
cp .env.example .env
```

## Running Development Server
```bash
npm run dev
# Opens at http://localhost:5173
```

## Building for Production
```bash
npm run build
# Output: dist/
```

## Deploying to Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## Key File Locations
- **Entry**: `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.ts`
- **Services** (create these): `src/services/firebase.ts`, `src/services/auth.ts`, `src/services/llm.ts`, `src/services/firestore.ts`
- **Agent Logic**: `src/app/utils/agentLayer.ts` (replace with LLM calls)
- **Behavior State**: `src/app/utils/behaviorStore.ts` (migrate to Firestore)
- **Friction Engine**: `src/app/utils/frictionEngine.ts` (keep client-side, sync state)
- **Micro-Language**: `src/app/utils/microLanguage.ts` (keep as-is)
- **UI Components**: `src/app/components/` (wire to live data, don't redesign)

## Environment Variables
All client-side env vars must use `VITE_` prefix. See `.env.example`.

## Firebase Project
- Project ID: `stride-a333e`
- Auth: Email/Password + Google Sign-In + Anonymous
- Firestore: `(default)` database, us-east4
- Hosting: SPA mode, dist/ directory
- Storage: Profile image uploads

## Tech Stack
- Vite 6.3 + React 18 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- React Router v7 (createBrowserRouter)
- Radix UI primitives + shadcn components
- Motion (Framer Motion) for animations
- Recharts for performance charts

## Key Learnings
- This is a Figma Make export — SVG paths are in `src/imports/` (DO NOT TOUCH)
- UI components in `src/app/components/ui/` are shadcn primitives (DO NOT TOUCH)
- The design uses JetBrains Mono font exclusively
- Color scheme: black bg, white text, #ff6600 accent
- All new text must use `font-['JetBrains_Mono',monospace]` class
