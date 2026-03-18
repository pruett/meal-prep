import { useState, useCallback, useEffect } from "react";
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
  MessageSquare,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { HouseholdSelector } from "~/components/preferences/household-selector";
import type { Household } from "~/components/preferences/household-selector";
import { DietSelector } from "~/components/preferences/diet-selector";
import { CuisineSelector } from "~/components/preferences/cuisine-selector";
import { MealPlanningControls } from "~/components/preferences/meal-planning-controls";
import type { MealsPerWeek } from "~/components/preferences/meal-planning-controls";
import { EquipmentSelector } from "~/components/preferences/equipment-selector";
import { CookingSetup } from "~/components/preferences/cooking-setup";
import { CustomInstructionsInput } from "~/components/preferences/custom-instructions-input";
import { formatTime } from "~/components/preferences/constants";
import { GeneratingInterstitial } from "~/components/generating-interstitial";

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
        household: prefs?.household ?? { adults: 2, kids: 0, infants: 0 },
        mealsPerWeek: prefs?.mealsPerWeek ?? {
          breakfast: 0,
          lunch: 0,
          dinner: 5,
        },
        maxWeeklyPrepMinutes: prefs?.maxWeeklyPrepMinutes ?? 120,
        maxCookTimeMinutes: prefs?.maxCookTimeMinutes ?? 30,
        kitchenEquipment: prefs?.kitchenEquipment ?? [],
        customInstructions: prefs?.customInstructions ?? "",
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
  { title: "Your household", subtitle: "Who are you cooking for?" },
  { title: "Dietary restrictions", subtitle: "Select any that apply" },
  { title: "Cuisine preferences", subtitle: "Pick your favorites" },
  { title: "Meals per week", subtitle: "How many of each meal?" },
  { title: "Kitchen equipment", subtitle: "What do you have to work with?" },
  { title: "Cooking time", subtitle: "How much time do you have?" },
  { title: "Custom instructions", subtitle: "Anything else we should know?" },
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
  const [savingElapsed, setSavingElapsed] = useState(0);

  // Track elapsed time while saving for interstitial message rotation
  useEffect(() => {
    if (!isSaving) {
      setSavingElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setSavingElapsed((t) => t + 500);
    }, 500);
    return () => clearInterval(interval);
  }, [isSaving]);

  const [household, setHousehold] = useState<Household>(
    () => data?.preferences.household ?? { adults: 2, kids: 0, infants: 0 },
  );
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
  const [mealsPerWeek, setMealsPerWeek] = useState<MealsPerWeek>(
    () =>
      data?.preferences.mealsPerWeek ?? { breakfast: 0, lunch: 0, dinner: 5 },
  );
  const [maxWeeklyPrep, setMaxWeeklyPrep] = useState(
    data?.preferences.maxWeeklyPrepMinutes ?? 120,
  );
  const [maxCookTime, setMaxCookTime] = useState(
    data?.preferences.maxCookTimeMinutes ?? 30,
  );
  const [equipment, setEquipment] = useState<Set<string>>(
    () => new Set(data?.preferences.kitchenEquipment ?? []),
  );
  const [customInstructions, setCustomInstructions] = useState(
    data?.preferences.customInstructions ?? "",
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
        household,
        mealsPerWeek,
        maxWeeklyPrepMinutes: maxWeeklyPrep,
        maxCookTimeMinutes: maxCookTime,
        kitchenEquipment: Array.from(equipment),
        customInstructions,
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
    household,
    mealsPerWeek,
    maxWeeklyPrep,
    maxCookTime,
    equipment,
    customInstructions,
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
    <>
    <AnimatePresence>
      {isSaving && <GeneratingInterstitial elapsed={savingElapsed} />}
    </AnimatePresence>
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
              <HouseholdSelector
                household={household}
                onHouseholdChange={setHousehold}
              />
            )}

            {stepIndex === 1 && (
              <DietSelector
                selected={dietaryRestrictions}
                onChange={setDietaryRestrictions}
                layout="list"
                showIcons
              />
            )}

            {stepIndex === 2 && (
              <CuisineSelector
                selected={cuisineLikes}
                onChange={setCuisineLikes}
                layout="list"
                showIcons
              />
            )}

            {stepIndex === 3 && (
              <MealPlanningControls
                mealsPerWeek={mealsPerWeek}
                onMealsPerWeekChange={setMealsPerWeek}
              />
            )}

            {stepIndex === 4 && (
              <EquipmentSelector
                equipment={equipment}
                onEquipmentChange={setEquipment}
                layout="list"
                showIcons
              />
            )}

            {stepIndex === 5 && (
              <CookingSetup
                maxWeeklyPrep={maxWeeklyPrep}
                onMaxWeeklyPrepChange={setMaxWeeklyPrep}
                maxCookTime={maxCookTime}
                onMaxCookTimeChange={setMaxCookTime}
              />
            )}

            {stepIndex === 6 && (
              <CustomInstructionsInput
                value={customInstructions}
                onChange={setCustomInstructions}
              />
            )}

            {stepIndex === 7 && (
              <SummaryStep
                household={household}
                dietaryRestrictions={dietaryRestrictions}
                cuisineLikes={cuisineLikes}
                mealsPerWeek={mealsPerWeek}
                maxWeeklyPrep={maxWeeklyPrep}
                maxCookTime={maxCookTime}
                equipment={equipment}
                customInstructions={customInstructions}
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
    </>
  );
}

