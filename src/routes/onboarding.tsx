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
import { Slider } from "~/components/ui/slider";
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
  Check,
  ChevronLeft,
  ChefHat,
  Clock,
  Globe,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Users,
} from "lucide-react";

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

const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paleo" },
  { id: "low-carb", label: "Low-Carb" },
  { id: "low-sodium", label: "Low-Sodium" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
] as const;

const CUISINES = [
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
  { id: "chinese", label: "Chinese" },
  { id: "japanese", label: "Japanese" },
  { id: "indian", label: "Indian" },
  { id: "thai", label: "Thai" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "korean", label: "Korean" },
  { id: "french", label: "French" },
  { id: "american", label: "American" },
  { id: "greek", label: "Greek" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "vietnamese", label: "Vietnamese" },
  { id: "caribbean", label: "Caribbean" },
] as const;

const EQUIPMENT = [
  { id: "oven", label: "Oven" },
  { id: "stovetop", label: "Stovetop" },
  { id: "microwave", label: "Microwave" },
  { id: "slow-cooker", label: "Slow Cooker" },
  { id: "instant-pot", label: "Instant Pot" },
  { id: "air-fryer", label: "Air Fryer" },
  { id: "blender", label: "Blender" },
  { id: "food-processor", label: "Food Processor" },
  { id: "grill", label: "Grill" },
  { id: "wok", label: "Wok" },
  { id: "cast-iron", label: "Cast Iron" },
  { id: "sheet-pan", label: "Sheet Pan" },
] as const;

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

  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 120) return "2 hrs";
    if (minutes >= 60) {
      const rem = minutes % 60;
      return `${Math.floor(minutes / 60)} hr${rem > 0 ? ` ${rem} min` : ""}`;
    }
    return `${minutes} min`;
  };

  const adjustHousehold = (delta: number) => {
    setHouseholdSize((prev) => Math.min(10, Math.max(1, prev + delta)));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 pt-12 pb-28">
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
              <ChipGrid
                items={DIETARY_RESTRICTIONS}
                selected={dietaryRestrictions}
                onToggle={(id) => toggleSet(setDietaryRestrictions, id)}
              />
            )}

            {stepIndex === 1 && (
              <ChipGrid
                items={CUISINES}
                selected={cuisineLikes}
                onToggle={(id) => toggleSet(setCuisineLikes, id)}
                onSelectAll={() => {
                  const allSelected = CUISINES.every(({ id }) => cuisineLikes.has(id));
                  setCuisineLikes(allSelected ? new Set() : new Set(CUISINES.map(({ id }) => id)));
                }}
              />
            )}

            {stepIndex === 2 && (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="mb-4 flex items-baseline justify-between">
                    <label className="text-sm font-medium">
                      Meals per week
                    </label>
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      {mealsPerWeek}
                    </span>
                  </div>
                  <Slider
                    value={[mealsPerWeek]}
                    onValueChange={(val) =>
                      setMealsPerWeek(Array.isArray(val) ? val[0] : val)
                    }
                    min={3}
                    max={14}
                    step={1}
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>3</span>
                    <span>14</span>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-baseline justify-between">
                    <label className="text-sm font-medium">
                      Household size
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {householdSize === 1
                        ? "Just me"
                        : `${householdSize} people`}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-5">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustHousehold(-1)}
                      disabled={householdSize <= 1}
                      className="rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-3xl font-bold tabular-nums text-primary">
                      {householdSize}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustHousehold(1)}
                      disabled={householdSize >= 10}
                      className="rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stepIndex === 3 && (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="mb-4 flex items-baseline justify-between">
                    <label className="text-sm font-medium">
                      Max prep time per meal
                    </label>
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      {formatTime(maxPrepTime)}
                    </span>
                  </div>
                  <Slider
                    value={[maxPrepTime]}
                    onValueChange={(val) =>
                      setMaxPrepTime(Array.isArray(val) ? val[0] : val)
                    }
                    min={15}
                    max={120}
                    step={5}
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>15 min</span>
                    <span>2 hrs</span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium">
                    Kitchen equipment
                  </label>
                  <ChipGrid
                    items={EQUIPMENT}
                    selected={equipment}
                    onToggle={(id) => toggleSet(setEquipment, id)}
                    onSelectAll={() => {
                      const allSelected = EQUIPMENT.every(({ id }) => equipment.has(id));
                      setEquipment(allSelected ? new Set() : new Set(EQUIPMENT.map(({ id }) => id)));
                    }}
                  />
                </div>
              </div>
            )}

            {stepIndex === 4 && (
              <SummaryStep
                dietaryRestrictions={dietaryRestrictions}
                cuisineLikes={cuisineLikes}
                mealsPerWeek={mealsPerWeek}
                householdSize={householdSize}
                maxPrepTime={maxPrepTime}
                equipment={equipment}
                formatTime={formatTime}
                isSaving={isSaving}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-10 backdrop-blur-lg bg-background/80 border-t border-border/50">
        <div className="mx-auto w-full max-w-md px-4 py-4">
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
                "Generate my meal plan"
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
// Chip grid
// ---------------------------------------------------------------------------

function ChipGrid({
  items,
  selected,
  onToggle,
  onSelectAll,
}: {
  items: ReadonlyArray<{ id: string; label: string }>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
}) {
  const allSelected = items.every(({ id }) => selected.has(id));

  return (
    <div className="flex flex-col gap-2">
      {onSelectAll && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end"
          onClick={onSelectAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      )}
      {items.map(({ id, label }) => {
        const isSelected = selected.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {label}
            {isSelected && <Check className="h-4 w-4" />}
          </button>
        );
      })}
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
  formatTime,
  isSaving,
}: {
  dietaryRestrictions: Set<string>;
  cuisineLikes: Set<string>;
  mealsPerWeek: number;
  householdSize: number;
  maxPrepTime: number;
  equipment: Set<string>;
  formatTime: (m: number) => string;
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
