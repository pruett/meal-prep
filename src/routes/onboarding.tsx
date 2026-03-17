import { useState, useCallback } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { fetchAuthQuery } from "~/lib/auth-server";
import { requireAuth } from "~/lib/auth-guard";
import { Button } from "~/components/ui/button";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "~/components/ui/item";
import {
  ArrowRight,
  ChefHat,
  ChevronLeft,
  Clock,
  Globe,
  Leaf,
  Loader2,
  Users,
} from "lucide-react";
import { DietSelector } from "~/components/preferences/diet-selector";
import { CuisineSelector } from "~/components/preferences/cuisine-selector";
import { MealPlanningControls } from "~/components/preferences/meal-planning-controls";
import { CookingSetup } from "~/components/preferences/cooking-setup";
import { formatTime } from "~/components/preferences/constants";

// ---------------------------------------------------------------------------
// Server loader
// ---------------------------------------------------------------------------

const fetchOnboardingData = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await fetchAuthQuery(api.users.getAuthenticated, {});
    if (!user) return null;

    const prefs = await fetchAuthQuery(api.preferences.getByUser, {
      userId: user._id,
    });

    return {
      userId: user._id,
      preferences: {
        dietaryRestrictions: prefs?.dietaryRestrictions ?? [],
        cuisinePreferences: prefs?.cuisinePreferences ?? [],
        foodsToAvoid: prefs?.foodsToAvoid ?? "",
        mealsPerWeek: prefs?.mealsPerWeek ?? 7,
        householdSize: prefs?.householdSize ?? 1,
        maxPrepTimeMinutes: prefs?.maxPrepTimeMinutes ?? 45,
        kitchenEquipment: prefs?.kitchenEquipment ?? [],
      },
    };
  },
);

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/onboarding")({
  beforeLoad: ({ context }) => {
    requireAuth({ context });
    if (context.onboardingCompleted) {
      throw redirect({ to: "/" });
    }
  },
  loader: () => fetchOnboardingData(),
  component: OnboardingPage,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_META = [
  { title: "Dietary restrictions", subtitle: "Select any that apply" },
  { title: "Cuisine preferences", subtitle: "Pick your favorites" },
  { title: "Meal planning", subtitle: "How many meals & for whom?" },
  { title: "Cooking setup", subtitle: "Time budget & equipment" },
  { title: "Ready to go", subtitle: "Here's your summary" },
] as const;

