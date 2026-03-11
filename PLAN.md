# Implementation Plan: MealPrep MVP

> Source: `DISCUSSION.md`
> Generated: 2026-03-10

---

## Phase 0 — Project Scaffolding + Tracer Bullet
> Stand up the full toolchain, then prove the core architecture with a hardcoded-user → AI-generated meals → reactive UI slice.

### Initialize TanStack Start + Bun
- [x] Scaffold TanStack Start project (`bunx @tanstack/cli@latest create my-tanstack-app --package-manager bun --tailwind --add-ons tanstack-query,start,convex,better-auth`) This uses TanStack CLI to bootstrap a project with Convex and better-auth packages installed
- [x] Note: The CLI command above should properly configure `vite.config.ts`. Some things to double-check: `tanstackStart()` plugin from `@tanstack/react-start/plugin/vite` and `tsconfigPaths`; verify if `ssr: { noExternal: ['@convex-dev/better-auth'] }` is warranted or not
- [x] Set `tsconfig.json` path aliases: `"~/*": ["./src/*"]`
- [x] Verify dev server starts with `bun run dev`

### Tailwind CSS + shadcn/ui
- [x] Bootstrap shadcn/ui (`bunx --bun shadcn@latest init --preset aJ4XDay --base base --template start`) This will initialize shadcn but might create a new project entirely in a subdirectory of the project. make sure to pull the important files out of the generated project like `components.json`, `/components/ui`, `~/lib/utils`), and global/index css file (invoke `shadcn` skill)
- [x] Verify Tailwind renders correctly in browser

