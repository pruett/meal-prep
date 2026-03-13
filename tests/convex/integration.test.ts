import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import {
  api,
  schema,
  modules,
  createTestUser,
  createUserWithPreferences,
  createUserPlanAndMeals,
} from './test_helpers'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

// ---------------------------------------------------------------------------
// 1. Generate Meals Flow
// ---------------------------------------------------------------------------

describe('integration: generate meals flow', () => {
  it('full flow: create plan → stream meals → transition to reviewing → decrement credits → log', async () => {
    const t = convexTest(schema, modules)
    const userId = await createUserWithPreferences(t)

    // Verify initial credits
    const userBefore = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userBefore!.generationsRemaining).toBe(25)

    // Step 1: Create meal plan (simulates what generate-meals route does first)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 5,
    })
    const planAfterCreate = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planAfterCreate!.status).toBe('generating')

    // Step 2: Create meals one by one (simulates streaming elementStream)
    const mealNames = [
      'Chicken Stir Fry',
      'Pasta Primavera',
      'Black Bean Tacos',
      'Salmon Bowl',
      'Veggie Curry',
    ]
    for (let i = 0; i < mealNames.length; i++) {
      await t.mutation(api.meals.create, {
        mealPlanId: planId,
        userId,
        name: mealNames[i],
        description: `A delicious ${mealNames[i].toLowerCase()}`,
        keyIngredients: ['ingredient-1', 'ingredient-2', 'ingredient-3'],
        estimatedPrepMinutes: 30,
        sortOrder: i,
      })
    }

    // Verify meals are queryable mid-generation
    const mealsDuringGen = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(mealsDuringGen).toHaveLength(5)
    expect(mealsDuringGen[0].name).toBe('Chicken Stir Fry')
    expect(mealsDuringGen[4].name).toBe('Veggie Curry')

    // Step 3: Transition plan to reviewing
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    const planAfterReview = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planAfterReview!.status).toBe('reviewing')

    // Step 4: Decrement credits
    await t.mutation(api.users.decrementCredits, { id: userId })
    const userAfter = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userAfter!.generationsRemaining).toBe(24)

    // Step 5: Log the generation
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      type: 'meal-suggestions',
      status: 'success',
      creditsUsed: 1,
    })
  })

  it('meals appear in sort order regardless of creation order', async () => {
    const t = convexTest(schema, modules)
    const userId = await createUserWithPreferences(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 3,
    })

    // Create out of order (simulates network reordering)
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      name: 'Third',
      description: 'Third meal',
      keyIngredients: ['c'],
      estimatedPrepMinutes: 30,
      sortOrder: 2,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      name: 'First',
      description: 'First meal',
      keyIngredients: ['a'],
      estimatedPrepMinutes: 20,
      sortOrder: 0,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      name: 'Second',
      description: 'Second meal',
      keyIngredients: ['b'],
      estimatedPrepMinutes: 25,
      sortOrder: 1,
    })

    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals.map((m) => m.name)).toEqual(['First', 'Second', 'Third'])
  })

  it('plan appears in user plan list after creation', async () => {
    const t = convexTest(schema, modules)
    const userId = await createUserWithPreferences(t)

    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    const plans = await t.query(api.mealPlans.getByUser, { userId })
    expect(plans).toHaveLength(1)
    expect(plans[0]._id).toEqual(planId)

    const byWeek = await t.query(api.mealPlans.getByUserAndWeek, {
      userId,
      weekStartDate: '2026-03-09',
    })
    expect(byWeek).not.toBeNull()
    expect(byWeek!._id).toEqual(planId)
  })
})

// ---------------------------------------------------------------------------
// 2. Accept/Reject + Regenerate Meals Flow
// ---------------------------------------------------------------------------

