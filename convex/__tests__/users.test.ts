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

describe('users.createFromAuth', () => {
  it('creates a new user with correct defaults', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-1',
      email: 'alice@example.com',
      name: 'Alice',
    })
    expect(userId).toBeDefined()

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user).toMatchObject({
      betterAuthId: 'auth-1',
      email: 'alice@example.com',
      name: 'Alice',
      generationsRemaining: 25,
      onboardingCompleted: false,
    })
    expect(user!.createdAt).toBeTypeOf('number')
  })

  it('returns existing user id if betterAuthId already exists (idempotent)', async () => {
    const t = convexTest(schema, modules)
    const firstId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-dup',
      email: 'bob@example.com',
      name: 'Bob',
    })
    const secondId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-dup',
      email: 'different@example.com',
      name: 'Different Name',
    })
    expect(secondId).toEqual(firstId)
  })

  it('creates separate users for different betterAuthIds', async () => {
    const t = convexTest(schema, modules)
    const id1 = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-a',
      email: 'a@example.com',
      name: 'User A',
    })
    const id2 = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-b',
      email: 'b@example.com',
      name: 'User B',
    })
    expect(id1).not.toEqual(id2)
  })
})

describe('users.getByBetterAuthId', () => {
  it('returns user by betterAuthId', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-find',
      email: 'find@example.com',
      name: 'Findable',
    })
    const user = await t.query(api.users.getByBetterAuthId, {
      betterAuthId: 'auth-find',
    })
    expect(user).not.toBeNull()
    expect(user!.email).toBe('find@example.com')
    expect(user!.name).toBe('Findable')
  })

  it('returns null for non-existent betterAuthId', async () => {
    const t = convexTest(schema, modules)
    const user = await t.query(api.users.getByBetterAuthId, {
      betterAuthId: 'does-not-exist',
    })
    expect(user).toBeNull()
  })
})

describe('users.decrementCredits', () => {
  it('decrements credits by 1', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-credits',
      email: 'credits@example.com',
      name: 'Credits',
    })
    await t.mutation(api.users.decrementCredits, { id: userId })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(24)
  })

  it('decrements multiple times correctly', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-multi',
      email: 'multi@example.com',
      name: 'Multi',
    })
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.users.decrementCredits, { id: userId })
    await t.mutation(api.users.decrementCredits, { id: userId })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(22)
  })

  it('throws when no credits remaining', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-zero',
      email: 'zero@example.com',
      name: 'Zero',
    })
    // Set credits to 0 directly
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { generationsRemaining: 0 })
    })

    await expect(
      t.mutation(api.users.decrementCredits, { id: userId }),
    ).rejects.toThrow('No credits remaining')
  })

  it('throws when credits at exactly 0', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-exact-zero',
      email: 'exact@example.com',
      name: 'Exact Zero',
    })
    // Drain all 25 credits
    for (let i = 0; i < 25; i++) {
      await t.mutation(api.users.decrementCredits, { id: userId })
    }
    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(0)

    await expect(
      t.mutation(api.users.decrementCredits, { id: userId }),
    ).rejects.toThrow('No credits remaining')
  })

  it('allows decrement when exactly 1 credit remains', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-one-left',
      email: 'one@example.com',
      name: 'One Left',
    })
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { generationsRemaining: 1 })
    })

    await t.mutation(api.users.decrementCredits, { id: userId })
    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.generationsRemaining).toBe(0)
  })
})

describe('users.completeOnboarding', () => {
  it('sets onboardingCompleted to true', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-onboard',
      email: 'onboard@example.com',
      name: 'Onboard',
    })
    const before = await t.run(async (ctx) => ctx.db.get(userId))
    expect(before!.onboardingCompleted).toBe(false)

    await t.mutation(api.users.completeOnboarding, { id: userId })

    const after = await t.run(async (ctx) => ctx.db.get(userId))
    expect(after!.onboardingCompleted).toBe(true)
  })

  it('is idempotent when called multiple times', async () => {
    const t = convexTest(schema, modules)
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-idem',
      email: 'idem@example.com',
      name: 'Idem',
    })
    await t.mutation(api.users.completeOnboarding, { id: userId })
    await t.mutation(api.users.completeOnboarding, { id: userId })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.onboardingCompleted).toBe(true)
  })
})
