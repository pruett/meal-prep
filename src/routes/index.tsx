import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery, useMutation as useQueryMutation } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import {
  SwipeListProvider,
  SwipeListHeader,
  SwipeListTitle,
  SwipeListProgress,
  SwipeListHint,
  SwipeList,
  SwipeListCard,
  SwipeListStage,
  SwipeListCardItem,
  SwipeListEmpty,
  useSwipeList,
} from "~/components/ui/swipe-list";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "~/components/ui/item";
import { useMealImage } from "~/hooks/use-meal-image";
import { Button, buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/empty-state";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import {
  ChevronUp,
  CircleCheck,
  Ellipsis,
  Trash2,
  UtensilsCrossed,
  Settings,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { PrepGenerationInterstitial } from "~/components/prep/prep-generation-interstitial";
import { PrepGuideInline } from "~/components/prep/prep-guide-inline";
import { ErrorFallback } from "~/components/error-boundary";
import { HomeSkeleton } from "~/components/route-skeletons";
import { AppPage } from "~/components/layout/app-page";
import { requireAuth } from "~/lib/auth-guard";
import { requireOnboarding } from "~/lib/onboarding-guard";
import { fetchAuthQuery } from "~/lib/auth-server";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Skeleton } from "~/components/ui/skeleton";

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0]!;
}

const fetchHomeData = createServerFn({ method: "GET" })
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data: { userId } }) => {
    try {
      const weekStart = getCurrentWeekStart();
      const typedUserId = userId as Id<"users">;

      const [currentWeekPlan, preferences] = await Promise.all([
        fetchAuthQuery(api.mealPlans.getByUserAndWeek, {
          userId: typedUserId,
          weekStartDate: weekStart,
        }),
        fetchAuthQuery(api.preferences.getByUser, { userId: typedUserId }),
      ]);

      const currentWeekMeals = currentWeekPlan
        ? await fetchAuthQuery(api.meals.getByMealPlan, {
            mealPlanId: currentWeekPlan._id,
          })
        : [];

      return { currentWeekPlan, currentWeekMeals, preferences };
    } catch {
      return null;
    }
  });

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    requireAuth({ context });
    requireOnboarding({ context });
  },
  loader: ({ context }) => {
    if (!context.user?._id) return null;
    return fetchHomeData({ data: { userId: context.user._id as string } });
  },
  component: HomePage,
  pendingComponent: HomeSkeleton,
  errorComponent: ErrorFallback,
});

