import { redirect } from '@tanstack/react-router'

/**
 * Reusable beforeLoad guard that redirects users who haven't completed
 * onboarding to the first onboarding step.
 *
 * Usage:
 *   beforeLoad: ({ context }) => {
 *     requireAuth({ context })
 *     requireOnboarding({ context })
 *   }
 */
export function requireOnboarding({
  context,
}: {
  context: { onboardingCompleted?: boolean }
}) {
  if (context.onboardingCompleted === false) {
    throw redirect({ to: '/onboarding' })
  }
}