### Convex Backend
- [x] Install Convex packages: `convex`, `@convex-dev/react-query`, `@tanstack/react-query`, `@tanstack/react-router-with-query`
- [x] Run `bun x convex dev` to provision deployment, create `convex/` dir, populate `.env.local` with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`
- [x] Create minimal `convex/schema.ts` with just `users` table to validate the schema pipeline
- [x] Wire `ConvexQueryClient` in `src/router.tsx` with `ConvexProvider`, verify a test query works from `index.tsx`

### Linting, Formatting, Testing
- [x] Install Oxlint (`bun add -D oxlint`), run `oxlint --init` for `.oxlintrc.json`; create `.oxfmtrc.json`
- [x] Install Vitest (`bun add -D vitest`), create `vitest.config.ts`, add sanity test in `src/lib/__tests__/sanity.test.ts`
- [x] Add package.json scripts: `lint`, `format`, `test`, `check`

### Tracer: Full Convex Schema + Meal Server Functions
- [x] Expand `convex/schema.ts` to all 6 tables (`users`, `preferences`, `mealPlans`, `meals`, `prepGuides`, `generationLogs`) with full field definitions and indexes (`mealPlans.by_user`, `mealPlans.by_user_week`, `meals.by_mealPlan`, `meals.by_user`, `preferences.by_user`)
- [x] Create `convex/mealPlans.ts` — `create` mutation, `updateStatus` mutation, `getByUserAndWeek` query, `getByUser` query
- [x] Create `convex/meals.ts` — `create` mutation, `getByMealPlan` query (sorted by `sortOrder`), `updateStatus` mutation

### Tracer: AI SDK + Server Route
- [x] Install AI SDK packages: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `zod`
- [x] Create `src/lib/ai/schemas.ts` — Zod schema for meal suggestions (name, description, keyIngredients, estimatedPrepMinutes)
- [x] Create `src/lib/ai/prompts.ts` — `buildMealSuggestionsPrompt()` with hardcoded default preferences for tracer bullet
- [x] Create `src/lib/convex.ts` — exports `getConvexHttpClient()` using `ConvexHttpClient`
- [x] Create `src/routes/api/ai/generate-meals.ts` — POST server route: creates mealPlan in Convex, calls `streamText()` with `Output.array()`, iterates `elementStream` writing each meal to Convex, updates plan status to `"reviewing"`; includes 2-retry error handling
- [ ] Add `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` to `.env.local`

### Tracer: Reactive Meal UI
- [x] Create `src/components/meals/meal-card.tsx` — shadcn Card displaying name, description, keyIngredients (badges), estimatedPrepMinutes (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/meals/meal-grid.tsx` — responsive grid rendering `MealCard` components (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/meals/meal-skeleton.tsx` — skeleton loading state mimicking meal card layout (invoke `frontend-design` and `shadcn` skills)
- [x] Wire up `src/routes/index.tsx` as tracer page: add a `loader` using `createServerFn` to fetch existing meal plans server-side for SSR initial render; "Generate Meals" button POSTing to `/api/ai/generate-meals`; reactive `convexQuery(api.meals.getByMealPlan)` for live updates as meals stream in (invoke `frontend-design` and `shadcn` skills)
- [ ] **Verify end-to-end**: click generate → mealPlan appears in Convex → meals appear one by one in UI → status transitions to `"reviewing"`

---

## Phase 1 — Authentication
> Wire better-auth with Convex adapter for email + Google OAuth, create auth pages, sync user records.

### Better Auth Backend
- [x] Install: `@convex-dev/better-auth`, `better-auth@1.4.9`
- [x] Create `convex/convex.config.ts` — register `betterAuth` component
- [x] Create `convex/auth.config.ts` — export `AuthConfig` via `getAuthConfigProvider()`
- [x] Create `convex/auth.ts` — `betterAuth()` instance with email/password enabled, Convex adapter, `convex({ authConfig })` plugin; export `createAuth` and `getCurrentUser`

### Better Auth HTTP + Client
- [x] Create `convex/http.ts` — HTTP router registering auth routes via `authComponent.registerRoutes()`
- [x] Create `src/lib/auth-client.ts` — `createAuthClient()` with `convexClient()` plugin
- [x] Create `src/lib/auth-server.ts` — `convexBetterAuthReactStart()` exporting `handler`, `getToken`, `fetchAuthQuery`, `fetchAuthMutation`
- [x] Create `src/routes/api/auth/$.ts` — catch-all server route delegating to `handler`

### Auth Provider + Route Guards
- [x] Update `src/routes/__root.tsx` — `getAuth` server function via `createServerFn`, `beforeLoad` setting token on `convexQueryClient` for SSR-compatible auth context, wrap children in `ConvexBetterAuthProvider`; ensure the auth token is available to all downstream `loader` functions for authenticated server-side data fetching
- [x] Update `src/router.tsx` — set `expectAuth: true` on `ConvexQueryClient`
- [x] Create reusable `beforeLoad` auth guard redirecting to `/auth/login` for protected routes

### Auth Pages + User Sync
- [x] Create `convex/users.ts` — `createFromAuth` mutation (generationsRemaining: 25, onboardingCompleted: false), `getByBetterAuthId` query, `decrementCredits` mutation, `completeOnboarding` mutation
- [x] Create `src/routes/auth/login.tsx` — email/password form, Google OAuth button, link to signup (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/routes/auth/signup.tsx` — name/email/password form, creates user doc in Convex on success, redirects to `/onboarding/diet` (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/auth/google-button.tsx` — shared Google OAuth button (invoke `frontend-design` and `shadcn` skills)
- [ ] Add Google OAuth env vars to Convex, update `createAuth` with `socialProviders.google`
- [x] Update `src/routes/api/ai/generate-meals.ts` to use authenticated context instead of hardcoded userId

---

## Phase 2 — Onboarding Wizard
> Six-step wizard collecting user preferences, all steps skippable with sensible defaults.

### Preferences Data Layer
- [x] Create `convex/preferences.ts` — `create` mutation (with defaults), `getByUser` query, `update` mutation (partial updates)
- [x] Seed default preferences on signup alongside user creation

### Wizard Shell + Steps 1-3
- [x] Create `src/routes/onboarding/route.tsx` — layout route with auth guard and onboarding-completed redirect
- [x] Create `src/components/onboarding/wizard-shell.tsx` — step indicator (6 steps), Back/Next/Skip navigation (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/routes/onboarding/diet.tsx` + `src/components/onboarding/diet-step.tsx` — checkbox grid of 12 dietary restrictions, saves via `api.preferences.update` (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render
- [x] Create `src/routes/onboarding/cuisines.tsx` + `src/components/onboarding/cuisines-step.tsx` — cuisine list with like/neutral/dislike toggles (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render
- [x] Create `src/routes/onboarding/avoid.tsx` + `src/components/onboarding/avoid-step.tsx` — free-text textarea for foods to avoid (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render

### Steps 4-6
- [x] Create `src/routes/onboarding/meals.tsx` + `src/components/onboarding/meals-step.tsx` — meals-per-week slider (3-14), household size input (1-10) (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render
- [x] Create `src/routes/onboarding/cooking.tsx` + `src/components/onboarding/cooking-step.tsx` — max prep time slider (15-120 min), equipment checkbox grid (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render
- [x] Create `src/routes/onboarding/generate.tsx` + `src/components/onboarding/generate-step.tsx` — review summary, "Generate My First Meal Plan" button triggering generation, calls `completeOnboarding`, redirects to `/plan/:weekStart` (invoke `frontend-design` and `shadcn` skills)
  - Route `loader` uses `createServerFn` to prefetch current preferences server-side for instant render
- [x] Handle skip-all flow: defaults work seamlessly at step 6

---

## Phase 3 — Core Meal Plan Flow
> Accept/reject meals, regenerate rejected ones, wire real preferences into prompts, enforce credits.

### Meal Plan Page + Accept/Reject
- [x] Create `src/routes/plan/$weekStart.tsx` — `loader` uses `createServerFn` to fetch the meal plan and its meals server-side for SSR initial render; client hydrates with `convexQuery(api.mealPlans.getByUserAndWeek)` and `convexQuery(api.meals.getByMealPlan)` for reactive updates during generation; prompt to generate if no plan exists (invoke `frontend-design` and `shadcn` skills)
- [x] Update `src/components/meals/meal-card.tsx` — add accept/reject buttons with visual states (green border accepted, dimmed rejected) (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/meals/generation-status.tsx` — status banner (generating/reviewing/finalized) with accepted count (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/layout/header.tsx` — app name + credits remaining badge (reactive) (invoke `frontend-design` and `shadcn` skills)

### Credits + Generation Logging
- [x] Create `convex/generationLogs.ts` — `create` mutation, `getByUser` query
- [x] Add credit enforcement to generation server routes: check `generationsRemaining > 0` before AI call, `decrementCredits` + log on success, log with `status: "failed"` and no charge on failure
- [x] Add "out of credits" UI: disable generate buttons, show message when `generationsRemaining === 0` (invoke `frontend-design` and `shadcn` skills)

### Regenerate Rejected Meals
- [x] Create `src/routes/api/ai/regenerate-meals.ts` — POST route: queries accepted meals for context, generates replacements for rejected meals, writes to Convex, decrements credits
- [x] Add `deleteByMealPlanAndStatus` and `batchCreate` mutations to `convex/meals.ts`
- [x] Add "Regenerate Rejected" button to plan page, visible when rejected meals exist (invoke `frontend-design` and `shadcn` skills)

### Real Preferences in AI Prompts
- [x] Update `src/lib/ai/prompts.ts` — replace hardcoded preferences with dynamic `buildMealSuggestionsPrompt(preferences, acceptedMeals?)` using all preference fields
- [x] Update both generation server routes to fetch user preferences from Convex and pass to prompt builder

---

## Phase 4 — Prep Guide + Full Recipes
> Generate complete recipes, shopping lists, and batch prep steps for finalized meal plans.

### Prep Guide Generation
- [x] Add prep guide Zod schemas to `src/lib/ai/schemas.ts` — `fullRecipeSchema`, `shoppingListItemSchema`, `batchPrepStepSchema`, `prepGuideOutputSchema`
- [x] Add `buildPrepGuidePrompt(acceptedMeals, householdSize)` to `src/lib/ai/prompts.ts`
- [x] Create `src/routes/api/ai/generate-prep.ts` — POST route: queries accepted meals, calls `generateObject` with `prepGuideOutputSchema`, updates each meal's `fullRecipe`, creates `prepGuides` doc, finalizes plan, decrements credits
- [x] Create `convex/prepGuides.ts` — `create` mutation, `getByMealPlan` query; add `updateFullRecipe` mutation to `convex/meals.ts`

### Prep Guide UI
- [x] Create `src/routes/plan/$weekStart/prep.tsx` — `loader` uses `createServerFn` to fetch prep guide, accepted meals, and full recipes server-side for SSR; prep guide view with three tabbed sections (Recipes, Shopping List, Prep Steps) (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/prep/recipe-card.tsx` — full recipe display (ingredients, instructions, nutrition) (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/prep/shopping-list.tsx` — categorized checklist (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/prep/prep-steps.tsx` — numbered batch prep steps with related meal badges (invoke `frontend-design` and `shadcn` skills)

### Finalization Flow
- [x] Add "Generate Prep Guide" button to plan page (visible when all meals accepted) (invoke `frontend-design` and `shadcn` skills)
- [x] Add "View Prep Guide" navigation after finalization (invoke `frontend-design` and `shadcn` skills)

---

## Phase 5 — Home, Navigation, Preferences, Account
> App shell, home screen with plan history, preferences editing, account page.

### App Shell + Navigation
- [x] Create `src/components/layout/app-shell.tsx` — mobile bottom nav + desktop sidebar layout (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/layout/nav.tsx` — route links (Home, Preferences, Account), active state, inline credits (invoke `frontend-design` and `shadcn` skills)
- [x] Update `src/routes/__root.tsx` — wrap authenticated routes with `AppShell`

### Home Screen
- [x] Update `src/routes/index.tsx` — `loader` uses `createServerFn` to fetch user's meal plans server-side for SSR; current week plan card (or generate CTA), quick action buttons, past plans list; `convexQuery()` for reactive updates post-hydration (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/plan/plan-summary.tsx` — compact card (week range, meal count, status badge, link) (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/components/plan/past-plans-list.tsx` — scrollable list of past plans via `api.mealPlans.getByUser` (invoke `frontend-design` and `shadcn` skills)

### Preferences + Account Pages
- [x] Create `src/routes/preferences.tsx` — `loader` uses `createServerFn` to fetch current preferences server-side for SSR; single-page edit view reusing onboarding form components in collapsible sections (invoke `frontend-design` and `shadcn` skills)
- [x] Create `src/routes/account.tsx` — `loader` uses `createServerFn` to fetch user info and generation history server-side for SSR; credits remaining, sign-out button (invoke `frontend-design` and `shadcn` skills)
- [x] Add plan archiving: "Archive" button calling `api.mealPlans.updateStatus` with `"archived"`

---

## Phase 6 — Polish + Error Handling
> Error boundaries, mobile responsiveness, loading/empty states, tests.

### Error Handling
- [x] Create reusable error boundary component with "Try again" button (invoke `frontend-design` and `shadcn` skills)
- [ ] Extract shared retry logic into `src/lib/ai/generate.ts` utility, apply consistently across all 3 AI server routes
- [ ] Add client-side error states: toast/alert on fetch failures, "Retry" buttons (invoke `frontend-design` and `shadcn` skills)

### Mobile + Loading States
- [ ] Audit all components for mobile layout (stacking, full-width steps, responsive grids) (invoke `frontend-design` skill)
- [ ] Add `Suspense` boundaries with skeleton fallbacks at route level
- [ ] Add empty states for: no plans, no preferences, no history, no credits (invoke `frontend-design` and `shadcn` skills)

### Testing
- [ ] Unit tests for Zod schemas (valid/invalid data, edge cases)
- [ ] Unit tests for prompt builders (various preference combos, regeneration context)
- [ ] Unit tests for Convex functions (credit decrement, status transitions, index queries)
- [ ] Integration tests for core flows (mock AI responses, verify Convex state transitions)

---

## Key Architecture Notes

> **AI SDK pattern**: Uses `streamText()` with `Output.array({ element: schema })` and `elementStream` — not the older `streamObject()`. Each validated element is written to Convex individually.

> **Server routes (POST handlers) for AI endpoints**: AI streaming endpoints use `createFileRoute` with `server: { handlers: { POST } }` to return proper `Response` objects. These are NOT `createServerFn` — they need raw request/response control for streaming.

> **Route `loader` functions with `createServerFn` for SSR**: Page routes use TanStack Start `loader` functions that call `createServerFn` helpers to fetch data server-side (meal plans, preferences, user data). This provides SSR with full HTML on first render. The `createServerFn` helpers use `ConvexHttpClient` to query Convex from the server, with the auth token forwarded from `beforeLoad` context.

> **`convexQuery()` reactive subscriptions for real-time UI**: After SSR hydration, the client establishes Convex reactive subscriptions via `convexQuery()`. This powers live updates — e.g., meals appearing one by one during AI generation, credits decrementing in real time. The pattern is: **SSR for initial render, Convex reactivity for live updates.**

> **`ConvexHttpClient` for server-side operations**: Used in both TanStack Start server routes (AI endpoints) and `createServerFn` (SSR loaders) to call Convex queries and mutations from outside the Convex runtime.

> **Credits enforced server-side**: Check and decrement in server routes, not client, preventing bypass.

## Verification

- **Tracer bullet**: Click "Generate Meals" → meals appear one-by-one in UI via Convex reactivity → plan status transitions to "reviewing"
- **Auth**: Sign up email + Google, login/logout, session persistence, protected route redirects
- **Onboarding**: Complete wizard, skip all (verify defaults), edit preferences after
- **Generation**: Generate meals, verify streaming, verify credit decrement, verify generation log
- **Review**: Accept/reject meals, regenerate rejected, verify no duplicates
- **Prep guide**: Generate prep guide, verify full recipes + shopping list + batch steps
- **Credits**: 25 initial, decrement on success, no charge on failure, enforcement at 0
- **Run `bun run test`** to verify all unit and integration tests pass
