import { useState, useRef, useEffect } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChefHat,
  Clock,
  Globe,
  Leaf,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { HouseholdSelector } from "~/components/preferences/household-selector"
import type { Household } from "~/components/preferences/household-selector"
import { DietSelector } from "~/components/preferences/diet-selector"
import { CuisineSelector } from "~/components/preferences/cuisine-selector"
import { MealPlanningControls } from "~/components/preferences/meal-planning-controls"
import type { MealsPerWeek } from "~/components/preferences/meal-planning-controls"
import { EquipmentSelector } from "~/components/preferences/equipment-selector"
import { CookingSetup } from "~/components/preferences/cooking-setup"
import { CustomInstructionsInput } from "~/components/preferences/custom-instructions-input"

export const Route = createFileRoute("/playground/prefs-tabs")({
  component: PrefsTabsPrototype,
})

// ─── Types ──────────────────────────────────────────────────────────────────────

type CategoryKey =
  | "household"
  | "diet"
  | "cuisine"
  | "meals"
  | "equipment"
  | "cooking"
  | "instructions"

type Category = {
  key: CategoryKey
  icon: React.ComponentType<{ className?: string }>
  label: string
  subtitle: string
}

const CATEGORIES: Category[] = [
  { key: "household", icon: Users, label: "Household", subtitle: "Who are you cooking for?" },
  { key: "diet", icon: Leaf, label: "Diet", subtitle: "Select any restrictions" },
  { key: "cuisine", icon: Globe, label: "Cuisines", subtitle: "Pick your favorites" },
  { key: "meals", icon: CalendarDays, label: "Meals", subtitle: "How many each week?" },
  { key: "equipment", icon: ChefHat, label: "Equipment", subtitle: "What's in your kitchen?" },
  { key: "cooking", icon: Clock, label: "Time", subtitle: "Prep & cook limits" },
  { key: "instructions", icon: MessageSquare, label: "Notes", subtitle: "Anything else?" },
]

// ─── Page ───────────────────────────────────────────────────────────────────────

function PrefsTabsPrototype() {
  const [activeKey, setActiveKey] = useState<CategoryKey>("household")
  const [direction, setDirection] = useState(0)
  const [saveFlash, setSaveFlash] = useState(false)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Mock state
  const [household, setHousehold] = useState<Household>({ adults: 2, kids: 1, infants: 0 })
  const [diet, setDiet] = useState<Set<string>>(new Set(["gluten-free"]))
  const [cuisines, setCuisines] = useState<Set<string>>(new Set(["italian", "mexican", "japanese"]))
  const [meals, setMeals] = useState<MealsPerWeek>({ breakfast: 0, lunch: 3, dinner: 5 })
  const [equipment, setEquipment] = useState<Set<string>>(new Set(["oven", "stovetop", "air-fryer"]))
  const [maxWeeklyPrep, setMaxWeeklyPrep] = useState(120)
  const [maxCookTime, setMaxCookTime] = useState(30)
  const [instructions, setInstructions] = useState("")

  // Scroll active tab into view
  useEffect(() => {
    const el = tabRefs.current.get(activeKey)
    if (el && tabBarRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [activeKey])

  const activeIndex = CATEGORIES.findIndex((c) => c.key === activeKey)
  const activeCat = CATEGORIES[activeIndex]

  function switchTo(key: CategoryKey) {
    const newIndex = CATEGORIES.findIndex((c) => c.key === key)
    setDirection(newIndex > activeIndex ? 1 : -1)
    setActiveKey(key)
  }

  function handleSave() {
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1500)
  }

  // ── Content renderer ────────────────────────────────────────────────────────

  function renderContent(key: CategoryKey) {
    switch (key) {
      case "household":
        return <HouseholdSelector household={household} onHouseholdChange={setHousehold} />
      case "diet":
        return <DietSelector selected={diet} onChange={setDiet} layout="list" showIcons />
      case "cuisine":
        return <CuisineSelector selected={cuisines} onChange={setCuisines} showIcons />
      case "meals":
        return <MealPlanningControls mealsPerWeek={meals} onMealsPerWeekChange={setMeals} />
      case "equipment":
        return <EquipmentSelector equipment={equipment} onEquipmentChange={setEquipment} showIcons />
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
    }
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(var(--action-height)+2rem)] [--action-height:5rem]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" render={<Link to="/" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Preferences</h1>
        </div>

        {/* Scrollable tab bar */}
        <div
          ref={tabBarRef}
          className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.key === activeKey
            return (
              <button
                key={cat.key}
                ref={(el) => {
                  if (el) tabRefs.current.set(cat.key, el)
                }}
                onClick={() => switchTo(cat.key)}
                className={[
                  "relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                ].join(" ")}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-8">
        {/* Title + subtitle — matches onboarding heading style */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`heading-${activeKey}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold tracking-tight">
              {activeCat.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCat.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Editor */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`body-${activeKey}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderContent(activeKey)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky bottom save */}
      <div className="fixed inset-x-0 bottom-0 z-10 bg-background">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-4">
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
                  Saved
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Prototype label */}
      <div className="mx-auto mt-4 max-w-md px-4">
        <div className="rounded-xl border border-dashed border-border px-4 py-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Prototype B — Scrollable Icon Tabs
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Pill tabs for instant random access. Same animated transitions
            and single-focus area as onboarding.
          </p>
        </div>
      </div>
    </div>
  )
}
