import { convexTest } from 'convex-test'
import { api } from '../../convex/_generated/api'
import schema from '../../convex/schema'

export { api, schema }

export const modules = import.meta.glob('../../convex/**/*.ts')

export async function createTestUser(t: ReturnType<typeof convexTest>) {
  return t.mutation(api.users.createFromAuth, {
    betterAuthId: `auth-${Math.random().toString(36).slice(2)}`,
    email: `user-${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test User',
  })
}

export async function createTestUserAndPlan(
  t: ReturnType<typeof convexTest>,
  opts: { weekStart?: string; totalMeals?: number } = {},
) {
  const { weekStart = '2026-03-09', totalMeals = 7 } = opts
  const userId = await createTestUser(t)
  const planId = await t.mutation(api.mealPlans.create, {
    userId,
    weekStartDate: weekStart,
    totalMealsRequested: totalMeals,
  })
  return { userId, planId }
}

export async function createUserWithPreferences(t: ReturnType<typeof convexTest>) {
  const userId = await createTestUser(t)
  await t.mutation(api.preferences.create, { userId })
  return userId
}

export async function createUserPlanAndMeals(
  t: ReturnType<typeof convexTest>,
  opts: { mealCount?: number; weekStart?: string } = {},
) {
  const { mealCount = 5, weekStart = '2026-03-09' } = opts
  const userId = await createUserWithPreferences(t)
  const planId = await t.mutation(api.mealPlans.create, {
    userId,
    weekStartDate: weekStart,
    totalMealsRequested: mealCount,
  })
  const mealIds = await t.mutation(api.meals.batchCreate, {
    meals: Array.from({ length: mealCount }, (_, i) => ({
      mealPlanId: planId,
      userId,
      name: `Meal ${i + 1}`,
      description: `Description for meal ${i + 1}`,
      keyIngredients: ['ingredient-a', 'ingredient-b'],
      estimatedPrepMinutes: 25 + i * 5,
      sortOrder: i,
    })),
  })
  return { userId, planId, mealIds }
}
