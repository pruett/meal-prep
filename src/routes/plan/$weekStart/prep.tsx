import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

import { RecipeCard } from '~/components/prep/recipe-card'
import { ShoppingList } from '~/components/prep/shopping-list'
import { requireAuth } from '~/lib/auth-guard'
import { getToken } from '~/lib/auth-server'
import type { Doc } from '../../../../convex/_generated/dataModel'

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endStr = end.toLocaleDateString(
    'en-US',
    start.getMonth() === end.getMonth()
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' },
  )

  return `${startStr} – ${endStr}`
}

const fetchPrepGuideData = createServerFn({ method: 'GET' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: weekStart }) => {
    try {
      const token = await getToken()
      if (!token) return null

      const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
      convex.setAuth(token)

      const user = await convex.query(api.users.getAuthenticated, {})
      if (!user) return null

      const plan = await convex.query(api.mealPlans.getByUserAndWeek, {
        userId: user._id,
        weekStartDate: weekStart,
      })

      if (!plan) return null

      const meals = await convex.query(api.meals.getByMealPlan, {
        mealPlanId: plan._id,
      })

      const prepGuide = await convex.query(api.prepGuides.getByMealPlan, {
        mealPlanId: plan._id,
      })

      return { userId: user._id, plan, meals, prepGuide }
    } catch {
      return null
    }
  })

export const Route = createFileRoute('/plan/$weekStart/prep')({
  beforeLoad: requireAuth,
  loader: ({ params }) => fetchPrepGuideData({ data: params.weekStart }),
  component: PrepGuidePage,
})

function PrepGuidePage() {
  const { weekStart } = Route.useParams()
  const loaderData = Route.useLoaderData()
  const mealPlanId = loaderData?.plan?._id ?? null

  // Reactive subscription for prep guide
  const { data: prepGuide } = useQuery({
    ...convexQuery(
      api.prepGuides.getByMealPlan,
      mealPlanId ? { mealPlanId } : 'skip',
    ),
    initialData: loaderData?.prepGuide,
  })

  // Reactive subscription for meals (to get full recipes)
  const { data: meals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      mealPlanId ? { mealPlanId } : 'skip',
    ),
    initialData: loaderData?.meals,
  })

  const acceptedMeals =
    meals?.filter((m: Doc<'meals'>) => m.status === 'accepted') ?? []

  if (!loaderData || !prepGuide) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
          No prep guide available.{' '}
          <Link
            to="/plan/$weekStart"
            params={{ weekStart }}
            className="underline hover:text-[var(--sea-ink)]"
          >
            Return to meal plan
          </Link>
        </p>
      </main>
    )
  }

  return (
    <main className="page-wrap rise-in px-4 pb-8 pt-14">
      {/* Header */}
      <section className="mb-8">
        <Link
          to="/plan/$weekStart"
          params={{ weekStart }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to meal plan
        </Link>
        <p className="island-kicker mb-2">Prep Guide</p>
        <h1 className="display-title mb-2 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {formatWeekRange(weekStart)}
        </h1>
        <div className="flex items-center gap-3 text-sm text-[var(--sea-ink-soft)]">
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {prepGuide.totalEstimatedMinutes} min total
          </span>
          <span className="text-[var(--line)]">|</span>
          <span>{acceptedMeals.length} recipes</span>
          <span className="text-[var(--line)]">|</span>
          <span>{prepGuide.shoppingList.length} items</span>
        </div>
      </section>

      {/* Tabbed content */}
      <Tabs defaultValue="recipes">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
          <TabsTrigger value="prep">Prep Steps</TabsTrigger>
        </TabsList>

        {/* Recipes tab */}
        <TabsContent value="recipes">
          <div className="space-y-6">
            {acceptedMeals.map((meal: Doc<'meals'>) => (
              <RecipeCard key={meal._id} meal={meal} />
            ))}
            {acceptedMeals.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
                No accepted meals with recipes.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Shopping List tab */}
        <TabsContent value="shopping">
          <ShoppingList items={prepGuide.shoppingList} />
        </TabsContent>

        {/* Prep Steps tab */}
        <TabsContent value="prep">
          <div className="space-y-4">
            {prepGuide.batchPrepSteps
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => (
                <PrepStep key={step.stepNumber} step={step} />
              ))}
            {prepGuide.batchPrepSteps.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
                No prep steps.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}

/* ── Prep Step ── */

type BatchPrepStep = {
  stepNumber: number
  instruction: string
  estimatedMinutes: number
  relatedMeals: string[]
}

function PrepStep({ step }: { step: BatchPrepStep }) {
  return (
    <div className="flex gap-4 rounded-xl border border-[var(--line)] p-4">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: 'var(--lagoon-deep)' }}
      >
        {step.stepNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--sea-ink)]">{step.instruction}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {step.estimatedMinutes} min
          </span>
          {step.relatedMeals.map((meal) => (
            <Badge key={meal} variant="secondary" className="text-xs">
              {meal}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
