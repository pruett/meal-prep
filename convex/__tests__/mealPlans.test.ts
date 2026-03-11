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

async function createTestUser(t: ReturnType<typeof convexTest>) {
  return t.mutation(api.users.createFromAuth, {
    betterAuthId: `auth-${Math.random().toString(36).slice(2)}`,
    email: `user-${Math.random().toString(36).slice(2)}@example.com`,
    name: 'Test User',
  })
}

describe('mealPlans.create', () => {
  it('creates a meal plan with generating status', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })
    expect(planId).toBeDefined()

    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan).toMatchObject({
      userId,
      weekStartDate: '2026-03-09',
      status: 'generating',
      totalMealsRequested: 7,
    })
    expect(plan!.createdAt).toBeTypeOf('number')
  })

  it('allows multiple plans for the same user', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const id1 = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })
    const id2 = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-16',
      totalMealsRequested: 5,
    })
    expect(id1).not.toEqual(id2)
  })
})

describe('mealPlans.updateStatus', () => {
  it('transitions from generating to reviewing', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan!.status).toBe('reviewing')
  })

  it('transitions from reviewing to finalized', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'reviewing',
    })
    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'finalized',
    })
    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan!.status).toBe('finalized')
  })

  it('transitions to archived', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'archived',
    })
    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan!.status).toBe('archived')
  })

  it('allows re-setting the same status', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const planId = await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    await t.mutation(api.mealPlans.updateStatus, {
      id: planId,
      status: 'generating',
    })
    const plan = await t.run(async (ctx) => ctx.db.get(planId))
    expect(plan!.status).toBe('generating')
  })
})

describe('mealPlans.getByUserAndWeek', () => {
  it('returns the plan for a specific user and week', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    const plan = await t.query(api.mealPlans.getByUserAndWeek, {
      userId,
      weekStartDate: '2026-03-09',
    })
    expect(plan).not.toBeNull()
    expect(plan!.weekStartDate).toBe('2026-03-09')
    expect(plan!.userId).toEqual(userId)
  })

  it('returns null for non-existent week', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    const plan = await t.query(api.mealPlans.getByUserAndWeek, {
      userId,
      weekStartDate: '2026-03-16',
    })
    expect(plan).toBeNull()
  })

  it('does not return plans from other users', async () => {
    const t = convexTest(schema, modules)
    const user1 = await createTestUser(t)
    const user2 = await createTestUser(t)
    await t.mutation(api.mealPlans.create, {
      userId: user1,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })

    const plan = await t.query(api.mealPlans.getByUserAndWeek, {
      userId: user2,
      weekStartDate: '2026-03-09',
    })
    expect(plan).toBeNull()
  })
})

describe('mealPlans.getByUser', () => {
  it('returns all plans for a user ordered by creation (desc)', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-02',
      totalMealsRequested: 5,
    })
    await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })
    await t.mutation(api.mealPlans.create, {
      userId,
      weekStartDate: '2026-03-16',
      totalMealsRequested: 3,
    })

    const plans = await t.query(api.mealPlans.getByUser, { userId })
    expect(plans).toHaveLength(3)
    // Desc order: most recent first
    expect(plans[0].weekStartDate).toBe('2026-03-16')
    expect(plans[2].weekStartDate).toBe('2026-03-02')
  })

  it('returns empty array for user with no plans', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const plans = await t.query(api.mealPlans.getByUser, { userId })
    expect(plans).toEqual([])
  })

  it('does not include plans from other users', async () => {
    const t = convexTest(schema, modules)
    const user1 = await createTestUser(t)
    const user2 = await createTestUser(t)
    await t.mutation(api.mealPlans.create, {
      userId: user1,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 7,
    })
    await t.mutation(api.mealPlans.create, {
      userId: user2,
      weekStartDate: '2026-03-09',
      totalMealsRequested: 5,
    })

    const plans = await t.query(api.mealPlans.getByUser, { userId: user1 })
    expect(plans).toHaveLength(1)
    expect(plans[0].totalMealsRequested).toBe(7)
  })
})
