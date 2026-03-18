import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api, schema, modules, createTestUser } from './test_helpers'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

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
      household: { adults: 2, kids: 0, infants: 0 },
      mealsPerWeek: { breakfast: 0, lunch: 0, dinner: 5 },
      maxWeeklyPrepMinutes: 120,
      maxCookTimeMinutes: 30,
      kitchenEquipment: [],
      customInstructions: '',
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
    expect(prefs!.mealsPerWeek).toEqual({ breakfast: 0, lunch: 0, dinner: 5 })
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

  it('updates household', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      household: { adults: 3, kids: 2, infants: 1 },
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.household).toEqual({ adults: 3, kids: 2, infants: 1 })
  })

  it('updates mealsPerWeek as object', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      mealsPerWeek: { breakfast: 5, lunch: 3, dinner: 5 },
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.mealsPerWeek).toEqual({ breakfast: 5, lunch: 3, dinner: 5 })
  })

  it('updates time fields', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      maxWeeklyPrepMinutes: 180,
      maxCookTimeMinutes: 60,
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.maxWeeklyPrepMinutes).toBe(180)
    expect(prefs!.maxCookTimeMinutes).toBe(60)
  })

  it('updates customInstructions', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    await t.mutation(api.preferences.create, { userId })

    await t.mutation(api.preferences.update, {
      userId,
      customInstructions: 'No shellfish, extra protein',
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.customInstructions).toBe('No shellfish, extra protein')
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
      mealsPerWeek: { breakfast: 3, lunch: 3, dinner: 4 },
    })

    const prefs = await t.query(api.preferences.getByUser, { userId })
    expect(prefs!.mealsPerWeek).toEqual({ breakfast: 3, lunch: 3, dinner: 4 })
    // Other fields untouched
    expect(prefs!.household).toEqual({ adults: 2, kids: 0, infants: 0 })
    expect(prefs!.maxWeeklyPrepMinutes).toBe(120)
    expect(prefs!.dietaryRestrictions).toEqual([])
  })

  it('throws when preferences do not exist', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    await expect(
      t.mutation(api.preferences.update, {
        userId,
        mealsPerWeek: { breakfast: 0, lunch: 0, dinner: 10 },
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
    expect(prefs!.mealsPerWeek).toEqual({ breakfast: 0, lunch: 0, dinner: 5 }) // defaults unchanged
  })
})
