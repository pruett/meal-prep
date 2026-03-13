import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { isRedirect } from '@tanstack/react-router'
import { api, schema, modules, createTestUser } from './convex/test_helpers'
import { requireOnboarding } from '../src/lib/onboarding-guard'

vi.mock('../convex/auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

// ---------------------------------------------------------------------------
// 1. requireOnboarding guard logic
// ---------------------------------------------------------------------------

describe('requireOnboarding guard', () => {
  it('throws redirect to /onboarding/diet when onboardingCompleted is false', () => {
    try {
      requireOnboarding({ context: { onboardingCompleted: false } })
      expect.fail('Expected redirect to be thrown')
    } catch (e) {
      expect(isRedirect(e)).toBe(true)
      expect((e as { options: { to: string } }).options.to).toBe('/onboarding/diet')
    }
  })

  it('does not throw when onboardingCompleted is true', () => {
    expect(() =>
      requireOnboarding({ context: { onboardingCompleted: true } }),
    ).not.toThrow()
  })

  it('does not throw when onboardingCompleted is undefined (no user found)', () => {
    expect(() =>
      requireOnboarding({ context: { onboardingCompleted: undefined } }),
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 2. Convex data: new user has onboardingCompleted false
// ---------------------------------------------------------------------------

describe('onboarding guard: Convex data flow', () => {
  it('new user is created with onboardingCompleted: false', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.onboardingCompleted).toBe(false)
  })

  it('user with onboardingCompleted false triggers redirect', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const user = await t.run(async (ctx) => ctx.db.get(userId))

    try {
      requireOnboarding({ context: { onboardingCompleted: user!.onboardingCompleted } })
      expect.fail('Expected redirect to be thrown')
    } catch (e) {
      expect(isRedirect(e)).toBe(true)
      expect((e as { options: { to: string } }).options.to).toBe('/onboarding/diet')
    }
  })

  it('after completeOnboarding, guard allows through', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    await t.mutation(api.users.completeOnboarding, { id: userId })

    const user = await t.run(async (ctx) => ctx.db.get(userId))
    expect(user!.onboardingCompleted).toBe(true)

    expect(() =>
      requireOnboarding({ context: { onboardingCompleted: user!.onboardingCompleted } }),
    ).not.toThrow()
  })

  it('full journey: signup → guard blocks → complete onboarding → guard allows', async () => {
    const t = convexTest(schema, modules)

    // Step 1: User signs up
    const userId = await t.mutation(api.users.createFromAuth, {
      betterAuthId: 'auth-onboard-guard-test',
      email: 'guardtest@example.com',
      name: 'Guard Test User',
    })

    // Step 2: User hits home route — guard should redirect
    const userBefore = await t.run(async (ctx) => ctx.db.get(userId))
    try {
      requireOnboarding({ context: { onboardingCompleted: userBefore!.onboardingCompleted } })
      expect.fail('Expected redirect to onboarding')
    } catch (e) {
      expect(isRedirect(e)).toBe(true)
      expect((e as { options: { to: string } }).options.to).toBe('/onboarding/diet')
    }

    // Step 3: User completes onboarding wizard
    await t.mutation(api.preferences.create, { userId })
    await t.mutation(api.preferences.update, {
      userId,
      dietaryRestrictions: ['vegetarian'],
      mealsPerWeek: 5,
      householdSize: 2,
    })
    await t.mutation(api.users.completeOnboarding, { id: userId })

    // Step 4: User hits home route again — guard should allow through
    const userAfter = await t.run(async (ctx) => ctx.db.get(userId))
    expect(userAfter!.onboardingCompleted).toBe(true)
    expect(() =>
      requireOnboarding({ context: { onboardingCompleted: userAfter!.onboardingCompleted } }),
    ).not.toThrow()
  })
})
