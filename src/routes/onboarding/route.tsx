import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import { getToken } from '~/lib/auth-server'
import { WizardShell } from '~/components/onboarding/wizard-shell'

const fetchOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = await getToken()
    if (!token) return null

    const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
    convex.setAuth(token)

    const user = await convex.query(api.users.getAuthenticated, {})
    if (!user) return null

    return { onboardingCompleted: user.onboardingCompleted }
  },
)

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context }) => {
    if (!context.token) {
      throw redirect({ to: '/auth/login' })
    }

    const status = await fetchOnboardingStatus()
    if (status?.onboardingCompleted) {
      throw redirect({ to: '/' })
    }
  },
  component: OnboardingLayout,
})

function OnboardingLayout() {
  return (
    <WizardShell>
      <Outlet />
    </WizardShell>
  )
}
