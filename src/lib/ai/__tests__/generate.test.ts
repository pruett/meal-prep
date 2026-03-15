import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Id } from '../../../../convex/_generated/dataModel'

const mockFetchAuthQuery = vi.fn()
const mockFetchAuthMutation = vi.fn()

vi.mock('~/lib/auth-server', () => ({
  fetchAuthQuery: (...args: unknown[]) => mockFetchAuthQuery(...args),
  fetchAuthMutation: (...args: unknown[]) => mockFetchAuthMutation(...args),
}))

import { withRetry } from '~/lib/ai/generate'

const fakeUserId = 'test-user-id' as Id<'users'>

beforeEach(() => {
  vi.clearAllMocks()
})

/** Find calls where the second arg (the mutation args) matches a predicate. */
function findCallsWhere(predicate: (args: Record<string, unknown>) => boolean) {
  return mockFetchAuthMutation.mock.calls.filter(
    ([, callArgs]: [unknown, Record<string, unknown>]) => predicate(callArgs),
  )
}

function decrementCreditCalls() {
  return findCallsWhere((args) => 'id' in args && Object.keys(args).length === 1)
}

function generationLogCalls() {
  return findCallsWhere((args) => 'status' in args && 'creditsUsed' in args)
}

describe('withRetry', () => {
  it('decrements credits on success', async () => {
    const result = await withRetry({
      fn: async () => 'ok',
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    expect(result).toEqual({ data: 'ok' })
    expect(decrementCreditCalls()).toHaveLength(1)
    expect(decrementCreditCalls()[0][1]).toEqual({ id: fakeUserId })
  })

  it('logs creditsUsed: 1 on success', async () => {
    await withRetry({
      fn: async () => 'ok',
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    const logs = generationLogCalls()
    expect(logs).toHaveLength(1)
    expect(logs[0][1]).toMatchObject({
      userId: fakeUserId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 1,
      status: 'success',
    })
  })

  it('does NOT decrement credits on failure', async () => {
    const result = await withRetry({
      fn: async () => {
        throw new Error('API key missing')
      },
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    expect(result).toEqual({ error: 'Test failed' })
    expect(decrementCreditCalls()).toHaveLength(0)
  })

  it('logs creditsUsed: 0 on failure', async () => {
    await withRetry({
      fn: async () => {
        throw new Error('API key missing')
      },
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    const logs = generationLogCalls()
    expect(logs).toHaveLength(1)
    expect(logs[0][1]).toMatchObject({
      userId: fakeUserId,
      type: 'meal-suggestions',
      provider: 'openai',
      creditsUsed: 0,
      status: 'failed',
    })
  })

  it('calls onFailure callback when all retries are exhausted', async () => {
    const onFailure = vi.fn()

    await withRetry({
      fn: async () => {
        throw new Error('fail')
      },
      userId: fakeUserId,
      type: 'prep-guide',
      label: 'Test',
      onFailure,
    })

    expect(onFailure).toHaveBeenCalledOnce()
  })

  it('does not call onFailure when fn succeeds', async () => {
    const onFailure = vi.fn()

    await withRetry({
      fn: async () => 'ok',
      userId: fakeUserId,
      type: 'prep-guide',
      label: 'Test',
      onFailure,
    })

    expect(onFailure).not.toHaveBeenCalled()
  })

  it('retries before giving up and does not decrement credits on any failure', async () => {
    let attempts = 0
    await withRetry({
      fn: async () => {
        attempts++
        throw new Error('fail')
      },
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    // MAX_RETRIES = 2, so 3 total attempts (0, 1, 2)
    expect(attempts).toBe(3)
    expect(decrementCreditCalls()).toHaveLength(0)
  })

  it('succeeds on retry and decrements credits only once', async () => {
    let attempts = 0
    const result = await withRetry({
      fn: async () => {
        attempts++
        if (attempts < 3) throw new Error('transient failure')
        return 'recovered'
      },
      userId: fakeUserId,
      type: 'meal-suggestions',
      label: 'Test',
    })

    expect(result).toEqual({ data: 'recovered' })
    expect(decrementCreditCalls()).toHaveLength(1)

    const logs = generationLogCalls()
    expect(logs).toHaveLength(1)
    expect(logs[0][1]).toMatchObject({
      creditsUsed: 1,
      status: 'success',
    })
  })
})
