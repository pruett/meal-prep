import { redirect } from '@tanstack/react-router'

/**
 * Reusable beforeLoad guard that redirects unauthenticated users to /auth/login.
 *
 * Usage:
 *   beforeLoad: requireAuth
 *   — or —
 *   beforeLoad: ({ context }) => { requireAuth({ context }); /* extra logic *\/ }
 */
export function requireAuth({
  context,
}: {
  context: { token: string | null }
}) {
  if (!context.token) {
    throw redirect({ to: '/auth/login' })
  }
}