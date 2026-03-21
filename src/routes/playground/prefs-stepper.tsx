import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChefHat,
  ChevronLeft,
  Clock,
  Globe,
  Leaf,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "~/components/ui/item"
import { HouseholdSelector } from "~/components/preferences/household-selector"
import type { Household } from "~/components/preferences/household-selector"
import { DietSelector } from "~/components/preferences/diet-selector"
import { CuisineSelector } from "~/components/preferences/cuisine-selector"
import { MealPlanningControls } from "~/components/preferences/meal-planning-controls"
import type { MealsPerWeek } from "~/components/preferences/meal-planning-controls"
import { EquipmentSelector } from "~/components/preferences/equipment-selector"
import { CookingSetup } from "~/components/preferences/cooking-setup"
import { CustomInstructionsInput } from "~/components/preferences/custom-instructions-input"
import {
  DIETARY_RESTRICTIONS,
  CUISINES,
  formatTime,
} from "~/components/preferences/constants"

export const Route = createFileRoute("/playground/prefs-stepper")({
  component: PrefsStepperPrototype,
})

// ─── Step metadata ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: "household", title: "Your household", subtitle: "Who are you cooking for?", icon: Users },
  { key: "diet", title: "Dietary restrictions", subtitle: "Select any that apply", icon: Leaf },
  { key: "cuisine", title: "Cuisine preferences", subtitle: "Pick your favorites", icon: Globe },
  { key: "meals", title: "Meals per week", subtitle: "How many of each meal?", icon: CalendarDays },
  { key: "equipment", title: "Kitchen equipment", subtitle: "What do you have to work with?", icon: ChefHat },
  { key: "cooking", title: "Cooking time", subtitle: "How much time do you have?", icon: Clock },
  { key: "instructions", title: "Custom instructions", subtitle: "Anything else we should know?", icon: MessageSquare },
  { key: "summary", title: "Your preferences", subtitle: "Here's your current setup", icon: Check },
] as const

type StepKey = (typeof STEPS)[number]["key"]

// ─── Page ───────────────────────────────────────────────────────────────────────

