import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { ConvexHttpClient } from 'convex/browser'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../../../convex/_generated/api'
import { GenerationStatus } from '~/components/meals/generation-status'
import { MealCard } from '~/components/meals/meal-card'
import { MealSkeleton } from '~/components/meals/meal-skeleton'
import { Button } from '~/components/ui/button'
import { ErrorFallback } from '~/components/error-boundary'
import { MealPlanSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { getToken } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
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

const fetchMealPlanData = createServerFn({ method: 'GET' })
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

      const meals = plan
        ? await convex.query(api.meals.getByMealPlan, {
            mealPlanId: plan._id,
          })
        : []

      return { userId: user._id, plan, meals }
    } catch {
      return null
    }
  })

export const Route = createFileRoute('/plan/$weekStart')({
  beforeLoad: requireAuth,
  loader: ({ params }) => fetchMealPlanData({ data: params.weekStart }),
  component: MealPlanPage,
  pendingComponent: MealPlanSkeleton,
  errorComponent: ErrorFallback,
})

function MealPlanPage() {
  const { weekStart } = Route.useParams()
  const loaderData = Route.useLoaderData()
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
  })

  const navigate = useNavigate()
  const updatePlanStatus = useMutation(api.mealPlans.updateStatus)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false)

  const userId = loaderData?.userId ?? null
  const outOfCredits = user?.generationsRemaining === 0

  // Reactive subscription for the meal plan (tracks status changes)
  const { data: plan } = useQuery({
    ...convexQuery(
      api.mealPlans.getByUserAndWeek,
      userId ? { userId, weekStartDate: weekStart } : 'skip',
    ),
    initialData: loaderData?.plan,
  })

  const mealPlanId = plan?._id ?? null

  // Reactive subscription for meals (tracks streaming additions)
  const { data: meals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      mealPlanId ? { mealPlanId } : 'skip',
    ),
    initialData: loaderData?.meals,
  })

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
      navigate({ to: '/' })
    } catch {
      toast.error('Failed to archive plan')
    }
  }

  if (!loaderData) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
          Unable to load meal plan data. Please try again.
        </p>
      </main>
    )
  }

  const planStatus = plan?.status
  const isActivelyGenerating =
    isGenerating || isRegenerating || planStatus === 'generating'
  const totalRequested = plan?.totalMealsRequested ?? 7
  const mealsCount = meals?.length ?? 0
  const acceptedCount =
    meals?.filter((m: Doc<'meals'>) => m.status === 'accepted').length ?? 0
  const rejectedCount =
    meals?.filter((m: Doc<'meals'>) => m.status === 'rejected').length ?? 0

  return (
    <main className="page-wrap rise-in px-4 pb-8 pt-14">
      {/* Header */}
      <section className="mb-8">
        <p className="island-kicker mb-2">Meal Plan</p>
        <h1 className="display-title mb-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {formatWeekRange(weekStart)}
        </h1>
      </section>

      {/* Status banner */}
      {planStatus && (
        <div className="mb-6">
          <GenerationStatus
            status={planStatus}
            totalMeals={totalRequested}
            mealsCount={mealsCount}
            acceptedCount={acceptedCount}
            rejectedCount={rejectedCount}
          />
        </div>
      )}

      {/* Regenerate rejected meals */}
      {planStatus === 'reviewing' && rejectedCount > 0 && (
        <div className="mb-6 flex items-center gap-3">
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
        mealsCount > 0 &&
        acceptedCount === mealsCount && (
          <div className="mb-6">
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
          </div>
        )}

      {/* View Prep Guide — visible after finalization */}
      {planStatus === 'finalized' && (
        <div className="mb-6">
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
        </div>
      )}

      {/* No plan — generate CTA */}
      {!plan && !isGenerating && (
        <section className="island-shell mb-8 rounded-2xl p-6 text-center sm:p-8">
          <p className="mb-1 text-lg font-semibold text-[var(--sea-ink)]">
            No meals planned yet
          </p>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
            {outOfCredits
              ? "You've used all your generation credits."
              : 'Generate an AI-powered meal plan for this week.'}
          </p>
          <Button
            onClick={handleGenerate}
            disabled={outOfCredits}
            size="lg"
          >
            Generate Meals
          </Button>
        </section>
      )}

      {/* Meals grid — real meals + skeleton placeholders during generation */}
      {(mealsCount > 0 || isActivelyGenerating) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals?.map((meal) => (
            <MealCard
              key={meal._id}
              meal={meal}
              showActions={planStatus === 'reviewing'}
            />
          ))}
          {isActivelyGenerating &&
            mealsCount < totalRequested &&
            Array.from({ length: totalRequested - mealsCount }, (_, i) => (
              <MealSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      )}

      {/* Empty state — plan exists but no meals and not generating */}
      {plan && mealsCount === 0 && !isActivelyGenerating && (
        <p className="py-12 text-center text-[var(--sea-ink-soft)]">
          No meals in this plan yet.
        </p>
      )}

      {/* Archive plan */}
      {plan && (planStatus === 'reviewing' || planStatus === 'finalized') && (
        <div className="mt-10 flex justify-center border-t border-[var(--line)] pt-6">
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
    </main>
  )
}

