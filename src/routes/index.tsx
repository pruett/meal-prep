import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { PastPlansList } from '~/components/plan/past-plans-list'
import { MealCard } from '~/components/meals/meal-card'
import { MealSkeleton } from '~/components/meals/meal-skeleton'
import { Button, buttonVariants } from '~/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { EmptyState } from '~/components/empty-state'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '~/components/ui/empty'
import { Spinner } from '~/components/ui/spinner'
import { Archive, ChevronUp, CircleCheck, Ellipsis, RefreshCw, UtensilsCrossed, Settings, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu'
import { PrepGenerationInterstitial } from '~/components/prep/prep-generation-interstitial'
import { PrepGuideInline } from '~/components/prep/prep-guide-inline'
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

    const weekStart = getCurrentWeekStart()
    const currentWeekPlan = plans.find((p) => p.weekStartDate === weekStart)

    // Fetch current week's meals
    const currentWeekMeals = currentWeekPlan
      ? await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId: currentWeekPlan._id,
        })
      : []

    // Fetch meal counts for past plans
    const pastPlans = plans.filter((p) => p.weekStartDate !== weekStart)
    const mealCounts = await Promise.all(
      pastPlans.map(async (plan) => {
        const meals = await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId: plan._id,
        })
        return { planId: plan._id, count: meals.length }
      }),
    )

    const countMap = Object.fromEntries(
      mealCounts.map((mc) => [mc.planId, mc.count]),
    )

    return { userId: user._id, plans, mealCountMap: countMap, currentWeekMeals }
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
    initialData: loaderData?.currentWeekMeals,
  })

  // Reactive subscription for user preferences
  const { data: preferences } = useQuery({
    ...convexQuery(
      api.preferences.getByUser,
      userId ? { userId } : 'skip',
    ),
  })

  const preferencesSummary = useMemo(() => {
    if (!preferences) return null
    const parts: string[] = []
    if (preferences.mealsPerWeek) parts.push(`${preferences.mealsPerWeek} meals/week`)
    if (preferences.householdSize) parts.push(`${preferences.householdSize} servings`)
    if (preferences.maxPrepTimeMinutes) parts.push(`${preferences.maxPrepTimeMinutes}min max prep`)
    if (preferences.dietaryRestrictions?.length) {
      parts.push(preferences.dietaryRestrictions.slice(0, 2).join(', ') +
        (preferences.dietaryRestrictions.length > 2 ? ` +${preferences.dietaryRestrictions.length - 2}` : ''))
    }
    return parts.length > 0 ? parts.join(' · ') : null
  }, [preferences])

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
  const [showPrepInterstitial, setShowPrepInterstitial] = useState(false)
  const [prepGenerationError, setPrepGenerationError] = useState<string | null>(
    null,
  )
  const [prepInterstitialKey, setPrepInterstitialKey] = useState(0)
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
  const pendingCount = currentMealCount - acceptedCount - rejectedCount

  const isPrepGuideReady = planStatus === 'finalized'

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
    if (!mealPlanId || isGeneratingPrep) return
    setPrepInterstitialKey((key) => key + 1)
    setShowPrepInterstitial(true)
    setPrepGenerationError(null)
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
      setPrepGenerationError(message)
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
    <main className="page-wrap rise-in mx-auto max-w-5xl px-4 [--action-drawer-height:7rem] pb-[calc(var(--action-drawer-height)+2rem)] pt-14">
      <Tabs defaultValue="this-week">
        <TabsList className="mb-6">
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="past-meals">Past Meals</TabsTrigger>
        </TabsList>

        {/* This Week header (visible only on This Week tab) */}
        <TabsContent value="this-week">
          <section className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="display-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Week of{' '}
                {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              {planStatus === 'reviewing' && (
                <Badge
                  variant="outline"
                  className="border-sky-200 bg-sky-50 text-sky-700"
                >
                  In Progress
                </Badge>
              )}
              {planStatus === 'finalized' && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Ready
                </Badge>
              )}
              {currentWeekPlan && (planStatus === 'reviewing' || planStatus === 'finalized') && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Ellipsis className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link to="/preferences" />}>
                      <Settings />
                      Update Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive />
                      Archive Plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </section>
        </TabsContent>

        {/* Past Meals header */}
        <TabsContent value="past-meals">
          <section className="mb-8">
            <h1 className="display-title mb-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Past Meals
            </h1>
          </section>
        </TabsContent>

        {/* This Week */}
        <TabsContent value="this-week">
          <section className="pt-4">
            {currentWeekPlan ? (
              showPrepInterstitial && mealPlanId ? (
                <PrepGenerationInterstitial
                  key={prepInterstitialKey}
                  mealCount={acceptedCount}
                  completed={isPrepGuideReady}
                  error={prepGenerationError}
                  onRetry={() => void handleGeneratePrep()}
                  onComplete={() => {
                    setShowPrepInterstitial(false)
                    setPrepGenerationError(null)
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Inline Prep Guide — visible after finalization */}
                  {planStatus === 'finalized' && mealPlanId && (
                    <PrepGuideInline mealPlanId={mealPlanId} />
                  )}

                  {/* Meals list — only show when plan is not finalized */}
                  {planStatus !== 'finalized' &&
                    (currentMealCount > 0 || isActivelyGenerating) && (
                      <div className="flex flex-col gap-3">
                        {currentWeekMeals?.map((meal) => (
                          <MealCard
                            key={meal._id}
                            meal={meal}
                            showActions={planStatus === 'reviewing'}
                            isRegenerating={
                              meal.status === 'rejected' &&
                              planStatus === 'generating'
                            }
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
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>No meals generated yet</EmptyTitle>
                        <EmptyDescription>
                          Something may have gone wrong during generation. Try
                          generating again.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
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
              )
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
              <Empty className="mx-auto max-w-lg border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UtensilsCrossed />
                  </EmptyMedia>
                  <EmptyTitle>No meals this week</EmptyTitle>
                  <EmptyDescription>
                    You haven't created any meal plans for this week.
                    <br />
                    Get started by creating this week's meal plan.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Generating…
                      </>
                    ) : (
                      <>
                        Generate Meals
                        <ArrowRight data-icon="inline-end" />
                      </>
                    )}
                  </Button>
                  <Separator />
                  <Link to="/preferences" className={buttonVariants({ variant: 'link' })}>
                    <Settings data-icon="inline-start" />
                    Update Preferences
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                  {preferencesSummary && (
                    <p className="text-xs text-muted-foreground">
                      {preferencesSummary}
                    </p>
                  )}
                </EmptyContent>
              </Empty>
            )}
          </section>
        </TabsContent>

        {/* Past Meals */}
        <TabsContent value="past-meals">
          <section className="pt-4">
            <PastPlansList plans={pastPlans} />
          </section>
        </TabsContent>
      </Tabs>

      {/* Action drawer — always visible during review */}
      {planStatus === 'reviewing' &&
        currentMealCount > 0 &&
        !showPrepInterstitial && (
        <div className="fixed inset-x-0 bottom-0 z-10 h-[var(--action-drawer-height)] bg-background">
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent" />
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-6">
            {acceptedCount === currentMealCount ? (
              <>
                <p className="flex items-center gap-2 text-base text-muted-foreground">
                  All meals accepted
                  <CircleCheck className="size-4" />
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGeneratePrep}
                  disabled={outOfCredits || isGeneratingPrep}
                >
                  {isGeneratingPrep ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Generate Prep Guide
                      <ArrowRight data-icon="inline-end" />
                    </>
                  )}
                </Button>
              </>
            ) : rejectedCount > 0 ? (
              <>
                <p className="text-base text-muted-foreground">
                  {acceptedCount + rejectedCount} of {currentMealCount} reviewed
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRegenerate}
                  disabled={outOfCredits || isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Regenerating…
                    </>
                  ) : (
                    <>
                      <RefreshCw data-icon="inline-start" />
                      Regenerate {rejectedCount} Meals
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                {pendingCount === currentMealCount ? (
                  <>
                    <ChevronUp className="size-4" />
                    Accept or reject each meal to continue
                    <ChevronUp className="size-4" />
                  </>
                ) : (
                  `${acceptedCount} of ${currentMealCount} accepted — keep reviewing`
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
