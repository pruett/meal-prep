import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

const MAX_RETRIES = 2

type GenerationType = 'meal-suggestions' | 'meal-regeneration' | 'prep-guide'

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

/** Create a consistent JSON Response. */
export function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

/** Authenticate request and check credits. Returns user, or an error Response. */
export async function authenticateRequest(): Promise<
  { user: Doc<'users'> } | Response
> {
  const user = await fetchAuthQuery(api.users.getAuthenticated, {})
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (user.generationsRemaining <= 0) {
    return jsonResponse({ error: 'No credits remaining' }, 403)
  }

  return { user }
}

/**
 * Retry an async operation with exponential backoff, handling credit
 * decrement and generation logging on success/failure.
 */
export async function withRetry<T>(opts: {
  fn: () => Promise<T>
  userId: Id<'users'>
  type: GenerationType
  label: string
  onFailure?: () => Promise<void>
}): Promise<{ data: T } | { error: string }> {
  const { fn, userId, type, label, onFailure } = opts

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await fn()

      await fetchAuthMutation(api.users.decrementCredits, { id: userId })
      await fetchAuthMutation(api.generationLogs.create, {
        userId,
        type,
        provider: 'openai',
        creditsUsed: 1,
        status: 'success',
      })

      return { data }
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        )
      }
    }
  }

  console.error(`${label} failed after retries:`, lastError)

  if (onFailure) {
    await onFailure()
  }

  await fetchAuthMutation(api.generationLogs.create, {
    userId,
    type,
    provider: 'openai',
    creditsUsed: 0,
    status: 'failed',
  })

  return { error: `${label} failed` }
}
