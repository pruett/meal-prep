import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  useQuery,
  useMutation as useQueryMutation,
} from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { callAiApi } from "~/lib/ai/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { PrepGenerationInterstitial } from "~/components/prep/prep-generation-interstitial";
import { ErrorFallback } from "~/components/error-boundary";
import { HomeSkeleton } from "~/components/route-skeletons";
import { AppShell } from "~/components/layout/app-shell";
import { requireAuth } from "~/lib/auth-guard";
import { requireOnboarding } from "~/lib/onboarding-guard";
import { fetchAuthQuery } from "~/lib/auth-server";
import { deriveCurrentWeek } from "./-index/types";
import { WeekNoPlan } from "./-index/week-no-plan";
import { WeekGenerating } from "./-index/week-generating";
import { WeekReviewing } from "./-index/week-reviewing";
import { WeekFinalized } from "./-index/week-finalized";
import {
  CircleCheck,
  Ellipsis,
  Trash2,
  UtensilsCrossed,
  Settings,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

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
  const { data: currentWeekMealPlan } = useQuery({
    ...convexQuery(
      api.mealPlans.getByUserAndWeek,
      user?._id ? { userId: user._id, weekStartDate: weekStart } : "skip",
    ),
    initialData: loaderData?.currentWeekPlan ?? undefined,
  });

  const { data: currentWeekMeals } = useQuery({
    ...convexQuery(
      api.meals.getByMealPlan,
      currentWeekMealPlan ? { mealPlanId: currentWeekMealPlan._id } : "skip",
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

  const generateMeals = useQueryMutation({
    mutationFn: () => callAiApi("generate-meals"),
    onError: (err: Error) => {
      toast.error(err.message, {
        action: { label: "Retry", onClick: () => generateMeals.mutate() },
      });
    },
  });

  const generateMore = useQueryMutation({
    mutationFn: (vars: { mealPlanId: string; count?: number }) =>
      callAiApi("generate-more-meals", vars),
    onError: (err: Error) => {
      toast.error(err.message, {
        action: {
          label: "Retry",
          onClick: () =>
            generateMore.mutate({ mealPlanId: mealPlanId as string }),
        },
      });
    },
  });

  const generatePrep = useQueryMutation({
    mutationFn: (vars: { mealPlanId: string }) =>
      callAiApi("generate-prep", vars),
    onError: (err: Error) => setPrepGenerationError(err.message),
  });

  // ── Local state ─────────────────────────────────────────────────────────
  const [showPrepInterstitial, setShowPrepInterstitial] = useState(false);
  const [prepGenerationError, setPrepGenerationError] = useState<string | null>(
    null,
  );
  const [prepInterstitialKey, setPrepInterstitialKey] = useState(0);

  // ── Derived state ───────────────────────────────────────────────────────
  const currentWeek = useMemo(
    () => deriveCurrentWeek(currentWeekMealPlan, currentWeekMeals),
    [currentWeekMealPlan, currentWeekMeals],
  );

  const mealPlanId =
    currentWeek.phase !== "no-plan" ? currentWeek.mealPlanId : null;
  const outOfCredits = user?.generationsRemaining === 0;
  const firstName = user?.name?.split(" ")[0];
  const totalSlots = preferences?.mealsPerWeek
    ? preferences.mealsPerWeek.breakfast +
      preferences.mealsPerWeek.lunch +
      preferences.mealsPerWeek.dinner
    : (currentWeekMealPlan?.totalMealsRequested ?? 7);

  const acceptedMeals = useMemo(
    () => currentWeekMeals?.filter((m) => m.status === "accepted") ?? [],
    [currentWeekMeals],
  );
  const acceptedMealsCount = acceptedMeals.length;
  const emptySlotCount = Math.max(0, totalSlots - acceptedMeals.length);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleGeneratePrep = () => {
    if (!mealPlanId || generatePrep.isPending) return;
    setPrepInterstitialKey((key) => key + 1);
    setShowPrepInterstitial(true);
    setPrepGenerationError(null);
    generatePrep.mutate({ mealPlanId });
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
    <AppShell className="bg-muted">
      <section className="mb-8">
        <code>{JSON.stringify(currentWeek.phase, null, 2)}</code>
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
          {(currentWeek.phase === "reviewing" ||
            currentWeek.phase === "finalized") && (
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
            mealCount={acceptedMealsCount}
            completed={currentWeek.phase === "finalized"}
            error={prepGenerationError}
            onRetry={() => void handleGeneratePrep()}
            onComplete={() => {
              setShowPrepInterstitial(false);
              setPrepGenerationError(null);
            }}
          />
        ) : (
          <>
            {currentWeek.phase === "no-plan" && (
              <WeekNoPlan
                outOfCredits={outOfCredits}
                isGenerating={generateMeals.isPending}
                onGenerate={() => generateMeals.mutate()}
                preferencesSummary={preferencesSummary}
              />
            )}
            {currentWeek.phase === "generating" && (
              <WeekGenerating
                mealPlanId={currentWeek.mealPlanId}
                counts={currentWeek.counts}
              />
            )}
            {currentWeek.phase === "reviewing" && (
              <WeekReviewing
                meals={currentWeek.meals}
                mealPlanId={currentWeek.mealPlanId}
                counts={currentWeek.counts}
                totalSlots={totalSlots}
                generateMore={generateMore}
                outOfCredits={outOfCredits}
              />
            )}
            {currentWeek.phase === "finalized" && (
              <WeekFinalized mealPlanId={currentWeek.mealPlanId} />
            )}
          </>
        )}
      </section>

      {/* Your Weekly Plan — only shown for finalized plans */}
      {currentWeek.phase === "finalized" && (
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
    </AppShell>
  );
}
