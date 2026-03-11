import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import { getToken } from '~/lib/auth-server'
import { GenerateStep } from '~/components/onboarding/generate-step'

const fetchPreferences = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = await getToken()
    if (!token) return null

    const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
    convex.setAuth(token)

    const user = await convex.query(api.users.getAuthenticated, {})
    if (!user) return null

    const prefs = await convex.query(api.preferences.getByUser, {
      userId: user._id,
    })

    if (!prefs) return null

    return {
      userId: user._id,
      preferences: {
        dietaryRestrictions: prefs.dietaryRestrictions,
        cuisinePreferences: prefs.cuisinePreferences,
        mealsPerWeek: prefs.mealsPerWeek,
        householdSize: prefs.householdSize,
        maxPrepTimeMinutes: prefs.maxPrepTimeMinutes,
        kitchenEquipment: prefs.kitchenEquipment,
        foodsToAvoid: prefs.foodsToAvoid,
      },
    }
  },
)

export const Route = createFileRoute('/onboarding/generate')({
  loader: () => fetchPreferences(),
  component: GeneratePage,
})

function GeneratePage() {
  const data = Route.useLoaderData()

  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
        Unable to load preferences. Please try again.
      </p>
    )
  }

  return (
    <GenerateStep userId={data.userId} preferences={data.preferences} />
  )
}
