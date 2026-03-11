import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { getConvexHttpClient } from '~/lib/convex'
import { MealGrid } from '~/components/meals/meal-grid'
import { MealSkeleton } from '~/components/meals/meal-skeleton'
import { Button } from '~/components/ui/button'

// Hardcoded tracer bullet values — replaced with auth in Phase 1
const TRACER_USER_ID = 'tracer-user'

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return monday.toISOString().split('T')[0]!
}

const fetchLatestMealPlan = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const convex = getConvexHttpClient()
      const plans = await convex.query(api.mealPlans.getByUser, {
        userId: TRACER_USER_ID as Id<'users'>,
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
  loader: () => fetchLatestMealPlan(),
  component: TracerPage,
})

function TracerPage() {
  const loaderData = Route.useLoaderData()

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

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TRACER_USER_ID,
          weekStartDate: getWeekStartDate(),
          totalMeals: 7,
        }),
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
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
          {isGenerating ? 'Generating...' : 'Generate Meals'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
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