describe('integration: accept/reject and regenerate flow', () => {
  it('full flow: accept some, reject some → delete rejected → generate replacements → back to reviewing', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId, mealIds } = await createUserPlanAndMeals(t, {
      mealCount: 5,
    })

    // Transition to reviewing (generation complete)
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })

    // Accept meals 0, 1, 2; reject meals 3, 4
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.meals.updateStatus, {
        id: mealIds[i],
        status: 'accepted',
      })
    }
    for (let i = 3; i < 5; i++) {
      await t.mutation(api.meals.updateStatus, {
        id: mealIds[i],
        status: 'rejected',
      })
    }

    // Verify state before regeneration
    const mealsBeforeRegen = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    const accepted = mealsBeforeRegen.filter((m) => m.status === 'accepted')
    const rejected = mealsBeforeRegen.filter((m) => m.status === 'rejected')
    expect(accepted).toHaveLength(3)
    expect(rejected).toHaveLength(2)

    // Step 1: Delete rejected meals (simulates regenerate-meals route)
    const deletedCount = await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'rejected',
    })
    expect(deletedCount).toBe(2)

    // Step 2: Set plan back to generating
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'generating',
    })

    // Step 3: Create replacement meals with sortOrder continuing from existing
    const maxSort = Math.max(...accepted.map((m) => m.sortOrder))
    const replacements = [
      { name: 'Replacement Meal A', sortOrder: maxSort + 1 },
      { name: 'Replacement Meal B', sortOrder: maxSort + 2 },
    ]
    for (const r of replacements) {
      await t.mutation(api.meals.create, {
        mealPlanId: planId,
        userId,
        name: r.name,
        description: `Fresh ${r.name.toLowerCase()}`,
        keyIngredients: ['new-ingredient'],
        estimatedPrepMinutes: 35,
        sortOrder: r.sortOrder,
      })
    }

    // Step 4: Back to reviewing
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })

    // Step 5: Decrement credits + log
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-regeneration',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // Verify final state
    const planFinal = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planFinal!.status).toBe('reviewing')

    const mealsFinal = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(mealsFinal).toHaveLength(5) // 3 accepted + 2 replacements
    expect(mealsFinal.filter((m) => m.status === 'accepted')).toHaveLength(3)
    expect(mealsFinal.filter((m) => m.status === 'pending')).toHaveLength(2)

    // Replacement meals have higher sort orders
    const pendingMeals = mealsFinal.filter((m) => m.status === 'pending')
    expect(pendingMeals[0].name).toBe('Replacement Meal A')
    expect(pendingMeals[1].name).toBe('Replacement Meal B')

    const userFinal = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userFinal!.generationsRemaining).toBe(24)
  })

  it('regenerate failure: plan reverts to reviewing, no credit charged', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId, mealIds } = await createUserPlanAndMeals(t, {
      mealCount: 3,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[0],
      status: 'accepted',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[1],
      status: 'rejected',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[2],
      status: 'rejected',
    })

    // Delete rejected
    await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'rejected',
    })

    // Set to generating
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'generating',
    })

    // Simulate failure: revert plan to reviewing (onFailure callback)
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })

    // Log failure with no credits charged
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-regeneration',
      provider: 'openai',
      creditsUsed: 0,
      status: 'failed',
    })

    // Verify: plan back to reviewing, credits unchanged, failure logged
    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan!.status).toBe('reviewing')

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(25)

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      status: 'failed',
      creditsUsed: 0,
    })

    // Only the accepted meal remains
    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals).toHaveLength(1)
    expect(meals[0].status).toBe('accepted')
  })

  it('accept all meals then change mind: reject and re-accept', async () => {
    const t = convexTest(schema, modules)
    const { planId, mealIds } = await createUserPlanAndMeals(t, {
      mealCount: 3,
    })
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })

    // Accept all
    for (const id of mealIds) {
      await t.mutation(api.meals.updateStatus, { id, status: 'accepted' })
    }

    // Change mind: reject one
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[1],
      status: 'rejected',
    })

    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals.filter((m) => m.status === 'accepted')).toHaveLength(2)
    expect(meals.filter((m) => m.status === 'rejected')).toHaveLength(1)

    // Re-accept
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[1],
      status: 'accepted',
    })

    const mealsAfter = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(mealsAfter.every((m) => m.status === 'accepted')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Prep Guide Generation Flow
// ---------------------------------------------------------------------------

describe('integration: prep guide flow', () => {
  it('full flow: all accepted → add recipes → create prep guide → finalize plan → decrement credits', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId, mealIds } = await createUserPlanAndMeals(t, {
      mealCount: 3,
    })

    // Transition to reviewing and accept all meals
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    for (const id of mealIds) {
      await t.mutation(api.meals.updateStatus, { id, status: 'accepted' })
    }

    // Step 1: Update each meal's fullRecipe (simulates generate-prep route)
    const recipes = [
      {
        ingredients: [
          { name: 'chicken', quantity: '1', unit: 'lb' },
          { name: 'rice', quantity: '2', unit: 'cups' },
        ],
        instructions: ['Season chicken', 'Cook rice', 'Combine and serve'],
        nutritionEstimate: { calories: 450, protein: 35, carbs: 40, fat: 12 },
      },
      {
        ingredients: [
          { name: 'pasta', quantity: '8', unit: 'oz' },
          { name: 'vegetables', quantity: '2', unit: 'cups' },
        ],
        instructions: ['Boil pasta', 'Saute vegetables', 'Toss together'],
        nutritionEstimate: { calories: 380, protein: 15, carbs: 55, fat: 10 },
      },
      {
        ingredients: [
          { name: 'black beans', quantity: '1', unit: 'can' },
          { name: 'tortillas', quantity: '6', unit: 'count' },
        ],
        instructions: ['Heat beans', 'Warm tortillas', 'Assemble tacos'],
        nutritionEstimate: { calories: 320, protein: 18, carbs: 45, fat: 8 },
      },
    ]

    for (let i = 0; i < mealIds.length; i++) {
      await t.mutation(api.meals.updateFullRecipe, {
        id: mealIds[i],
        fullRecipe: recipes[i],
      })
    }

    // Verify recipes are attached
    const mealsWithRecipes = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    for (const meal of mealsWithRecipes) {
      expect(meal.fullRecipe).not.toBeNull()
      expect(meal.fullRecipe!.ingredients.length).toBeGreaterThan(0)
      expect(meal.fullRecipe!.instructions.length).toBeGreaterThan(0)
      expect(meal.fullRecipe!.nutritionEstimate).not.toBeNull()
    }

    // Step 2: Create prep guide
    const prepGuideId = await t.mutation(api.prepGuides.create, {
      mealPlanId: planId,
      userId,
      shoppingList: [
        { item: 'Chicken', quantity: '1', unit: 'lb', category: 'Meat & Seafood' },
        { item: 'Rice', quantity: '2', unit: 'cups', category: 'Pantry' },
        { item: 'Pasta', quantity: '8', unit: 'oz', category: 'Pantry' },
        { item: 'Black Beans', quantity: '1', unit: 'can', category: 'Pantry' },
        { item: 'Vegetables', quantity: '2', unit: 'cups', category: 'Produce' },
        { item: 'Tortillas', quantity: '6', unit: 'count', category: 'Bakery' },
      ],
      batchPrepSteps: [
        {
          stepNumber: 1,
          instruction: 'Cook rice in bulk',
          estimatedMinutes: 20,
          relatedMeals: ['Meal 1'],
        },
        {
          stepNumber: 2,
          instruction: 'Season and grill chicken',
          estimatedMinutes: 25,
          relatedMeals: ['Meal 1'],
        },
        {
          stepNumber: 3,
          instruction: 'Prep and chop vegetables',
          estimatedMinutes: 15,
          relatedMeals: ['Meal 2', 'Meal 3'],
        },
      ],
      totalEstimatedMinutes: 60,
    })

    // Step 3: Finalize the plan
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'finalized',
    })

    // Step 4: Decrement credits + log
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'prep-guide',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // Verify final state
    const planFinal = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planFinal!.status).toBe('finalized')

    const prepGuide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(prepGuide).not.toBeNull()
    expect(prepGuide!._id).toEqual(prepGuideId)
    expect(prepGuide!.shoppingList).toHaveLength(6)
    expect(prepGuide!.batchPrepSteps).toHaveLength(3)
    expect(prepGuide!.totalEstimatedMinutes).toBe(60)

    const userFinal = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userFinal!.generationsRemaining).toBe(24)

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      type: 'prep-guide',
      status: 'success',
    })
  })

  it('prep guide not created until plan is finalized', async () => {
    const t = convexTest(schema, modules)
    const { planId } = await createUserPlanAndMeals(t, { mealCount: 2 })

    // Plan is still generating — no prep guide
    const prepGuide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(prepGuide).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 4. Credit Enforcement Flow
// ---------------------------------------------------------------------------

describe('integration: credit enforcement', () => {
  it('user starts with 25 credits, each generation costs 1', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const user0 = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user0!.generationsRemaining).toBe(25)

    // Simulate 3 generations
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.users.decrementCredits, { id: userId })
    }

    const user3 = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user3!.generationsRemaining).toBe(22)
  })

  it('cannot generate when credits are 0', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    // Burn all 25 credits
    for (let i = 0; i < 25; i++) {
      await t.mutation(api.users.decrementCredits, { id: userId })
    }

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(0)

    // Next decrement should throw
    await expect(
      t.mutation(api.users.decrementCredits, { id: userId }),
    ).rejects.toThrow('No credits remaining')
  })

  it('failed generation does not decrement credits', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    // Log a failed generation (no credit decrement)
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 0,
      status: 'failed',
    })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(25)

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs[0].creditsUsed).toBe(0)
  })

  it('multiple generation types each cost 1 credit', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    // meal-suggestions
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // meal-regeneration
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-regeneration',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // prep-guide
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'prep-guide',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(22)

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(3)
    expect(logs.every((l) => l.status === 'success' && l.creditsUsed === 1)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. User Onboarding Flow
// ---------------------------------------------------------------------------

describe('integration: user onboarding flow', () => {
  it('full flow: signup → create preferences → update through wizard steps → complete onboarding', async () => {
    const t = convexTest(schema, modules)

    // Step 1: Create user (simulates signup)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-onboard-test',
      email: 'onboard@example.com',
      name: 'New User',
    })
    const userAfterSignup = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userAfterSignup!.onboardingCompleted).toBe(false)
    expect(userAfterSignup!.generationsRemaining).toBe(25)

    // Step 2: Create default preferences (seeded on signup)
    await t.mutation(api.preferences.create, { userId })
    const defaultPrefs = await t.query(api.preferences.getByUser, { userId })
    expect(defaultPrefs).not.toBeNull()
    expect(defaultPrefs!.mealsPerWeek).toBe(7)
    expect(defaultPrefs!.householdSize).toBe(2)
    expect(defaultPrefs!.dietaryRestrictions).toEqual([])

    // Step 3: Diet step — set dietary restrictions
    await t.mutation(api.preferences.update, {
      userId,
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
    })

    // Step 4: Cuisines step — set cuisine preferences
    await t.mutation(api.preferences.update, {
      userId,
      cuisinePreferences: [
        { cuisine: 'Italian', preference: 'like' as const },
        { cuisine: 'Thai', preference: 'like' as const },
        { cuisine: 'French', preference: 'neutral' as const },
        { cuisine: 'Indian', preference: 'dislike' as const },
      ],
    })

    // Step 5: Avoid step — set foods to avoid
    await t.mutation(api.preferences.update, {
      userId,
      foodsToAvoid: 'mushrooms, cilantro',
    })

    // Step 6: Meals step — set meals per week and household size
    await t.mutation(api.preferences.update, {
      userId,
      mealsPerWeek: 5,
      householdSize: 4,
    })

    // Step 7: Cooking step — set max prep time and equipment
    await t.mutation(api.preferences.update, {
      userId,
      maxPrepTimeMinutes: 60,
      kitchenEquipment: ['oven', 'slow-cooker', 'blender'],
    })

    // Step 8: Complete onboarding
    await t.mutation(api.users.completeOnboarding, { id: userId })

    // Verify final state
    const userFinal = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userFinal!.onboardingCompleted).toBe(true)

    const prefsFinal = await t.query(api.preferences.getByUser, { userId })
    expect(prefsFinal).toMatchObject({
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
      cuisinePreferences: [
        { cuisine: 'Italian', preference: 'like' },
        { cuisine: 'Thai', preference: 'like' },
        { cuisine: 'French', preference: 'neutral' },
        { cuisine: 'Indian', preference: 'dislike' },
      ],
      foodsToAvoid: 'mushrooms, cilantro',
      mealsPerWeek: 5,
      householdSize: 4,
      maxPrepTimeMinutes: 60,
      kitchenEquipment: ['oven', 'slow-cooker', 'blender'],
    })
  })

  it('skip-all flow: default preferences work without updates', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })
    await t.mutation(api.users.completeOnboarding, { id: userId })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.onboardingCompleted).toBe(true)

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs).toMatchObject({
      dietaryRestrictions: [],
      cuisinePreferences: [],
      mealsPerWeek: 7,
      householdSize: 2,
      maxPrepTimeMinutes: 45,
      kitchenEquipment: [],
      foodsToAvoid: '',
    })
  })
})

