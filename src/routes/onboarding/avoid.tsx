import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import { getToken } from '~/lib/auth-server'
import { AvoidStep } from '~/components/onboarding/avoid-step'

const fetchPreferences = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getToken()
  if (!token) return null

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
  convex.setAuth(token)

  const user = await convex.query(api.users.getAuthenticated, {})
  if (!user) return null

  const prefs = await convex.query(api.preferences.getByUser, {
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
