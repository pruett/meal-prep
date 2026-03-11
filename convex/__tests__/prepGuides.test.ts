import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../_generated/api'
import schema from '../schema'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

const modules = import.meta.glob('../**/*.ts')

async function createTestUserAndPlan(t: ReturnType<typeof convexTest>) {
  const userId = await t.mutation(api.users.createFromAuth, {
    betterAuthId: `auth-${Math.random().toString(36).slice(2)}`,
    email: `user-${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test User',
  })
  const planId = await t.mutation(api.mealPlans.create, {
    userId,
    weekStartDate: '2026-03-09',
    totalMealsRequested: 7,
  })
  return { userId, planId }
}

const sampleShoppingList = [
  { item: 'Chicken breast', quantity: '2', unit: 'lbs', category: 'Meat' },
  { item: 'Brown rice', quantity: '1', unit: 'bag', category: 'Grains' },
]

const sampleBatchPrepSteps = [
  {
    stepNumber: 1,
    instruction: 'Marinate chicken',
    estimatedMinutes: 10,
    relatedMeals: ['Grilled Chicken Bowl'],
  },
  {
    stepNumber: 2,
    instruction: 'Cook rice in bulk',
    estimatedMinutes: 25,
    relatedMeals: ['Grilled Chicken Bowl', 'Veggie Stir Fry'],
  },
]

describe('prepGuides.create', () => {
  it('creates a prep guide with all fields', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const guideId = await t.mutation(api.prepGuides.create, {
      mealPlanId: planId,
      userId,
      shoppingList: sampleShoppingList,
      batchPrepSteps: sampleBatchPrepSteps,
      totalEstimatedMinutes: 35,
    })
    expect(guideId).toBeDefined()

    const guide = await t.run(async (ctx) => ctx.db.get(guideId))
    expect(guide).toMatchObject({
      mealPlanId: planId,
      userId,
      shoppingList: sampleShoppingList,
      batchPrepSteps: sampleBatchPrepSteps,
      totalEstimatedMinutes: 35,
    })
    expect(guide!.createdAt).toBeTypeOf('number')
  })

  it('creates guide with empty shopping list and prep steps', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    const guideId = await t.mutation(api.prepGuides.create, {
      mealPlanId: planId,
      userId,
      shoppingList: [],
      batchPrepSteps: [],
      totalEstimatedMinutes: 0,
    })

    const guide = await t.run(async (ctx) => ctx.db.get(guideId))
    expect(guide!.shoppingList).toEqual([])
    expect(guide!.batchPrepSteps).toEqual([])
    expect(guide!.totalEstimatedMinutes).toBe(0)
  })
})

describe('prepGuides.getByMealPlan', () => {
  it('returns the prep guide for a meal plan', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId } = await createTestUserAndPlan(t)

    await t.mutation(api.prepGuides.create, {
      mealPlanId: planId,
      userId,
      shoppingList: sampleShoppingList,
      batchPrepSteps: sampleBatchPrepSteps,
      totalEstimatedMinutes: 35,
    })

    const guide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(guide).not.toBeNull()
    expect(guide!.mealPlanId).toEqual(planId)
    expect(guide!.shoppingList).toHaveLength(2)
    expect(guide!.batchPrepSteps).toHaveLength(2)
  })

  it('returns null for plan without a prep guide', async () => {
    const t = convexTest(schema, modules)
    const { planId } = await createTestUserAndPlan(t)

    const guide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: planId,
    })
    expect(guide).toBeNull()
  })

  it('does not return guides from other plans', async () => {
    const t = convexTest(schema, modules)
    const { userId, planId: plan1 } = await createTestUserAndPlan(t)
    const plan2 = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-16',
      totalMealsRequested: 5,
    })

    await t.mutation(api.prepGuides.create, {
      mealPlanId: plan1,
      userId,
      shoppingList: sampleShoppingList,
      batchPrepSteps: sampleBatchPrepSteps,
      totalEstimatedMinutes: 35,
    })

    const guide = await t.query(api.prepGuides.getByMealPlan, {
      mealPlanId: plan2,
    })
    expect(guide).toBeNull()
  })
})
