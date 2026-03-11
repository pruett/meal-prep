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

describe('preferences.create', () => {
  it('creates preferences with correct defaults', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const prefId = await t.mutation(api.preferences.create, { userId })
    expect(prefId).toBeDefined()

    const prefs = await t.run(async (ctx) => ctx.db.get(prefId))
    expect(prefs).toMatchObject({
      userId,
      dietaryRestrictions: [],
      cuisinePreferences: [],
      mealsPerWeek: 7,
      householdSize: 2,
      maxPrepTimeMinutes: 45,
      kitchenEquipment: [],
      foodsToAvoid: '',
    })
  })

  it('returns existing id if preferences already exist (idempotent)', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const firstId = await t.mutation(api.preferences.create, { userId })
    const secondId = await t.mutation(api.preferences.create, { userId })
    expect(secondId).toEqual(firstId)
  })
})

describe('preferences.getByUser', () => {
  it('returns preferences for a user', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs).not.toBeNull()
    expect(prefs!.userId).toEqual(userId)
    expect(prefs!.mealsPerWeek).toBe(7)
  })

  it('returns null for user without preferences', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs).toBeNull()
  })

  it('uses by_user index (does not return other users preferences)', async () => {
    const t = convexTest(schema, modules)
    const user1 = await createTestUser(t)
    const user2 = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId: user1 })

    const prefs = await t.query(api.preferences.getByUser, { userId: user2 })
    expect(prefs).toBeNull()
  })
})

describe('preferences.update', () => {
  it('updates dietary restrictions', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.dietaryRestrictions).toEqual(['vegetarian', 'gluten-free'])
  })

  it('updates cuisine preferences', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      cuisinePreferences: [
        { cuisine: 'Italian', preference: 'like' as const },
        { cuisine: 'Thai', preference: 'dislike' as const },
      ],
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.cuisinePreferences).toHaveLength(2)
    expect(prefs!.cuisinePreferences[0]).toEqual({
      cuisine: 'Italian',
      preference: 'like',
    })
  })

  it('updates numeric fields', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      mealsPerWeek: 14,
      householdSize: 4,
      maxPrepTimeMinutes: 60,
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.mealsPerWeek).toBe(14)
    expect(prefs!.householdSize).toBe(4)
    expect(prefs!.maxPrepTimeMinutes).toBe(60)
  })

  it('updates foods to avoid', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      foodsToAvoid: 'shellfish, peanuts',
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.foodsToAvoid).toBe('shellfish, peanuts')
  })

  it('updates kitchen equipment', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      kitchenEquipment: ['oven', 'slow cooker', 'air fryer'],
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.kitchenEquipment).toEqual(['oven', 'slow cooker', 'air fryer'])
  })

  it('only updates provided fields (partial update)', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      mealsPerWeek: 10,
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.mealsPerWeek).toBe(10)
    // Other fields untouched
    expect(prefs!.householdSize).toBe(2)
    expect(prefs!.maxPrepTimeMinutes).toBe(45)
    expect(prefs!.dietaryRestrictions).toEqual([])
  })

  it('throws when preferences do not exist', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    await expect(
      t.mutation(api.preferences.update, {
        userId,
        mealsPerWeek: 10,
      }),
    ).rejects.toThrow('Preferences not found for user')
  })

  it('handles update with no optional fields (no-op)', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    // Calling update with only userId and no optional fields
    await t.mutation(api.preferences.update, { userId })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.mealsPerWeek).toBe(7) // defaults unchanged
  })
})