function HomePage() {
  // ── Loader data ──────────────────────────────────────────────
  const loaderData = Route.useLoaderData();
  const { user: initialUser } = Route.useRouteContext();

  // ── Live Convex subscriptions ──────────────────────────────────────────────
  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, {}),
    initialData: initialUser ?? undefined,
  });

  const weekStart = getCurrentWeekStart();
  const { data: currentWeekPlan } = useQuery({
    ...convexQuery(
      api.mealPlans.getByUserAndWeek,
      user?._id ? { userId: user._id, weekStartDate: weekStart } : "skip",
    ),
    initialData: loaderData?.currentWeekPlan ?? undefined,
  });

  const { data: currentWeekMeals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      currentWeekPlan ? { mealPlanId: currentWeekPlan._id } : "skip",
    ),
    initialData: loaderData?.currentWeekMeals,
  });

  const { data: preferences } = useQuery({
    ...convexQuery(
      api.preferences.getByUser,
      user?._id ? { userId: user._id } : "skip",
    ),
    initialData: loaderData?.preferences ?? undefined,
  });

  const preferencesSummary = useMemo(() => {
    if (!preferences) return null;
    const parts: string[] = [];
    if (preferences.mealsPerWeek) {
      const total =
        preferences.mealsPerWeek.breakfast +
        preferences.mealsPerWeek.lunch +
        preferences.mealsPerWeek.dinner;
      parts.push(`${total} meals/week`);
    }
    if (preferences.household) {
      const total =
        preferences.household.adults +
        preferences.household.kids +
        preferences.household.infants;
      parts.push(`${total} servings`);
    }
    if (preferences.maxCookTimeMinutes)
      parts.push(`${preferences.maxCookTimeMinutes}min/meal`);
    if (preferences.dietaryRestrictions?.length) {
      parts.push(
        preferences.dietaryRestrictions.slice(0, 2).join(", ") +
          (preferences.dietaryRestrictions.length > 2
            ? ` +${preferences.dietaryRestrictions.length - 2}`
            : ""),
      );
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [preferences]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const deletePlan = useMutation(api.mealPlans.deletePlan);

  // ── Local state ─────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [showPrepInterstitial, setShowPrepInterstitial] = useState(false);
  const [prepGenerationError, setPrepGenerationError] = useState<string | null>(
    null,
  );
  const [prepInterstitialKey, setPrepInterstitialKey] = useState(0);

  // ── Derived state ───────────────────────────────────────────────────────
  type WeekStatus = "empty" | "reviewing" | "finalized";
  const weekStatus: WeekStatus = !currentWeekPlan
    ? "empty"
    : currentWeekPlan.status === "finalized"
      ? "finalized"
      : "reviewing";

  const mealPlanId = currentWeekPlan?._id ?? null;
  const planStatus = currentWeekPlan?.status;
  const currentMealCount = currentWeekMeals?.length ?? 0;
  const totalRequested = currentWeekPlan?.totalMealsRequested ?? 7;
  const isActivelyGenerating = isGenerating || planStatus === "generating";
  const acceptedCount =
    currentWeekMeals?.filter((m: Doc<"meals">) => m.status === "accepted")
      .length ?? 0;
  const outOfCredits = user?.generationsRemaining === 0;
  const isPrepGuideReady = planStatus === "finalized";
  const totalSlots = preferences?.mealsPerWeek
    ? preferences.mealsPerWeek.breakfast +
      preferences.mealsPerWeek.lunch +
      preferences.mealsPerWeek.dinner
    : (totalRequested ?? 7);
  const acceptedMeals = useMemo(
    () =>
      currentWeekMeals?.filter((m: Doc<"meals">) => m.status === "accepted") ??
      [],
    [currentWeekMeals],
  );
  const emptySlotCount = Math.max(0, totalSlots - acceptedMeals.length);
  const firstName = user?.name?.split(" ")[0];

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate meals");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message, {
        action: { label: "Retry", onClick: () => void handleGenerate() },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!mealPlanId || isGeneratingMore) return;
    setIsGeneratingMore(true);
    try {
      const response = await fetch("/api/ai/generate-more-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate more meals");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => void handleGenerateMore(),
        },
      });
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleGeneratePrep = async () => {
    if (!mealPlanId || isGeneratingPrep) return;
    setPrepInterstitialKey((key) => key + 1);
    setShowPrepInterstitial(true);
    setPrepGenerationError(null);
    setIsGeneratingPrep(true);
    try {
      const response = await fetch("/api/ai/generate-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prep guide");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setPrepGenerationError(message);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const handleDelete = async () => {
    if (!mealPlanId) return;
    try {
      await deletePlan({ id: mealPlanId });
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <AppPage className="bg-muted">
      <section className="mb-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="display-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Hi{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You don't have a meal plan this week. Look through the meal
              suggestions below.
            </p>
          </div>
          {currentWeekPlan &&
            (planStatus === "reviewing" || planStatus === "finalized") && (
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Ellipsis className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem render={<Link to="/preferences" />}>
                    <Settings />
                    Update Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 />
                    Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </section>

      <section className="pt-4">
        {showPrepInterstitial && mealPlanId ? (
          <PrepGenerationInterstitial
            key={prepInterstitialKey}
            mealCount={acceptedCount}
            completed={isPrepGuideReady}
            error={prepGenerationError}
            onRetry={() => void handleGeneratePrep()}
            onComplete={() => {
              setShowPrepInterstitial(false);
              setPrepGenerationError(null);
            }}
          />
        ) : (
          <>
            {weekStatus === "empty" && (
              <WeekEmptyView
                outOfCredits={outOfCredits}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                preferencesSummary={preferencesSummary}
              />
            )}
            {weekStatus === "reviewing" && mealPlanId && (
              <WeekReviewingView
                meals={currentWeekMeals ?? []}
                mealPlanId={mealPlanId}
                planStatus={planStatus!}
                isActivelyGenerating={isActivelyGenerating}
                currentMealCount={currentMealCount}
                totalRequested={totalRequested}
                totalSlots={totalSlots}
                onGenerateMore={handleGenerateMore}
                isGeneratingMore={isGeneratingMore}
                outOfCredits={outOfCredits}
              />
            )}
            {weekStatus === "finalized" && mealPlanId && (
              <WeekFinalizedView mealPlanId={mealPlanId} />
            )}
          </>
        )}
      </section>

      {/* Your Weekly Plan — hidden during reviewing (SwipeList tray handles it) */}
      {weekStatus !== "reviewing" && (
        <section className="pt-4">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Your Weekly Plan
          </h2>
          <div className="flex flex-col gap-3">
            {acceptedMeals.map((meal) => (
              <div
                key={meal._id}
                className="flex items-center gap-3 rounded-2xl border border-foreground/30 bg-background px-4 py-3.5"
              >
                <CircleCheck className="size-5 shrink-0 text-primary" />
                <span className="text-base font-semibold">{meal.name}</span>
              </div>
            ))}
            {Array.from({ length: emptySlotCount }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-background px-4 py-4"
              >
                <UtensilsCrossed className="size-5 text-muted-foreground/30" />
                <span className="text-xs font-medium text-muted-foreground/40">
                  Meal {acceptedMeals.length + i + 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action drawer — commented out for now
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
      */}
    </AppPage>
  );
}

// ── Phase components ────────────────────────────────────────────────────────

function WeekEmptyView({
  outOfCredits,
  isGenerating,
  onGenerate,
  preferencesSummary,
}: {
  outOfCredits: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  preferencesSummary: string | null;
}) {
  if (outOfCredits) {
    return (
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
    );
  }

  return (
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
        <Button onClick={onGenerate} disabled={isGenerating} size="lg">
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
        <Link to="/preferences" className={buttonVariants({ variant: "link" })}>
          <Settings data-icon="inline-start" />
          Update Preferences
          <ArrowUpRight data-icon="inline-end" />
        </Link>
        {preferencesSummary && (
          <p className="text-xs text-muted-foreground">{preferencesSummary}</p>
        )}
      </EmptyContent>
    </Empty>
  );
}

function WeekReviewingView({
  meals,
  mealPlanId,
  isActivelyGenerating,
  currentMealCount,
  totalSlots,
  onGenerateMore,
  isGeneratingMore,
  outOfCredits,
}: {
  meals: Doc<"meals">[];
  mealPlanId: Id<"mealPlans">;
  planStatus: string;
  isActivelyGenerating: boolean;
  currentMealCount: number;
  totalRequested: number;
  totalSlots: number;
  onGenerateMore: () => void;
  isGeneratingMore: boolean;
  outOfCredits: boolean;
}) {
  const updateStatus = useMutation(api.meals.updateStatus);

  const reviewingMeals = useMemo(
    () =>
      meals.filter((m) => m.status !== "accepted" && m.status !== "rejected"),
    [meals],
  );

  const loadMore = useQueryMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/generate-more-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId, count: 2 }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate more meals");
      }
      return data;
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleLoadMore = useCallback(() => {
    if (loadMore.isPending || outOfCredits) return;
    loadMore.mutate();
  }, [loadMore, outOfCredits]);

  if (currentMealCount === 0 && !isActivelyGenerating) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No meals generated yet</EmptyTitle>
          <EmptyDescription>
            Something may have gone wrong during generation. Try generating
            again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <SwipeListProvider
      items={reviewingMeals}
      getItemId={(m) => m._id}
      loadMoreThreshold={3}
      onLoadMore={handleLoadMore}
      onSwipeRight={async (meal) => {
        try {
          await updateStatus({ id: meal._id, status: "accepted" });
        } catch {
          toast.error("Failed to accept meal");
        }
      }}
      onSwipeLeft={async (meal) => {
        try {
          await updateStatus({ id: meal._id, status: "rejected" });
        } catch {
          toast.error("Failed to dismiss meal");
        }
      }}
      className="-mx-4"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await Promise.all(
            meals.map((m) => updateStatus({ id: m._id, status: "pending" })),
          );
        }}
      >
        Reset meals back to pending
      </Button>
      <SwipeListHeader>
        <SwipeListTitle>Meal Suggestions</SwipeListTitle>
      </SwipeListHeader>
      <SwipeListProgress />
      <SwipeListHint />
      <SwipeList>
        <PendingMealCards />
      </SwipeList>
      <Drawer>
        <DrawerTrigger asChild>
          <SelectedMealsTrigger />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Your Weekly Plan</DrawerTitle>
            <SelectedMealsDescription />
          </DrawerHeader>
          <DrawerMealList />
          <DrawerFooter>
            <Button size="lg">
              Finalize Plan
              <ArrowRight data-icon="inline-end" />
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <SwipeListEmpty>
        <ReviewCompleteContent
          meals={meals}
          totalSlots={totalSlots}
          onGenerateMore={onGenerateMore}
          isGeneratingMore={isGeneratingMore}
          outOfCredits={outOfCredits}
        />
      </SwipeListEmpty>
    </SwipeListProvider>
  );
}

function ReviewCompleteContent({
  meals,
  totalSlots,
  onGenerateMore,
  isGeneratingMore,
  outOfCredits,
}: {
  meals: Doc<"meals">[];
  totalSlots: number;
  onGenerateMore: () => void;
  isGeneratingMore: boolean;
  outOfCredits: boolean;
}) {
  const { swipedRight } = useSwipeList<Doc<"meals">>();
  const acceptedCount = meals.filter((m) => m.status === "accepted").length;
  const totalAccepted = Math.max(acceptedCount, swipedRight.length);
  const remaining = totalSlots - totalAccepted;
  const needsMore = remaining > 0;

  return (
    <>
      <span className="text-4xl">✨</span>
      <div>
        <h2 className="text-lg font-bold">All reviewed!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsMore
            ? `You still need ${remaining} more meal${remaining !== 1 ? "s" : ""} to fill your week.`
            : "You've reviewed all meal suggestions."}
        </p>
      </div>
      {needsMore && (
        <Button
          onClick={onGenerateMore}
          disabled={isGeneratingMore || outOfCredits}
          size="lg"
        >
          {isGeneratingMore ? (
            <>
              <Spinner data-icon="inline-start" />
              Generating…
            </>
          ) : (
            <>
              <RefreshCw data-icon="inline-start" />
              Generate More
            </>
          )}
        </Button>
      )}
    </>
  );
}

function PendingMealCards() {
  const { pending } = useSwipeList<Doc<"meals">>();
  return (
    <ItemGroup>
      {pending.map((meal) => (
        <SwipeListCard key={meal._id} value={meal}>
          <SwipeListStage>
            <SwipeListCardItem className="p-0">
              <ItemMedia variant="image" className="size-40">
                <MealCardImage meal={meal} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{meal.name}</ItemTitle>
                <ItemDescription className="text-xs">
                  {meal.keyIngredients.join(", ")}
                </ItemDescription>
              </ItemContent>
            </SwipeListCardItem>
          </SwipeListStage>
          <Separator className="my-0" />
        </SwipeListCard>
      ))}
    </ItemGroup>
  );
}

function MealCardImage({ meal }: { meal: Doc<"meals"> }) {
  const { imageUrl } = useMealImage(meal);
  if (!imageUrl) return <Skeleton className="size-full rounded-none" />;
  return <img className="size-full" src={imageUrl} alt={meal.name} />;
}

function SelectedMealsTrigger() {
  const { swipedRight } = useSwipeList<Doc<"meals">>();
  return (
    <>
      <div className="flex -space-x-1.5">
        {swipedRight.slice(0, 4).map((meal) => {
          const thumb = <SelectedMealThumb key={meal._id} meal={meal} />;
          return thumb;
        })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {swipedRight.length} meal{swipedRight.length !== 1 ? "s" : ""} selected
        </p>
        <p className="text-xs text-muted-foreground">Tap to review your picks</p>
      </div>
      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
}

function SelectedMealThumb({ meal }: { meal: Doc<"meals"> }) {
  const { imageUrl } = useMealImage(meal);
  return (
    <div className="size-8 shrink-0 overflow-hidden rounded-full border-2 border-card bg-muted">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={meal.name}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

function SelectedMealsDescription() {
  const { swipedRight } = useSwipeList<Doc<"meals">>();
  return (
    <DrawerDescription>
      {swipedRight.length} meal{swipedRight.length !== 1 ? "s" : ""} you've chosen for the
      week
    </DrawerDescription>
  );
}

function DrawerMealList() {
  const { swipedRight, getItemId } = useSwipeList<Doc<"meals">>();
  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4">
      {swipedRight.map((meal) => (
        <DrawerMealRow key={getItemId(meal)} meal={meal} />
      ))}
    </div>
  );
}

function DrawerMealRow({ meal }: { meal: Doc<"meals"> }) {
  const { imageUrl } = useMealImage(meal);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={meal.name}
          className="size-12 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{meal.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {meal.keyIngredients.join(", ")}
        </p>
      </div>
      <CircleCheck className="size-4 shrink-0 text-emerald-500" />
    </div>
  );
}

function WeekFinalizedView({ mealPlanId }: { mealPlanId: Id<"mealPlans"> }) {
  return <PrepGuideInline mealPlanId={mealPlanId} />;
}