const TOTAL_STEPS = STEP_META.length;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function OnboardingPage() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const updatePreferences = useMutation(api.preferences.update);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [dietaryRestrictions, setDietaryRestrictions] = useState<Set<string>>(
    () => new Set(data?.preferences.dietaryRestrictions ?? []),
  );
  const [cuisineLikes, setCuisineLikes] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const c of data?.preferences.cuisinePreferences ?? []) {
      if (c.preference === "like") set.add(c.cuisine);
    }
    return set;
  });
  const [mealsPerWeek, setMealsPerWeek] = useState(
    data?.preferences.mealsPerWeek ?? 7,
  );
  const [householdSize, setHouseholdSize] = useState(
    data?.preferences.householdSize ?? 1,
  );
  const [maxPrepTime, setMaxPrepTime] = useState(
    data?.preferences.maxPrepTimeMinutes ?? 45,
  );
  const [equipment, setEquipment] = useState<Set<string>>(
    () => new Set(data?.preferences.kitchenEquipment ?? []),
  );

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Unable to load preferences. Please try again.
        </p>
      </div>
    );
  }

  const userId = data.userId;
  const step = STEP_META[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;

  const goForward = () => {
    if (isLastStep) return;
    setDirection(1);
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (isFirstStep) return;
    setDirection(-1);
    setStepIndex((i) => i - 1);
  };

  const saveAndGenerate = useCallback(async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        userId,
        dietaryRestrictions: Array.from(dietaryRestrictions),
        cuisinePreferences: Array.from(cuisineLikes).map((c) => ({
          cuisine: c,
          preference: "like" as const,
        })),
        foodsToAvoid: "",
        mealsPerWeek,
        householdSize,
        maxPrepTimeMinutes: maxPrepTime,
        kitchenEquipment: Array.from(equipment),
      });

      const res = await fetch("/api/ai/generate-meals", { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");

      await completeOnboarding({ id: userId });
      void navigate({ to: "/" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message, {
        action: { label: "Retry", onClick: () => void saveAndGenerate() },
      });
      setIsSaving(false);
    }
  }, [
    userId,
    dietaryRestrictions,
    cuisineLikes,
    mealsPerWeek,
    householdSize,
    maxPrepTime,
    equipment,
    updatePreferences,
    completeOnboarding,
    navigate,
  ]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 pt-12 [--action-drawer-height:7rem] pb-[calc(var(--action-drawer-height)+2rem)]">
      <div className="mx-auto w-full max-w-md">
        {/* Top bar */}
        <div className="mb-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={isFirstStep}
            className="disabled:opacity-0"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5">
            {STEP_META.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? "w-6 bg-primary"
                    : i < stepIndex
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goForward}
            disabled={isLastStep}
            className="disabled:opacity-0"
          >
            Skip
          </Button>
        </div>

        {/* Title + subtitle (always visible) */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`heading-${stepIndex}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mb-6"
          >
            <h1 className="text-3xl font-semibold tracking-tight">
              {step.title}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {step.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`body-${stepIndex}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {stepIndex === 0 && (
              <DietSelector
                selected={dietaryRestrictions}
                onChange={setDietaryRestrictions}
                layout="list"
              />
            )}

            {stepIndex === 1 && (
              <CuisineSelector
                selected={cuisineLikes}
                onChange={setCuisineLikes}
                layout="list"
              />
            )}

            {stepIndex === 2 && (
              <MealPlanningControls
                mealsPerWeek={mealsPerWeek}
                onMealsPerWeekChange={setMealsPerWeek}
                householdSize={householdSize}
                onHouseholdSizeChange={setHouseholdSize}
              />
            )}

            {stepIndex === 3 && (
              <CookingSetup
                maxPrepTime={maxPrepTime}
                onMaxPrepTimeChange={setMaxPrepTime}
                equipment={equipment}
                onEquipmentChange={setEquipment}
                equipmentLayout="list"
              />
            )}

            {stepIndex === 4 && (
              <SummaryStep
                dietaryRestrictions={dietaryRestrictions}
                cuisineLikes={cuisineLikes}
                mealsPerWeek={mealsPerWeek}
                householdSize={householdSize}
                maxPrepTime={maxPrepTime}
                equipment={equipment}
                isSaving={isSaving}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-10 bg-background">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-6">
          {isLastStep ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => void saveAndGenerate()}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating your plan...
                </>
              ) : (
                <>
                  Generate my meal plan
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={goForward}>
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary step
// ---------------------------------------------------------------------------

function SummaryStep({
  dietaryRestrictions,
  cuisineLikes,
  mealsPerWeek,
  householdSize,
  maxPrepTime,
  equipment,
  isSaving,
}: {
  dietaryRestrictions: Set<string>;
  cuisineLikes: Set<string>;
  mealsPerWeek: number;
  householdSize: number;
  maxPrepTime: number;
  equipment: Set<string>;
  isSaving: boolean;
}) {
  const rows = [
    {
      label: "Diet",
      icon: Leaf,
      value:
        dietaryRestrictions.size > 0
          ? Array.from(dietaryRestrictions).join(", ")
          : "No restrictions",
    },
    {
      label: "Cuisines",
      icon: Globe,
      value:
        cuisineLikes.size > 0
          ? Array.from(cuisineLikes).join(", ")
          : "Open to all",
    },
    {
      label: "Meals",
      icon: Users,
      value: `${mealsPerWeek}/week for ${householdSize === 1 ? "just me" : `${householdSize} people`}`,
    },
    {
      label: "Cooking",
      icon: Clock,
      value: `${formatTime(maxPrepTime)} max`,
    },
    ...(equipment.size > 0
      ? [
          {
            label: "Equipment",
            icon: ChefHat,
            value: Array.from(equipment).join(", "),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup>
        {rows.map(({ label, icon: Icon, value }) => (
          <Item key={label} variant="muted">
            <ItemMedia variant="icon">
              <Icon className="text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{label}</ItemTitle>
              <ItemDescription>{value}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>

      {isSaving && (
        <Item variant="muted">
          <ItemMedia variant="icon">
            <Loader2 className="animate-spin" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Generating your meal plan...</ItemTitle>
          </ItemContent>
        </Item>
      )}
    </div>
  );
}
