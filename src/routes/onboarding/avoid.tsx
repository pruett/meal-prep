import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { api } from '../../../convex/_generated/api'
import { fetchAuthQuery } from '~/lib/auth-server'
import { AvoidStep } from '~/components/onboarding/avoid-step'

const fetchPreferences = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await fetchAuthQuery(api.users.getAuthenticated, {})
  if (!user) return null

  const prefs = await fetchAuthQuery(api.preferences.getByUser, {
    userId: user._id,
  })

  return {
    userId: user._id,
    foodsToAvoid: prefs?.foodsToAvoid ?? '',
  }
})

export const Route = createFileRoute('/onboarding/avoid')({
  loader: () => fetchPreferences(),
  component: AvoidPage,
})

function AvoidPage() {
  const data = Route.useLoaderData()

  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
        Unable to load preferences. Please try again.
      </p>
    )
  }

  return (
    <AvoidStep
      userId={data.userId}
      initialFoodsToAvoid={data.foodsToAvoid}
    />
  )
}