function PrefsStepperPrototype() {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [saveFlash, setSaveFlash] = useState(false)

  // Mock state
  const [household, setHousehold] = useState<Household>({ adults: 2, kids: 1, infants: 0 })
  const [diet, setDiet] = useState<Set<string>>(new Set(["gluten-free"]))
  const [cuisines, setCuisines] = useState<Set<string>>(new Set(["italian", "mexican", "japanese"]))
  const [meals, setMeals] = useState<MealsPerWeek>({ breakfast: 0, lunch: 3, dinner: 5 })
  const [equipment, setEquipment] = useState<Set<string>>(new Set(["oven", "stovetop", "air-fryer"]))
  const [maxWeeklyPrep, setMaxWeeklyPrep] = useState(120)
  const [maxCookTime, setMaxCookTime] = useState(30)
  const [instructions, setInstructions] = useState("")

  const step = STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1

  function goTo(index: number) {
    setDirection(index > stepIndex ? 1 : -1)
    setStepIndex(index)
  }

  function goForward() {
    if (isLastStep) return
    setDirection(1)
    setStepIndex((i) => i + 1)
  }

  function goBack() {
    if (isFirstStep) return
    setDirection(-1)
    setStepIndex((i) => i - 1)
  }

  function handleSave() {
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1500)
  }

  // ── Step content ────────────────────────────────────────────────────────────

  function renderStepContent(key: StepKey) {
    switch (key) {
      case "household":
        return <HouseholdSelector household={household} onHouseholdChange={setHousehold} />
      case "diet":
        return <DietSelector selected={diet} onChange={setDiet} layout="list" showIcons />
      case "cuisine":
        return <CuisineSelector selected={cuisines} onChange={setCuisines} layout="list" showIcons />
      case "meals":
        return <MealPlanningControls mealsPerWeek={meals} onMealsPerWeekChange={setMeals} />
      case "equipment":
        return <EquipmentSelector equipment={equipment} onEquipmentChange={setEquipment} layout="list" showIcons />
      case "cooking":
        return (
          <CookingSetup
            maxWeeklyPrep={maxWeeklyPrep}
            onMaxWeeklyPrepChange={setMaxWeeklyPrep}
            maxCookTime={maxCookTime}
            onMaxCookTimeChange={setMaxCookTime}
          />
        )
      case "instructions":
        return <CustomInstructionsInput value={instructions} onChange={setInstructions} />
      case "summary":
        return (
          <SummaryView
            household={household}
            diet={diet}
            cuisines={cuisines}
            meals={meals}
            maxWeeklyPrep={maxWeeklyPrep}
            maxCookTime={maxCookTime}
            equipment={equipment}
            instructions={instructions}
            onJumpTo={goTo}
          />
        )
    }
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="min-h-dvh bg-background px-4 pb-[calc(var(--action-height)+2rem)] pt-12 [--action-height:7rem]">
      <div className="mx-auto w-full max-w-md">
        {/* Top bar — same as onboarding but dots are tappable */}
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

          {/* Tappable progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => goTo(i)}
                aria-label={s.title}
                className={[
                  "rounded-full transition-all duration-300",
                  i === stepIndex
                    ? "h-2 w-6 bg-primary"
                    : i < stepIndex
                      ? "h-2 w-2 bg-primary/40 hover:bg-primary/60"
                      : "h-2 w-2 bg-border hover:bg-border/80",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Back to home (replaces Skip) */}
          <Button variant="ghost" size="sm" render={<Link to="/" />}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Home
          </Button>
        </div>

        {/* Animated heading */}
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

        {/* Animated step content */}
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
            {renderStepContent(step.key)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-10 bg-background">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-6">
          {isLastStep ? (
            <Button size="lg" className="w-full" onClick={handleSave}>
              <AnimatePresence mode="wait">
                {saveFlash ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    All Saved
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Save All Preferences
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={goForward}>
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>

      {/* Prototype label */}
      <div className="mx-auto mt-4 max-w-md">
        <div className="rounded-xl border border-dashed border-border px-4 py-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Prototype C — Stepper with Random Access Dots
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Identical to the onboarding wizard, but dots are tappable
            for instant random access. Summary step replaces "Generate."
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Summary View ───────────────────────────────────────────────────────────────

function SummaryView({
  household,
  diet,
  cuisines,
  meals,
  maxWeeklyPrep,
  maxCookTime,
  equipment,
  instructions,
  onJumpTo,
}: {
  household: Household
  diet: Set<string>
  cuisines: Set<string>
  meals: MealsPerWeek
  maxWeeklyPrep: number
  maxCookTime: number
  equipment: Set<string>
  instructions: string
  onJumpTo: (index: number) => void
}) {
  const totalPeople = household.adults + household.kids + household.infants
  const totalMeals = meals.breakfast + meals.lunch + meals.dinner

  const householdParts: string[] = []
  if (household.adults > 0) householdParts.push(`${household.adults} adult${household.adults !== 1 ? "s" : ""}`)
  if (household.kids > 0) householdParts.push(`${household.kids} kid${household.kids !== 1 ? "s" : ""}`)
  if (household.infants > 0) householdParts.push(`${household.infants} infant${household.infants !== 1 ? "s" : ""}`)

  const mealParts: string[] = []
  if (meals.breakfast > 0) mealParts.push(`${meals.breakfast}B`)
  if (meals.lunch > 0) mealParts.push(`${meals.lunch}L`)
  if (meals.dinner > 0) mealParts.push(`${meals.dinner}D`)

  const rows = [
    {
      stepIndex: 0,
      label: "Household",
      icon: Users,
      value: `${totalPeople} ${totalPeople === 1 ? "person" : "people"} (${householdParts.join(", ")})`,
    },
    {
      stepIndex: 1,
      label: "Diet",
      icon: Leaf,
      value: diet.size > 0
        ? Array.from(diet).map((id) => DIETARY_RESTRICTIONS.find((d) => d.id === id)?.label ?? id).join(", ")
        : "No restrictions",
    },
    {
      stepIndex: 2,
      label: "Cuisines",
      icon: Globe,
      value: cuisines.size > 0
        ? Array.from(cuisines).map((id) => CUISINES.find((c) => c.id === id)?.label ?? id).join(", ")
        : "Open to all",
    },
    {
      stepIndex: 3,
      label: "Meals",
      icon: CalendarDays,
      value: `${totalMeals}/week (${mealParts.join(", ")})`,
    },
    {
      stepIndex: 5,
      label: "Cooking",
      icon: Clock,
      value: `${formatTime(maxWeeklyPrep)} prep / ${formatTime(maxCookTime)} per meal`,
    },
    ...(equipment.size > 0
      ? [{
          stepIndex: 4,
          label: "Equipment",
          icon: ChefHat,
          value: Array.from(equipment).join(", "),
        }]
      : []),
    ...(instructions.trim()
      ? [{
          stepIndex: 6,
          label: "Instructions",
          icon: MessageSquare,
          value: instructions.trim(),
        }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Tap any row to jump back and edit it.
      </p>
      <ItemGroup>
        {rows.map(({ stepIndex: idx, label, icon: Icon, value }) => (
          <Item
            key={label}
            variant="muted"
            render={<button onClick={() => onJumpTo(idx)} />}
            className="cursor-pointer text-left transition-colors hover:bg-muted"
          >
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
    </div>
  )
}
