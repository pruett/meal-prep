import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { MealGrid } from '~/components/meals/meal-grid'
import { MealSkeleton } from '~/components/meals/meal-skeleton'
import { Button } from '~/components/ui/button'
import { requireAuth } from '~/lib/auth-guard'
import { getToken } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'

const fetchLatestMealPlan = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const token = await getToken()
      if (!token) return null

      const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
      convex.setAuth(token)

      const user = await convex.query(api.users.getAuthenticated, {})
      if (!user) return null

      const plans = await convex.query(api.mealPlans.getByUser, {
        userId: user._id,
      })
      if (plans.length === 0) return null
      const plan = plans[0]!
      const meals = await convex.query(api.meals.getByMealPlan, {
        mealPlanId: plan._id,
      })
      return { plan, meals }
    } catch {
      return null
    }
  },
)

export const Route = createFileRoute('/')({
  beforeLoad: requireAuth,
  loader: () => fetchLatestMealPlan(),
  component: TracerPage,
})

function TracerPage() {
  const loaderData = Route.useLoaderData()
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
  })

  const [mealPlanId, setMealPlanId] = useState<Id<'mealPlans'> | null>(
    loaderData?.plan._id ?? null,
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: meals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      mealPlanId ? { mealPlanId } : 'skip',
    ),
    initialData: loaderData?.meals,
  })

  const outOfCredits = user?.generationsRemaining === 0

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meals')
      }

      setMealPlanId(data.mealPlanId as Id<'mealPlans'>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="mb-8">
        <h1 className="display-title mb-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          MealPrep
        </h1>
        <p className="text-[var(--sea-ink-soft)]">
          AI-powered weekly meal planning
        </p>
      </section>

      <section className="mb-8 flex items-center gap-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || outOfCredits}
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Meals'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {outOfCredits && (
          <p className="text-sm font-medium text-destructive">
            You've used all your generation credits.
          </p>
        )}
      </section>

      {isGenerating && !meals?.length && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }, (_, i) => (
            <MealSkeleton key={i} />
          ))}
        </div>
      )}

      {meals && meals.length > 0 && <MealGrid meals={meals} />}
    </main>
  )
}
