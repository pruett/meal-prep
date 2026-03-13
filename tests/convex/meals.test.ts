import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api, schema, modules, createTestUserAndPlan } from './test_helpers'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

const baseMeal = {
  name: 'Test Meal',
  description: 'A test meal description',
  keyIngredients: ['chicken', 'rice', 'broccoli'],
  estimatedPrepMinutes: 30,
}

describe('meals.create', () => {
  it('creates a meal with correct defaults', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })
    expect(mealId).toBeDefined()

    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal).toMatchObject({
      mealPlanId: planId,
      userId,
      name: 'Test Meal',
      status: 'pending',
      fullRecipe: null,
      sortOrder: 0,
    })
  })
})

describe('meals.getByMealPlan', () => {
  it('returns meals sorted by sortOrder', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    // Insert in non-sequential order
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'Third',
      sortOrder: 2,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'First',
      sortOrder: 0,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'Second',
      sortOrder: 1,
    })

    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals).toHaveLength(3)
    expect(meals[0].name).toBe('First')
    expect(meals[1].name).toBe('Second')
    expect(meals[2].name).toBe('Third')
  })

  it('returns empty array for plan with no meals', async () => {
    const t = convexTest(schema, modules)
    const { planId } = await createTestUserAndPlan(t)
    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals).toEqual([])
  })

  it('does not return meals from other plans', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId: plan1 } = await createTestUserAndPlan(t)
    const plan2 = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-16',
      totalMealsRequested: 3,
    })

    await t.mutation(api.meals.create, {
      mealPlanId: plan1,
      userId,
      ...baseMeal,
      name: 'Plan 1 Meal',
      sortOrder: 0,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: plan2,
      userId,
      ...baseMeal,
      name: 'Plan 2 Meal',
      sortOrder: 0,
    })

    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: plan1,
    })
    expect(meals).toHaveLength(1)
    expect(meals[0].name).toBe('Plan 1 Meal')
  })
})

describe('meals.updateStatus', () => {
  it('transitions from pending to accepted', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    await t.mutation(api.meals.updateStatus, {
      id: mealId,
      status: 'accepted',
    })
    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal!.status).toBe('accepted')
  })

  it('transitions from pending to rejected', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    await t.mutation(api.meals.updateStatus, {
      id: mealId,
      status: 'rejected',
    })
    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal!.status).toBe('rejected')
  })

  it('transitions from rejected back to pending', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    await t.mutation(api.meals.updateStatus, {
      id: mealId,
      status: 'rejected',
    })
    await t.mutation(api.meals.updateStatus, {
      id: mealId,
      status: 'pending',
    })
    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal!.status).toBe('pending')
  })
})

describe('meals.deleteByMealPlanAndStatus', () => {
  it('deletes only meals with matching status', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const meal1 = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'Accepted Meal',
      sortOrder: 0,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'Rejected Meal 1',
      sortOrder: 1,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      name: 'Rejected Meal 2',
      sortOrder: 2,
    })

    await t.mutation(api.meals.updateStatus, {
      id: meal1,
      status: 'accepted',
    })

    const deletedCount = await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'pending',
    })
    expect(deletedCount).toBe(2)

    const remaining = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('Accepted Meal')
  })

  it('returns 0 when no meals match the status', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    const deletedCount = await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: planId,
      status: 'rejected',
    })
    expect(deletedCount).toBe(0)
  })

  it('does not affect meals from other plans', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId: plan1 } = await createTestUserAndPlan(t)
    const plan2 = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-16',
      totalMealsRequested: 3,
    })

    await t.mutation(api.meals.create, {
      mealPlanId: plan1,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })
    await t.mutation(api.meals.create, {
      mealPlanId: plan2,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    await t.mutation(api.meals.deleteByMealPlanAndStatus, {
      mealPlanId: plan1,
      status: 'pending',
    })

    const plan2Meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: plan2,
    })
    expect(plan2Meals).toHaveLength(1)
  })
})

describe('meals.batchCreate', () => {
  it('creates multiple meals at once', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const ids = await t.mutation(api.meals.batchCreate, {
      meals: [
        { mealPlanId: planId, userId, ...baseMeal, name: 'Meal A', sortOrder: 0 },
        { mealPlanId: planId, userId, ...baseMeal, name: 'Meal B', sortOrder: 1 },
        { mealPlanId: planId, userId, ...baseMeal, name: 'Meal C', sortOrder: 2 },
      ],
    })
    expect(ids).toHaveLength(3)

    const meals = await t.query(api.meals.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(meals).toHaveLength(3)
    expect(meals.map((m) => m.name)).toEqual(['Meal A', 'Meal B', 'Meal C'])
  })

  it('sets status to pending and fullRecipe to null for all', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const ids = await t.mutation(api.meals.batchCreate, {
      meals: [
        { mealPlanId: planId, userId, ...baseMeal, name: 'Batch 1', sortOrder: 0 },
        { mealPlanId: planId, userId, ...baseMeal, name: 'Batch 2', sortOrder: 1 },
      ],
    })

    for (const id of ids) {
      const meal = await t.run(async (ctx) => ctx.db.get(id))
      expect(meal!.status).toBe('pending')
      expect(meal!.fullRecipe).toBeNull()
    }
  })

  it('handles empty array', async () => {
    const t = convexTest(schema, modules)
    const ids = await t.mutation(api.meals.batchCreate, { meals: [] })
    expect(ids).toEqual([])
  })
})

describe('meals.updateFullRecipe', () => {
  it('sets the full recipe on a meal', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    const recipe = {
      ingredients: [
        { name: 'chicken breast', quantity: '2', unit: 'lbs' },
        { name: 'rice', quantity: '1', unit: 'cup' },
      ],
      instructions: ['Season chicken', 'Grill for 15 min', 'Serve with rice'],
      nutritionEstimate: {
        calories: 450,
        protein: 35,
        carbs: 40,
        fat: 12,
      },
    }

    await t.mutation(api.meals.updateFullRecipe, {
      id: mealId,
      fullRecipe: recipe,
    })

    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal!.fullRecipe).toEqual(recipe)
  })

  it('allows null nutritionEstimate', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)
    const mealId = await t.mutation(api.meals.create, {
      mealPlanId: planId,
      userId,
      ...baseMeal,
      sortOrder: 0,
    })

    await t.mutation(api.meals.updateFullRecipe, {
      id: mealId,
      fullRecipe: {
        ingredients: [{ name: 'pasta', quantity: '8', unit: 'oz' }],
        instructions: ['Boil pasta'],
        nutritionEstimate: null,
      },
    })

    const meal = await t.run(async (ctx) => ctx.db.get(mealId))
    expect(meal!.fullRecipe!.nutritionEstimate).toBeNull()
  })
})
