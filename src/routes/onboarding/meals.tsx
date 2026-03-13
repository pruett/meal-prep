import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { api } from '../../../convex/_generated/api'
import { fetchAuthQuery } from '~/lib/auth-server'
import { MealsStep } from '~/components/onboarding/meals-step'

const fetchPreferences = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await fetchAuthQuery(api.users.getAuthenticated, {})
  if (!user) return null

  const prefs = await fetchAuthQuery(api.preferences.getByUser, {
    userId: user._id,
  })

  return {
    userId: user._id,
    mealsPerWeek: prefs?.mealsPerWeek ?? 7,
    householdSize: prefs?.householdSize ?? 2,
  }
})

export const Route = createFileRoute('/onboarding/meals')({
  loader: () => fetchPreferences(),
  component: MealsPage,
})

function MealsPage() {
  const data = Route.useLoaderData()

  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
        Unable to load preferences. Please try again.
      </p>
    )
  }

  return (
    <MealsStep
      userId={data.userId}
      initialMealsPerWeek={data.mealsPerWeek}
      initialHouseholdSize={data.householdSize}
    />
  )
}