// ---------------------------------------------------------------------------
// Summary step
// ---------------------------------------------------------------------------

function SummaryStep({
  household,
  dietaryRestrictions,
  cuisineLikes,
  mealsPerWeek,
  maxWeeklyPrep,
  maxCookTime,
  equipment,
  customInstructions,
  isSaving,
}: {
  household: Household;
  dietaryRestrictions: Set<string>;
  cuisineLikes: Set<string>;
  mealsPerWeek: MealsPerWeek;
  maxWeeklyPrep: number;
  maxCookTime: number;
  equipment: Set<string>;
  customInstructions: string;
  isSaving: boolean;
}) {
  const totalPeople = household.adults + household.kids + household.infants;
  const totalMeals =
    mealsPerWeek.breakfast + mealsPerWeek.lunch + mealsPerWeek.dinner;

  const householdParts: string[] = [];
  if (household.adults > 0)
    householdParts.push(
      `${household.adults} adult${household.adults !== 1 ? "s" : ""}`,
    );
  if (household.kids > 0)
    householdParts.push(
      `${household.kids} kid${household.kids !== 1 ? "s" : ""}`,
    );
  if (household.infants > 0)
    householdParts.push(
      `${household.infants} infant${household.infants !== 1 ? "s" : ""}`,
    );

  const mealParts: string[] = [];
  if (mealsPerWeek.breakfast > 0) mealParts.push(`${mealsPerWeek.breakfast}B`);
  if (mealsPerWeek.lunch > 0) mealParts.push(`${mealsPerWeek.lunch}L`);
  if (mealsPerWeek.dinner > 0) mealParts.push(`${mealsPerWeek.dinner}D`);

  const timeValue = `${formatTime(maxWeeklyPrep)} prep / ${formatTime(maxCookTime)} per meal`;

  const rows = [
    {
      label: "Household",
      icon: Users,
      value: `${totalPeople} ${totalPeople === 1 ? "person" : "people"} (${householdParts.join(", ")})`,
    },
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
      icon: UtensilsCrossed,
      value: `${totalMeals}/week (${mealParts.join(", ")})`,
    },
    {
      label: "Cooking",
      icon: Clock,
      value: timeValue,
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
    ...(customInstructions.trim()
      ? [
          {
            label: "Instructions",
            icon: MessageSquare,
            value: customInstructions.trim(),
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
