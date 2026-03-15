import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { PastPlansList } from '~/components/plan/past-plans-list'
import { GenerationStatus } from '~/components/meals/generation-status'
import { MealCard } from '~/components/meals/meal-card'
import { MealSkeleton } from '~/components/meals/meal-skeleton'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/empty-state'
import { ErrorFallback } from '~/components/error-boundary'
import { HomeSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { requireOnboarding } from '~/lib/onboarding-guard'
import { fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import type { Doc } from '../../convex/_generated/dataModel'

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

  const updatePlanStatus = useMutation(api.mealPlans.updateStatus)
  const deletePlan = useMutation(api.mealPlans.deletePlan)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false)
  const outOfCredits = user?.generationsRemaining === 0

  const mealPlanId = currentWeekPlan?._id ?? null
  const planStatus = currentWeekPlan?.status
  const currentMealCount = currentWeekMeals?.length ?? 0
  const totalRequested = currentWeekPlan?.totalMealsRequested ?? 7
  const isActivelyGenerating =
    isGenerating || isRegenerating || planStatus === 'generating'
  const acceptedCount =
    currentWeekMeals?.filter((m: Doc<'meals'>) => m.status === 'accepted')
      .length ?? 0
  const rejectedCount =
    currentWeekMeals?.filter((m: Doc<'meals'>) => m.status === 'rejected')
      .length ?? 0

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message, {
        action: { label: 'Retry', onClick: () => void handleGenerate() },
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    if (!mealPlanId) return
    setIsRegenerating(true)

    try {
      const response = await fetch('/api/ai/regenerate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate meals')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message, {
        action: { label: 'Retry', onClick: () => void handleRegenerate() },
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleGeneratePrep = async () => {
    if (!mealPlanId) return
    setIsGeneratingPrep(true)

    try {
      const response = await fetch('/api/ai/generate-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prep guide')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message, {
        action: { label: 'Retry', onClick: () => void handleGeneratePrep() },
      })
    } finally {
      setIsGeneratingPrep(false)
    }
  }

  const handleArchive = async () => {
    if (!mealPlanId) return
    try {
      await updatePlanStatus({ id: mealPlanId, status: 'archived' })
    } catch {
      toast.error('Failed to archive plan')
    }
  }

  const handleDelete = async () => {
    if (!mealPlanId) return
    try {
      await deletePlan({ id: mealPlanId })
      toast.success('Plan deleted')
    } catch {
      toast.error('Failed to delete plan')
    }
  }

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
          <div className="flex flex-col gap-4">
            {/* Status banner */}
            {planStatus && (
              <GenerationStatus
                status={planStatus}
                totalMeals={totalRequested}
                mealsCount={currentMealCount}
                acceptedCount={acceptedCount}
                rejectedCount={rejectedCount}
              />
            )}

            {/* Regenerate rejected meals */}
            {planStatus === 'reviewing' && rejectedCount > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRegenerate}
                  disabled={outOfCredits || isRegenerating}
                  variant="outline"
                  size="sm"
                >
                  {isRegenerating ? (
                    <>
                      <svg
                        className="mr-1.5 h-3.5 w-3.5 animate-spin"
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
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-1.5 h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Regenerate {rejectedCount} Rejected
                    </>
                  )}
                </Button>
                {outOfCredits && (
                  <span className="text-xs text-[var(--sea-ink-soft)]">
                    No credits remaining
                  </span>
                )}
              </div>
            )}

            {/* Generate Prep Guide — visible when all meals accepted */}
            {planStatus === 'reviewing' &&
              currentMealCount > 0 &&
              acceptedCount === currentMealCount && (
                <div className="island-shell flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--sea-ink)]">
                      All meals accepted
                    </p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      {outOfCredits
                        ? 'No credits remaining to generate a prep guide.'
                        : 'Generate full recipes, a shopping list, and batch prep steps.'}
                    </p>
                  </div>
                  <Button
                    onClick={handleGeneratePrep}
                    disabled={outOfCredits || isGeneratingPrep}
                    size="sm"
                  >
                    {isGeneratingPrep ? (
                      <>
                        <svg
                          className="mr-1.5 h-3.5 w-3.5 animate-spin"
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
                      'Generate Prep Guide'
                    )}
                  </Button>
                </div>
              )}

            {/* View Prep Guide — visible after finalization */}
            {planStatus === 'finalized' && (
              <Link
                to="/plan/$weekStart/prep"
                params={{ weekStart }}
                className="island-shell flex items-center justify-between rounded-xl p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--palm)]/15">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--palm)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--sea-ink)]">
                      View Prep Guide
                    </p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      Recipes, shopping list, and batch prep steps
                    </p>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 text-[var(--sea-ink-soft)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}

            {/* Meals grid */}
            {(currentMealCount > 0 || isActivelyGenerating) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currentWeekMeals?.map((meal) => (
                  <MealCard
                    key={meal._id}
                    meal={meal}
                    showActions={planStatus === 'reviewing'}
                  />
                ))}
                {isActivelyGenerating &&
                  currentMealCount < totalRequested &&
                  Array.from(
                    { length: totalRequested - currentMealCount },
                    (_, i) => <MealSkeleton key={`skeleton-${i}`} />,
                  )}
              </div>
            )}

            {/* Empty state — plan exists but no meals and not generating */}
            {currentMealCount === 0 && !isActivelyGenerating && (
              <p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
                No meals in this plan yet.
              </p>
            )}

            {/* Archive / Delete plan */}
            {(planStatus === 'reviewing' || planStatus === 'finalized') && (
              <div className="flex justify-center border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={handleArchive}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--sea-ink)]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                  Archive Plan
                </button>
              </div>
            )}
            {planStatus === 'archived' && (
              <div className="flex justify-center border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Delete Plan
                </button>
              </div>
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
