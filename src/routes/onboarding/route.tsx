import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { WizardShell } from '~/components/onboarding/wizard-shell'
import { requireAuth } from '~/lib/auth-guard'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: ({ context }) => {
    requireAuth({ context })

    if (context.onboardingCompleted) {
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
