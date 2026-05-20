# FitTrack

FitTrack is a Vite + React fitness app focused on training guidance, workout tracking, progression, recovery, and gamification. The main application lives in [src/](src) and is the active codebase. There is also a legacy/minimal clone in [v2/FitTrack/](v2/FitTrack), which should be treated separately when debugging or cleaning lint issues.

## What this project already has

The current app includes a broad set of fitness-oriented features:

- Workout planning and active workout execution
- Profile onboarding and beginner guidance
- Workout history and summaries
- Post-workout feedback and XP progression
- AI coach integration through Anthropic
- Trends and milestone tracking
- Planner and cycle review screens
- Rewards store and gamification
- Social/club features
- Device manager and wearable-related hooks
- Security lock screen and encrypted storage helpers
- Plate calculator and workout utilities
- 3D and visual components for richer training feedback
- Background workers and offline/sync helpers

The codebase is already structured as a feature-rich product rather than a starter template.

## Tech Stack

- React 19
- Vite 8
- TypeScript + JavaScript mix
- Framer Motion for transitions
- Zod for runtime validation
- Zustand for state management
- Recharts for charts
- MediaPipe for pose and motion features
- Three.js / React Three Fiber for 3D UI
- Anthropic SDK for the AI coach
- Supabase, IDB, and localStorage for data/persistence flows
- Sentry for error reporting

## Project Structure

- [src/App.tsx](src/App.tsx) contains the main app shell, routing by state, locking, persistence, and most top-level navigation.
- [src/screens/](src/screens) contains the main screens such as dashboard, workout, trends, planner, settings, AI coach, and rewards.
- [src/components/](src/components) contains reusable UI and domain components, including onboarding, history, workout, social, security, and 3D modules.
- [src/hooks/](src/hooks) contains custom hooks for motion, Bluetooth, workers, audio, and workout logic.
- [src/services/](src/services) contains the heavier business logic such as workout generation, progression, fatigue, challenges, and AI integrations.
- [src/stores/](src/stores) contains global state stores.
- [src/utils/](src/utils) contains calculators, sanitizers, schemas, and crypto helpers.
- [scripts/](scripts) contains utility scripts for exercise media download and checks.
- [functions/](functions) contains serverless or edge-style API logic.

## How to run

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run build` to produce a production build
- `npm run lint` to check code quality
- `npm run preview` to preview the build locally
- `npm run download-exercises` to fetch exercise media assets

## Access outside home

### Fastest option: ngrok

```bash
npm run dev -- --host 0.0.0.0
ngrok http 5173
```

Use the HTTPS URL that ngrok prints. This is the quickest way to test on iPhone or from outside your local network.

### Permanent option: Vercel

The repo now includes a basic [vercel.json](vercel.json) SPA rewrite. Deploy with the Vercel CLI or GitHub integration, then use the generated HTTPS URL.

### Offline option: PWA

The app is now configured with a PWA manifest and service worker registration. After running the production build or preview, open the app in Safari/Chrome and choose "Add to Home Screen" / "Install app".

```bash
npm run build
npm run preview:host
```

## Important notes

- The main entry point is [src/main.jsx](src/main.jsx).
- The current app shell is TypeScript-based in [src/App.tsx](src/App.tsx), while [src/App.jsx](src/App.jsx) belongs to an older variant and should not be confused with the active app.
- The repository-wide lint currently scans both the active app and the legacy [v2/FitTrack/](v2/FitTrack) tree, which is why lint can fail on old files even if the main app still builds.
- [README.md](README.md) used to be the default Vite template; this document replaces that with project-specific information.

## Current health snapshot

What looks good:

- The production build succeeds.
- The app has a strong feature set and a clear product direction.
- TypeScript is already present in the main app, which gives room for stricter typing.

What needs attention:

- Lint is failing because of a mix of small issues and legacy files.
- The workspace contains two app trees, which can confuse maintenance and support.
- Some code still uses loose typing and broad persistence access patterns.
- The project would benefit from clearer documentation and tighter boundaries between core app logic and helpers.

## Suggestions for improvement

If you want to ask for help in forums, AI tools, or from another developer, these are the highest-value topics to show first:

- How to split or exclude [v2/FitTrack/](v2/FitTrack) from the active lint/build workflow
- How to standardize the app entrypoint and remove ambiguity between `.jsx` and `.tsx` variants
- How to replace broad `any` usage in [src/App.tsx](src/App.tsx) with proper types
- How to centralize persistence and reduce direct `localStorage` coupling
- How to create a cleaner navigation/state architecture for the main app shell
- How to add tests for workout progression, XP, and challenge evaluation
- How to improve the AI coach flow and make API key handling safer
- How to make the documentation and onboarding easier for contributors

## If you want to ask for help, show this context

When you ask for help elsewhere, it helps to include:

1. The goal of the app: fitness tracking, workout guidance, AI coaching, and progression.
2. The main entry file: [src/App.tsx](src/App.tsx).
3. The fact that [v2/FitTrack/](v2/FitTrack) is a legacy clone still present in the repo.
4. The current status: build passes, lint fails because it includes legacy files and small code issues.
5. The specific pain point you want to solve: lint cleanup, architecture cleanup, documentation, or feature development.

## Recommended next steps

1. Clean up the legacy tree or exclude it from active checks.
2. Fix the lint issues in the active app and legacy code.
3. Add a short contributor guide or architecture overview.
4. Introduce tests for the most business-critical flows.
