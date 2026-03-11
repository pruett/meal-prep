# MealPrep — Application Architecture Plan (MVP)

## Context

Building a greenfield web application (codename "MealPrep") that allows users to define food preferences and generates personalized weekly meal plans with batch prep instructions using AI. Users get 25 free AI generations to start.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Package Manager | bun |
| Linter | Oxlint (https://oxc.rs/docs/guide/usage/linter.html) |
| Formatter | Oxfmt (https://oxc.rs/docs/guide/usage/formatter.html) |
| Testing | Vitest (https://vitest.dev/) |
| Framework | TanStack Start (full-stack React, Vinxi, type-safe routing) |
| Database | Convex (reactive document DB, server functions) |
| Auth | better-auth with Convex adapter (email + Google OAuth) |
| AI | Vercel AI SDK (`ai` package) — OpenAI + Anthropic providers |
| Styling | Tailwind CSS + shadcn/ui |
| Design | Mobile-first, responsive |
| Deployment | TBD |

---

## Data Model (Convex Schema — Normalized)

### `users`
- `betterAuthId`: string (links to better-auth)
- `email`: string
- `name`: string
- `generationsRemaining`: number (default: 25)
- `onboardingCompleted`: boolean
- `createdAt`: number

### `preferences`
- `userId`: Id<"users">
- `dietaryRestrictions`: string[] (from predefined list: vegan, vegetarian, pescatarian, keto, paleo, gluten-free, dairy-free, halal, kosher, low-sodium, low-carb, nut-free)
- `cuisinePreferences`: array of { cuisine: string, preference: "like" | "neutral" | "dislike" }
- `mealsPerWeek`: number (default: 5)
- `householdSize`: number (default: 2)
- `maxPrepTimeMinutes`: number (default: 60)
- `kitchenEquipment`: string[] (from predefined list: oven, stovetop, microwave, slow-cooker, instant-pot, air-fryer, grill, blender, food-processor)
- `foodsToAvoid`: string (free-text field, e.g. "cilantro, mushrooms, blue cheese")

### `mealPlans`
- `userId`: Id<"users">
- `weekStartDate`: string (ISO date, Monday of the week)
- `status`: "generating" | "reviewing" | "finalized" | "archived"
- `totalMealsRequested`: number
- `createdAt`: number

### `meals`
- `mealPlanId`: Id<"mealPlans">
- `userId`: Id<"users">
- `name`: string
- `description`: string
- `keyIngredients`: string[]
- `estimatedPrepMinutes`: number
- `status`: "pending" | "accepted" | "rejected"
- `fullRecipe`: object | null (populated when prep guide is generated)
  - `ingredients`: array of { name, quantity, unit }
  - `instructions`: string[]
  - `nutritionEstimate`: { calories, protein, carbs, fat } | null
- `sortOrder`: number

### `prepGuides`
- `mealPlanId`: Id<"mealPlans">
- `userId`: Id<"users">
- `shoppingList`: array of { item, quantity, unit, category }
- `batchPrepSteps`: array of { stepNumber, instruction, estimatedMinutes, relatedMeals: string[] }
- `totalEstimatedMinutes`: number
- `createdAt`: number

### `generationLogs`
- `userId`: Id<"users">
- `type`: "meal-suggestions" | "meal-regeneration" | "prep-guide"
- `provider`: "openai" | "anthropic"
- `creditsUsed`: number (always 1)
- `status`: "success" | "failed"
- `createdAt`: number

---

## Onboarding Wizard Steps

1. **Dietary Restrictions** — Checkbox grid of predefined restrictions
2. **Cuisine Preferences** — List of cuisines with like/neutral/dislike toggles
3. **Foods to Avoid** — Free-text input (e.g. "cilantro, mushrooms, blue cheese")
4. **Meal Planning** — Meals per week slider + household size input
5. **Cooking Setup** — Max prep time slider + kitchen equipment checkboxes
6. **Generate** — Review summary + generate first meal plan

All steps skippable. Default profile seeded on signup: no restrictions, all cuisines neutral, no foods to avoid, 5 meals/week, 2 people, 60 min max, standard equipment (oven, stovetop, microwave).

---

## Core User Flows

### Flow 1: Generate Meal Suggestions (1 generation)
1. User clicks "Generate Plan" (or auto-triggered after onboarding)
2. TanStack Start server function invokes Vercel AI SDK `streamObject()` with Zod schema
3. AI prompt includes: all user preferences, current week context
4. As meals stream in, server function writes each meal to Convex via Convex client
5. Convex reactive query updates the UI in real-time — meals appear one by one
6. MealPlan status transitions: `generating` → `reviewing`
7. On success: decrement `generationsRemaining`, log to `generationLogs`

### Flow 2: Review & Curate
1. User sees all generated meal summaries
2. Can accept or reject each meal individually
3. Rejected meals can be regenerated (Flow 3)
4. Once all slots are accepted → user can request prep guide (Flow 4)

### Flow 3: Regenerate Rejected Meals (1 generation per batch)
1. User clicks "Regenerate" for rejected meals
2. AI receives full context: accepted meals (for variety), user preferences
3. New meals stream in and replace rejected ones
4. Decrement credits, log generation

### Flow 4: Generate Prep Guide + Full Recipes (1 generation)
1. User finalizes meal selection, clicks "Generate Prep Guide"
2. AI generates in one call: full recipes for ALL accepted meals + consolidated shopping list + batch prep steps
3. Results written to Convex: update each meal's `fullRecipe` field + create `prepGuides` document
4. MealPlan status → `finalized`
5. Decrement credits, log generation

### Error Handling
- AI failures: auto-retry up to 2 times, no credit charge on failure
- After 3 failures: show error, let user manually retry
- Failed generations logged with `status: "failed"` (no credit deducted)

---

## AI Streaming Architecture

```
Client (React)                    TanStack Server Function              Convex
     |                                      |                             |
     |-- call server function ------------->|                             |
     |                                      |-- streamObject() via AI SDK |
     |                                      |<--- streaming chunks -------|
     |                                      |                             |
     |                                      |-- write meal to Convex ---->|
     |<-- reactive query auto-updates ------|                             |
     |                                      |-- write next meal --------->|
     |<-- reactive query auto-updates ------|                             |
     |                                      |                             |
     |                                      |-- decrement credits ------->|
     |<-- credits query auto-updates -------|                             |
```

Key architectural choice: AI SDK runs in TanStack Start server functions (not Convex actions), because the AI SDK is designed for Node.js server environments. Convex handles reactive data sync to the client.

---

## AI Prompt Strategy

### Meal Suggestions Prompt
- System prompt: role as a professional meal planner and chef
- Include: all dietary restrictions, cuisine preferences (with like/dislike weights), foods to avoid, household size, max prep time, available equipment, meals per week
- Include: already-accepted meals (for regeneration context)
- Output schema (Zod): array of meal summary objects with name, description, keyIngredients, estimatedPrepMinutes

### Prep Guide + Full Recipes Prompt
- Include: all accepted meal summaries
- Include: household size for scaling
- Output schema (Zod): object with fullRecipes array, shoppingList array, batchPrepSteps array

---

## Page Structure (TanStack Start Routes)

```
/                          → Home (current week plan, past plans, quick actions)
/auth/login                → Login page
/auth/signup               → Signup page
/onboarding                → Multi-step wizard
/onboarding/diet           → Step 1: Dietary restrictions
/onboarding/cuisines       → Step 2: Cuisine preferences
/onboarding/avoid          → Step 3: Foods to avoid
/onboarding/meals          → Step 4: Meals/week + household
/onboarding/cooking        → Step 5: Time + equipment
/onboarding/generate       → Step 6: Review + generate
/plan/:weekStart            → Meal plan for a specific week
/plan/:weekStart/prep       → Prep guide view
/preferences               → Edit preferences (all sections)
/account                   → Account settings, credits remaining
```

---

## Home Screen

- Displays current week's meal plan (or prompt to generate one)
- Quick action buttons: "Edit Preferences", "Generate New Plan"
- List of past meal plans with option to view or remove
- Credits remaining badge visible in header/nav

---

## Generation Credits System

- **Initial**: 25 free generations on signup
- **Counter**: `users.generationsRemaining` field for fast reads
- **Audit log**: `generationLogs` table for full history
- **Charging**: only on successful AI completion (after retries)
- **Enforcement**: check credits > 0 before initiating any AI call; show "out of credits" message when depleted

---

## Implementation Phases

### Phase 1: Foundation
- Initialize TanStack Start project
- Set up Convex with schema
- Configure better-auth with Convex adapter (email + Google)
- Set up Tailwind + shadcn/ui
- Basic layout, nav, auth pages

### Phase 2: Preferences
- Onboarding wizard (all 6 steps)
- Preferences page (edit mode)
- Default profile seeding on signup

### Phase 3: Meal Generation
- Vercel AI SDK integration (OpenAI + Anthropic)
- Zod schemas for AI output
- Meal plan generation flow (streaming to Convex)
- Meal review UI (accept/reject per meal)
- Regeneration flow with context
- Generation credit tracking

### Phase 4: Prep Guide
- Prep guide generation (full recipes + shopping list + batch steps)
- Prep guide display UI
- Meal plan finalization flow

### Phase 5: History & Polish
- Past plan browsing and removal
- Home screen with plan history
- Credits remaining display
- Error states and edge cases

---

## Verification

- **Auth**: Sign up with email, sign up with Google, login/logout, session persistence
- **Onboarding**: Complete wizard, skip wizard (verify defaults applied), edit preferences after
- **Generation**: Generate meals, verify streaming appears in UI, verify credit decrement, verify generation log entry
- **Review**: Accept/reject meals, regenerate rejected, verify context awareness (no duplicates)
- **Prep Guide**: Generate prep guide, verify full recipes populated, shopping list correct, batch steps reference correct meals
- **Credits**: Verify 25 initial, verify decrement on success, verify no charge on failure/retry, verify enforcement when depleted