// ---------------------------------------------------------------------------
// 6. Full Lifecycle: Generate → Review → Regenerate → Finalize → Archive
// ---------------------------------------------------------------------------

describe('integration: full meal plan lifecycle', () => {
  it('complete lifecycle: generate → review → regenerate → accept all → prep guide → finalize → archive', async () => {
    const t = convexTest(schema, modules)
    const userId = await createUserWithPreferences(t)

    // === GENERATE ===
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 4,
    })

    const mealIds = []
    for (let i = 0; i < 4; i++) {
      const id = await t.mutation(api.meals.create, {
        mealPlanId: planId,
        userId,
        name: `Original Meal ${i + 1}`,
        description: `Desc ${i + 1}`,
        keyIngredients: ['ingredient'],
        estimatedPrepMinutes: 30,
        sortOrder: i,
      })
      mealIds.push(id)
    }
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // === REVIEW: accept 2, reject 2 ===
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[0],
      status: 'accepted',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[1],
      status: 'accepted',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[2],
      status: 'rejected',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealIds[3],
      status: 'rejected',
    })

    // === REGENERATE ===
    await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'rejected',
    })
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'generating',
    })

    const newMealIds = []
    for (let i = 0; i < 2; i++) {
      const id = await t.mutation(api.meals.create, {
        mealPlanId: planId,
        userId,
        name: `Replacement ${i + 1}`,
        description: `New desc ${i + 1}`,
        keyIngredients: ['new-ingredient'],
        estimatedPrepMinutes: 25,
        sortOrder: 4 + i,
      })
      newMealIds.push(id)
    }
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-regeneration',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // === ACCEPT ALL remaining ===
    for (const id of newMealIds) {
      await t.mutation(api.meals.updateStatus, { id, status: 'accepted' })
    }

    const allMeals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(allMeals).toHaveLength(4)
    expect(allMeals.every((m) => m.status === 'accepted')).toBe(true)

    // === PREP GUIDE ===
    for (const meal of allMeals) {
      await t.mutation(api.meals.updateFullRecipe, {
        id: meal._id,
        fullRecipe: {
          ingredients: [{ name: 'item', quantity: '1', unit: 'cup' }],
          instructions: ['Step 1', 'Step 2'],
          nutritionEstimate: { calories: 400, protein: 25, carbs: 45, fat: 15 },
        },
      })
    }
    await t.mutation(api.prepGuides.create, {
      mealPlanId: planId,
      userId,
      shoppingList: [
        { item: 'item', quantity: '4', unit: 'cups', category: 'Pantry' },
      ],
      batchPrepSteps: [
        {
          stepNumber: 1,
          instruction: 'Prep all items',
          estimatedMinutes: 30,
          relatedMeals: ['Original Meal 1', 'Original Meal 2', 'Replacement 1', 'Replacement 2'],
        },
      ],
      totalEstimatedMinutes: 30,
    })
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'finalized',
    })
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'prep-guide',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    // Verify finalized state
    const planFinalized = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planFinalized!.status).toBe('finalized')

    const prepGuide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(prepGuide).not.toBeNull()

    const finalMeals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(finalMeals.every((m) => m.fullRecipe !== null)).toBe(true)

    // === ARCHIVE ===
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'archived',
    })
    const planArchived = await t.run(async (ctx) => ctx.db.get(planId))
    expect(planArchived!.status).toBe('archived')

    // Verify credit accounting: 25 - 3 = 22
    const userFinal = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userFinal!.generationsRemaining).toBe(22)

    // Verify generation history: 3 successful logs
    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(3)
    expect(logs.map((l) => l.type)).toEqual([
      'prep-guide',
      'meal-regeneration',
      'meal-suggestions',
    ])
    expect(logs.every((l) => l.status === 'success')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. Multi-user Isolation
// ---------------------------------------------------------------------------

describe('integration: multi-user isolation', () => {
  it('users cannot see each other plans, meals, or preferences', async () => {
    const t = convexTest(schema, modules)

    // Create two users with full setup
    const user1 = await createUserWithPreferences(t)
    const user2 = await createUserWithPreferences(t)

    // User 1 creates a plan with meals
    const plan1 = await t.mutation(api.mealPlans.create, {
      userId: user1,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 3,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: plan1,
      userId: user1,
      name: 'User 1 Meal',
      description: 'Private to user 1',
      keyIngredients: ['secret-ingredient'],
      estimatedPrepMinutes: 30,
      sortOrder: 0,
    })

    // User 2 creates a plan with meals
    const plan2 = await t.mutation(api.mealPlans.create, {
      userId: user2,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 5,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: plan2,
      userId: user2,
      name: 'User 2 Meal',
      description: 'Private to user 2',
      keyIngredients: ['other-ingredient'],
      estimatedPrepMinutes: 45,
      sortOrder: 0,
    })

    // User 1 only sees their plan
    const user1Plans = await t.query(api.mealPlans.getByUser, { userId: user1 })
    expect(user1Plans).toHaveLength(1)
    expect(user1Plans[0].totalMealsRequested).toBe(3)

    // User 2 only sees their plan
    const user2Plans = await t.query(api.mealPlans.getByUser, { userId: user2 })
    expect(user2Plans).toHaveLength(1)
    expect(user2Plans[0].totalMealsRequested).toBe(5)

    // Week-based queries are isolated
    const user1Week = await t.query(api.mealPlans.getByUserAndWeek, {
      userId: user1,
      weekStartDate: '2026-03-09',
    })
    expect(user1Week!.userId).toEqual(user1)

    // Preferences are isolated
    const prefs1 = await t.query(api.preferences.getByUser, { userId: user1 })
    const prefs2 = await t.query(api.preferences.getByUser, { userId: user2 })
    expect(prefs1!.userId).toEqual(user1)
    expect(prefs2!.userId).toEqual(user2)

    // Credit operations are isolated
    await t.mutation(api.users.decrementCredits, { id: user1 })
    const u1 = await t.run(async (ctx) => ctx.db.get(user1))
    const u2 = await t.run(async (ctx) => ctx.db.get(user2))
    expect(u1!.generationsRemaining).toBe(24)
    expect(u2!.generationsRemaining).toBe(25)
  })
})

// ---------------------------------------------------------------------------
// 8. Batch Create for Regeneration
// ---------------------------------------------------------------------------

describe('integration: batchCreate in regeneration context', () => {
  it('batchCreate replacements have correct plan association and sort order', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId, mealIds } = await createUserPlanAndMeals(t, {
      mealCount: 4,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })

    // Accept first 2, reject last 2
    await t.mutation(api.meals.updateStatus, { id: mealIds[0], status: 'accepted' })
    await t.mutation(api.meals.updateStatus, { id: mealIds[1], status: 'accepted' })
    await t.mutation(api.meals.updateStatus, { id: mealIds[2], status: 'rejected' })
    await t.mutation(api.meals.updateStatus, { id: mealIds[3], status: 'rejected' })

    // Delete rejected
    await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'rejected',
    })

    // Batch create replacements
    const newIds = await t.mutation(api.meals.batchCreate, {
      meals: [
        {
          mealPlanId: planId,
          userId,
          name: 'Batch Replacement A',
          description: 'New meal A',
          keyIngredients: ['a'],
          estimatedPrepMinutes: 20,
          sortOrder: 4,
        },
        {
          mealPlanId: planId,
          userId,
          name: 'Batch Replacement B',
          description: 'New meal B',
          keyIngredients: ['b'],
          estimatedPrepMinutes: 25,
          sortOrder: 5,
        },
      ],
    })
    expect(newIds).toHaveLength(2)

    // All meals for the plan
    const allMeals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(allMeals).toHaveLength(4)
    expect(allMeals[0].status).toBe('accepted')
    expect(allMeals[1].status).toBe('accepted')
    expect(allMeals[2].name).toBe('Batch Replacement A')
    expect(allMeals[3].name).toBe('Batch Replacement B')
  })
})

// ---------------------------------------------------------------------------
// 9. Generation Logging Across Flows
// ---------------------------------------------------------------------------

describe('integration: generation log history', () => {
  it('logs from different generation types appear in order', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-regeneration',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'anthropic',
      creditsUsed: 0,
      status: 'failed',
    })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'prep-guide',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(4)

    // Most recent first (desc order)
    expect(logs[0].type).toBe('prep-guide')
    expect(logs[1].type).toBe('meal-suggestions')
    expect(logs[1].status).toBe('failed')
    expect(logs[2].type).toBe('meal-regeneration')
    expect(logs[3].type).toBe('meal-suggestions')
    expect(logs[3].status).toBe('success')
  })

  it('tracks both openai and anthropic providers', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'anthropic',
      creditsUsed: 1,
      status: 'success',
    })

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    const providers = logs.map((l) => l.provider)
    expect(providers).toContain('openai')
    expect(providers).toContain('anthropic')
  })
})
