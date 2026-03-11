import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { getToken } from '~/lib/auth-server'

const MAX_RETRIES = 2

type GenerationType = 'meal-suggestions' | 'meal-regeneration' | 'prep-guide'

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

/** Create a consistent JSON Response. */
export function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

/** Authenticate request and check credits. Returns convex client + user, or an error Response. */
export async function authenticateRequest(): Promise<
  { convex: ConvexHttpClient; user: Doc<'users'> } | Response
> {
  const token = await getToken()
  if (!token) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
  convex.setAuth(token)

  const user = await convex.query(api.users.getAuthenticated, {})
  if (!user) {
    return jsonResponse({ error: 'User not found' }, 401)
  }

  if (user.generationsRemaining <= 0) {
    return jsonResponse({ error: 'No credits remaining' }, 403)
  }

  return { convex, user }
}

/**
 * Retry an async operation with exponential backoff, handling credit
 * decrement and generation logging on success/failure.
 */
export async function withRetry<T>(opts: {
  fn: () => Promise<T>
  convex: ConvexHttpClient
  userId: Id<'users'>
  type: GenerationType
  label: string
  onFailure?: () => Promise<void>
}): Promise<{ data: T } | { error: string }> {
  const { fn, convex, userId, type, label, onFailure } = opts

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await fn()

      await convex.mutation(api.users.decrementCredits, { id: userId })
      await convex.mutation(api.generationLogs.create, {
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

  await convex.mutation(api.generationLogs.create, {
    userId,
    type,
    provider: 'openai',
    creditsUsed: 0,
    status: 'failed',
  })

  return { error: `${label} failed` }
}
