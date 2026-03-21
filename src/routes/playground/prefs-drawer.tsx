import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Clock,
  Globe,
  Leaf,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer"
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

export const Route = createFileRoute("/playground/prefs-drawer")({
  component: PrefsDrawerPrototype,
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
  sublabel: string
}

const CATEGORIES: Category[] = [
  { key: "household", icon: Users, label: "Household", sublabel: "Who you're cooking for" },
  { key: "diet", icon: Leaf, label: "Dietary", sublabel: "Restrictions & needs" },
  { key: "cuisine", icon: Globe, label: "Cuisines", sublabel: "Flavor preferences" },
  { key: "meals", icon: CalendarDays, label: "Meal Plan", sublabel: "Weekly schedule" },
  { key: "equipment", icon: ChefHat, label: "Equipment", sublabel: "Kitchen tools" },
  { key: "cooking", icon: Clock, label: "Time", sublabel: "Prep & cook limits" },
  { key: "instructions", icon: MessageSquare, label: "Notes", sublabel: "Special requests" },
]

// ─── Page ───────────────────────────────────────────────────────────────────────

function PrefsDrawerPrototype() {
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>(null)

  // Mock state (mirrors real preferences shape)
  const [household, setHousehold] = useState<Household>({ adults: 2, kids: 1, infants: 0 })
  const [diet, setDiet] = useState<Set<string>>(new Set(["gluten-free"]))
  const [cuisines, setCuisines] = useState<Set<string>>(new Set(["italian", "mexican", "japanese"]))
  const [meals, setMeals] = useState<MealsPerWeek>({ breakfast: 0, lunch: 3, dinner: 5 })
  const [equipment, setEquipment] = useState<Set<string>>(new Set(["oven", "stovetop", "air-fryer"]))
  const [maxWeeklyPrep, setMaxWeeklyPrep] = useState(120)
  const [maxCookTime, setMaxCookTime] = useState(30)
  const [instructions, setInstructions] = useState("")

  // ── Summaries ───────────────────────────────────────────────────────────────

  function getSummary(key: CategoryKey): string {
    switch (key) {
      case "household": {
        const total = household.adults + household.kids + household.infants
        return `${total} ${total === 1 ? "person" : "people"}`
      }
      case "diet":
        return diet.size > 0
          ? Array.from(diet)
              .map((id) => DIETARY_RESTRICTIONS.find((d) => d.id === id)?.label)
              .filter(Boolean)
              .join(", ")
          : "No restrictions"
      case "cuisine":
        return cuisines.size > 0
          ? Array.from(cuisines)
              .map((id) => CUISINES.find((c) => c.id === id)?.label)
              .filter(Boolean)
              .join(", ")
          : "Open to all"
      case "meals": {
        const total = meals.breakfast + meals.lunch + meals.dinner
        return `${total} meals/week`
      }
      case "equipment":
        return equipment.size > 0 ? `${equipment.size} items` : "None selected"
      case "cooking":
        return `${formatTime(maxWeeklyPrep)} / ${formatTime(maxCookTime)}`
      case "instructions":
        return instructions.trim() || "Nothing specific"
    }
  }

  // ── Drawer content ──────────────────────────────────────────────────────────

  function renderDrawerContent(key: CategoryKey) {
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
    }
  }

  const activeCategory = CATEGORIES.find((c) => c.key === openCategory)

  return (
    <div className="min-h-dvh bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" render={<Link to="/" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Preferences</h1>
            <p className="text-xs text-muted-foreground">Tap a category to edit</p>
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="mx-auto max-w-md px-4 py-6">
        <motion.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => setOpenCategory(cat.key)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-accent/50 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <cat.icon className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{cat.label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {getSummary(cat.key)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          ))}
        </motion.div>

        {/* Prototype label */}
        <div className="mt-8 rounded-xl border border-dashed border-border px-4 py-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Prototype A — Summary Cards + Bottom Drawer
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Tap any card → drawer slides up with the editor.
            Same focused editing as onboarding, with random access.
          </p>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open={openCategory !== null}
        onOpenChange={(open) => {
          if (!open) setOpenCategory(null)
        }}
      >
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2.5">
              {activeCategory && (
                <>
                  <activeCategory.icon className="h-4 w-4 text-muted-foreground" />
                  {activeCategory.label}
                </>
              )}
            </DrawerTitle>
            {activeCategory && (
              <p className="text-sm text-muted-foreground">{activeCategory.sublabel}</p>
            )}
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-2">
            <AnimatePresence mode="wait">
              {openCategory && (
                <motion.div
                  key={openCategory}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderDrawerContent(openCategory)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button size="lg" className="w-full">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
