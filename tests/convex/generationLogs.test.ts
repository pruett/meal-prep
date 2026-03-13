import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api, schema, modules, createTestUser } from './test_helpers'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: vi.fn().mockResolvedValue(null),
  },
}))

describe('generationLogs.create', () => {
  it('creates a successful generation log', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const logId = await t.mutation(api.generationLogs.create, {
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    expect(logId).toBeDefined()

    const log = await t.run(async (ctx) => ctx.db.get(logId))
    expect(log).toMatchObject({
      userId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    expect(log!.createdAt).toBeTypeOf('number')
  })

  it('creates a failed generation log', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const logId = await t.mutation(api.generationLogs.create, {
      userId,
      type: 'prep-guide',
      provider: 'anthropic',
      creditsUsed: 0,
      status: 'failed',
    })

    const log = await t.run(async (ctx) => ctx.db.get(logId))
    expect(log!.status).toBe('failed')
    expect(log!.creditsUsed).toBe(0)
  })

  it('supports all generation types', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)

    const types = ['meal-suggestions', 'meal-regeneration', 'prep-guide'] as const
    for (const type of types) {
      const logId = await t.mutation(api.generationLogs.create, {
        userId,
        type,
        provider: 'openai',
        creditsUsed: 1,
        status: 'success',
      })
      const log = await t.run(async (ctx) => ctx.db.get(logId))
      expect(log!.type).toBe(type)
    }
  })
})

describe('generationLogs.getByUser', () => {
  it('returns logs for a user ordered by creation (desc)', async () => {
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
      type: 'prep-guide',
      provider: 'anthropic',
      creditsUsed: 1,
      status: 'failed',
    })

    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toHaveLength(3)
    // Desc order: most recent first
    expect(logs[0].type).toBe('prep-guide')
    expect(logs[2].type).toBe('meal-suggestions')
  })

  it('returns empty array for user with no logs', async () => {
    const t = convexTest(schema, modules)
    const userId = await createTestUser(t)
    const logs = await t.query(api.generationLogs.getByUser, { userId })
    expect(logs).toEqual([])
  })

  it('does not include logs from other users', async () => {
    const t = convexTest(schema, modules)
    const user1 = await createTestUser(t)
    const user2 = await createTestUser(t)

    await t.mutation(api.generationLogs.create, {
      userId: user1,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
    await t.mutation(api.generationLogs.create, {
      userId: user2,
      type: 'prep-guide',
      provider: 'anthropic',
      creditsUsed: 1,
      status: 'success',
    })

    const logs = await t.query(api.generationLogs.getByUser, { userId: user1 })
    expect(logs).toHaveLength(1)
    expect(logs[0].type).toBe('meal-suggestions')
  })
})
