import { useState, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { PastPlansList } from '~/components/plan/past-plans-list'
import { PlanSummary } from '~/components/plan/plan-summary'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/empty-state'
import { ErrorFallback } from '~/components/error-boundary'
import { HomeSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { requireOnboarding } from '~/lib/onboarding-guard'
import { fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'

function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return monday.toISOString().split('T')[0]!
}

const fetchHomeData = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const user = await fetchAuthQuery(api.users.getAuthenticated, {})
    if (!user) return null

    const plans = await fetchAuthQuery(api.mealPlans.getByUser, {
      userId: user._id,
    })

    // Fetch meal counts for each plan
    const mealCounts = await Promise.all(
      plans.map(async (plan) => {
        const meals = await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId: plan._id,
        })
        return { planId: plan._id, count: meals.length }
      }),
    )

    const countMap = Object.fromEntries(
      mealCounts.map((mc) => [mc.planId, mc.count]),
    )

    return { userId: user._id, plans, mealCountMap: countMap }
  } catch {
    return null
  }
})

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    requireAuth({ context })
    requireOnboarding({ context })
  },
  loader: () => fetchHomeData(),
  component: HomePage,
  pendingComponent: HomeSkeleton,
  errorComponent: ErrorFallback,
})

function HomePage() {
  const loaderData = Route.useLoaderData()
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
  })

  const userId = loaderData?.userId ?? null

  // Reactive subscription for plans
  const { data: reactivePlans } = useQuery({
    ...convexQuery(
      api.mealPlans.getByUser,
      userId ? { userId } : 'skip',
    ),
    initialData: loaderData?.plans,
  })

  const weekStart = getCurrentWeekStart()
  const ssrCountMap = loaderData?.mealCountMap

  const plans = useMemo(
    () => reactivePlans ?? loaderData?.plans ?? [],
    [reactivePlans, loaderData?.plans],
  )

  const currentWeekPlan = useMemo(
    () => plans.find((p) => p.weekStartDate === weekStart) ?? null,
    [plans, weekStart],
  )

  // Reactive subscription for current week's meals
  const { data: currentWeekMeals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      currentWeekPlan ? { mealPlanId: currentWeekPlan._id } : 'skip',
    ),
  })

  const pastPlans = useMemo(() => {
    const countMap = ssrCountMap ?? {}
    return plans
      .filter((p) => p.weekStartDate !== weekStart)
      .map((p) => ({
        _id: p._id,
        weekStartDate: p.weekStartDate,
        status: p.status,
        totalMealsRequested: p.totalMealsRequested,
        mealCount: (countMap[p._id as string] as number) ?? p.totalMealsRequested,
      }))
  }, [plans, weekStart, ssrCountMap])

  const [isGenerating, setIsGenerating] = useState(false)
  const outOfCredits = user?.generationsRemaining === 0

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meals')
      }

      navigate({
        to: '/plan/$weekStart',
        params: { weekStart },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message, {
        action: { label: 'Retry', onClick: () => void handleGenerate() },
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const currentMealCount = currentWeekMeals?.length ?? 0

  return (
    <main className="page-wrap rise-in px-4 pb-8 pt-14">
      {/* Header */}
      <section className="mb-8">
        <p className="island-kicker mb-2">Home</p>
        <h1 className="display-title mb-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          MealPrep
        </h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          AI-powered weekly meal planning
        </p>
      </section>

      {/* This Week */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
          This Week
        </h2>

        {currentWeekPlan ? (
          <div className="flex flex-col gap-3">
            <PlanSummary
              weekStartDate={currentWeekPlan.weekStartDate}
              status={currentWeekPlan.status}
              mealCount={currentMealCount}
              totalMealsRequested={currentWeekPlan.totalMealsRequested}
            />

            {/* Quick actions for current plan */}
            {currentWeekPlan.status === 'finalized' && (
              <Link
                to="/plan/$weekStart/prep"
                params={{ weekStart }}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--palm)]/20 bg-[var(--palm)]/[0.06] px-4 py-3 text-sm font-medium text-[var(--palm)] no-underline transition hover:bg-[var(--palm)]/[0.1]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                View Prep Guide
              </Link>
            )}
          </div>
        ) : outOfCredits ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <EmptyState
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              }
              title="Out of credits"
              description="You've used all your generation credits. Meal generation is currently unavailable."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <p className="mb-1 text-base font-semibold text-[var(--sea-ink)]">
              No plan for this week
            </p>
            <p className="mb-5 text-sm text-[var(--sea-ink-soft)]">
              Generate an AI-powered meal plan to get started.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="mr-1.5 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Generating…
                </>
              ) : (
                'Generate Meals'
              )}
            </Button>
          </div>
        )}
      </section>

      {/* Past Plans */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
          Past Plans
        </h2>
        <PastPlansList plans={pastPlans} />
      </section>
    </main>
  )
}
