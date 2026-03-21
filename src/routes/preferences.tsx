import { useState, useRef, useEffect, memo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { ErrorFallback } from '~/components/error-boundary'
import { PreferencesSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'
import { HouseholdSelector } from '~/components/preferences/household-selector'
import type { Household } from '~/components/preferences/household-selector'
import { DietSelector } from '~/components/preferences/diet-selector'
import { CuisineSelector } from '~/components/preferences/cuisine-selector'
import { MealPlanningControls } from '~/components/preferences/meal-planning-controls'
import type { MealsPerWeek } from '~/components/preferences/meal-planning-controls'
import { EquipmentSelector } from '~/components/preferences/equipment-selector'
import { CookingSetup } from '~/components/preferences/cooking-setup'
import { CustomInstructionsInput } from '~/components/preferences/custom-instructions-input'
import { setsEqual } from '~/components/preferences/constants'
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
} from 'lucide-react'

// ─── SSR Loader ────────────────────────────────────────────────────────────────

const fetchPreferences = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const user = await fetchAuthQuery(api.users.getAuthenticated, {})
    if (!user) return null

    const prefs = await fetchAuthQuery(api.preferences.getByUser, {
      userId: user._id,
    })

    return { userId: user._id, preferences: prefs }
  } catch {
    return null
  }
})

export const Route = createFileRoute('/preferences')({
  beforeLoad: requireAuth,
  loader: () => fetchPreferences(),
  component: PreferencesPage,
  pendingComponent: PreferencesSkeleton,
  errorComponent: ErrorFallback,
})

// ─── Categories ──────────────────────────────────────────────────────────────

type CategoryKey =
  | 'household'
  | 'diet'
  | 'cuisine'
  | 'meals'
  | 'equipment'
  | 'cooking'
  | 'instructions'

type Category = {
  key: CategoryKey
  icon: React.ComponentType<{ className?: string }>
  label: string
  subtitle: string
}

const CATEGORIES: Category[] = [
  { key: 'household', icon: Users, label: 'Household', subtitle: 'Who are you cooking for?' },
  { key: 'diet', icon: Leaf, label: 'Diet', subtitle: 'Select any restrictions' },
  { key: 'cuisine', icon: Globe, label: 'Cuisines', subtitle: 'Pick your favorites' },
  { key: 'meals', icon: CalendarDays, label: 'Meals', subtitle: 'How many each week?' },
  { key: 'equipment', icon: ChefHat, label: 'Equipment', subtitle: "What's in your kitchen?" },
  { key: 'cooking', icon: Clock, label: 'Time', subtitle: 'Prep & cook limits' },
  { key: 'instructions', icon: MessageSquare, label: 'Notes', subtitle: 'Anything else?' },
]

// ─── Animation ───────────────────────────────────────────────────────────────

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function householdsEqual(a: Household, b: Household) {
  return a.adults === b.adults && a.kids === b.kids && a.infants === b.infants
}

function mealsEqual(a: MealsPerWeek, b: MealsPerWeek) {
  return a.breakfast === b.breakfast && a.lunch === b.lunch && a.dinner === b.dinner
}

// ─── Save Bar (memoized to avoid re-render on tab switches) ─────────────────

const SaveBar = memo(function SaveBar({
  isDirty,
  saveState,
  onSave,
}: {
  isDirty: boolean
  saveState: 'idle' | 'saving' | 'saved'
  onSave: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-background">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-background to-transparent" />
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-4">
        <Button
          size="lg"
          className="w-full"
          disabled={!isDirty || saveState === 'saving'}
          onClick={onSave}
        >
          {saveState === 'saving' ? (
            <span className="flex items-center gap-1.5">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Saving...
            </span>
          ) : saveState === 'saved' ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Saved
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
})

// ─── Page Component ──────────────────────────────────────────────────────────

function PreferencesPage() {
  const loaderData = Route.useLoaderData()
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
  })

  const userId = loaderData?.userId ?? (user?._id as Id<'users'> | undefined)

  // Reactive subscription for preferences
  const { data: reactivePrefs } = useQuery({
    ...convexQuery(
      api.preferences.getByUser,
      userId ? { userId } : 'skip',
    ),
    initialData: loaderData?.preferences,
  })

  const prefs = reactivePrefs ?? loaderData?.preferences

  // ── Tab state ──────────────────────────────────────────────────────────────

  const [activeKey, setActiveKey] = useState<CategoryKey>('household')
  const [direction, setDirection] = useState(0)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const activeIndex = CATEGORIES.findIndex((c) => c.key === activeKey)
  const activeCat = CATEGORIES[activeIndex]

  function switchTo(key: CategoryKey) {
    const newIndex = CATEGORIES.findIndex((c) => c.key === key)
    setDirection(newIndex > activeIndex ? 1 : -1)
    setActiveKey(key)
  }

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = tabRefs.current.get(activeKey)
    if (el && tabBarRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeKey])

  // ── Section state ──────────────────────────────────────────────────────────

  // Household
  const [household, setHousehold] = useState<Household>(
    () => prefs?.household ?? { adults: 2, kids: 0, infants: 0 },
  )
  const savedHouseholdRef = useRef(household)

  // Diet
  const [dietSelected, setDietSelected] = useState<Set<string>>(
    () => new Set(prefs?.dietaryRestrictions ?? []),
  )
  const savedDietRef = useRef(dietSelected)

  // Cuisines (binary: like or not)
  const [cuisineLikes, setCuisineLikes] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const p of prefs?.cuisinePreferences ?? []) {
      if (p.preference === 'like') set.add(p.cuisine)
    }
    return set
  })
  const savedCuisinesRef = useRef(cuisineLikes)

  // Meals planning
  const [mealsPerWeek, setMealsPerWeek] = useState<MealsPerWeek>(
    () => prefs?.mealsPerWeek ?? { breakfast: 0, lunch: 0, dinner: 5 },
  )
  const savedMealsRef = useRef(mealsPerWeek)

  // Cooking
  const [maxWeeklyPrep, setMaxWeeklyPrep] = useState(prefs?.maxWeeklyPrepMinutes ?? 120)
  const savedWeeklyPrepRef = useRef(maxWeeklyPrep)
  const [maxCookTime, setMaxCookTime] = useState(prefs?.maxCookTimeMinutes ?? 30)
  const savedCookTimeRef = useRef(maxCookTime)
  const [equipment, setEquipment] = useState<Set<string>>(
    () => new Set(prefs?.kitchenEquipment ?? []),
  )
  const savedEquipmentRef = useRef(equipment)

  // Custom instructions
  const [customInstructions, setCustomInstructions] = useState(prefs?.customInstructions ?? '')
  const savedInstructionsRef = useRef(customInstructions)

  // ── Dirty state ────────────────────────────────────────────────────────────

  const householdDirty = !householdsEqual(household, savedHouseholdRef.current)
  const dietDirty = !setsEqual(dietSelected, savedDietRef.current)
  const cuisineDirty = !setsEqual(cuisineLikes, savedCuisinesRef.current)
  const mealsDirty = !mealsEqual(mealsPerWeek, savedMealsRef.current)
  const equipmentDirty = !setsEqual(equipment, savedEquipmentRef.current)
  const cookingDirty =
    maxWeeklyPrep !== savedWeeklyPrepRef.current ||
    maxCookTime !== savedCookTimeRef.current
  const instructionsDirty = customInstructions !== savedInstructionsRef.current

  const isDirty = householdDirty || dietDirty || cuisineDirty || mealsDirty || equipmentDirty || cookingDirty || instructionsDirty

  // ── Save ───────────────────────────────────────────────────────────────────

  const updatePreferences = useMutation(api.preferences.update)

  if (!userId) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load preferences. Please try again.
        </p>
      </div>
    )
  }

  const saveAll = async () => {
    setSaveState('saving')
    try {
      await updatePreferences({
        userId,
        household,
        dietaryRestrictions: Array.from(dietSelected),
        cuisinePreferences: Array.from(cuisineLikes).map((cuisine) => ({
          cuisine,
          preference: 'like' as const,
        })),
        mealsPerWeek,
        kitchenEquipment: Array.from(equipment),
        maxWeeklyPrepMinutes: maxWeeklyPrep,
        maxCookTimeMinutes: maxCookTime,
        customInstructions: customInstructions.trim(),
      })
      savedHouseholdRef.current = household
      savedDietRef.current = dietSelected
      savedCuisinesRef.current = cuisineLikes
      savedMealsRef.current = mealsPerWeek
      savedEquipmentRef.current = equipment
      savedWeeklyPrepRef.current = maxWeeklyPrep
      savedCookTimeRef.current = maxCookTime
      savedInstructionsRef.current = customInstructions
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
      toast.error('Failed to save preferences')
    }
  }

  // ── Content renderer ───────────────────────────────────────────────────────

  function renderContent(key: CategoryKey) {
    switch (key) {
      case 'household':
        return <HouseholdSelector household={household} onHouseholdChange={setHousehold} />
      case 'diet':
        return <DietSelector selected={dietSelected} onChange={setDietSelected} layout="list" showIcons />
      case 'cuisine':
        return <CuisineSelector selected={cuisineLikes} onChange={setCuisineLikes} showIcons />
      case 'meals':
        return <MealPlanningControls mealsPerWeek={mealsPerWeek} onMealsPerWeekChange={setMealsPerWeek} />
      case 'equipment':
        return <EquipmentSelector equipment={equipment} onEquipmentChange={setEquipment} showIcons />
      case 'cooking':
        return (
          <CookingSetup
            maxWeeklyPrep={maxWeeklyPrep}
            onMaxWeeklyPrepChange={setMaxWeeklyPrep}
            maxCookTime={maxCookTime}
            onMaxCookTimeChange={setMaxCookTime}
          />
        )
      case 'instructions':
        return <CustomInstructionsInput value={customInstructions} onChange={setCustomInstructions} />
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(var(--action-height)+2rem)] [--action-height:5rem]">
      {/* Sticky header + tab bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" render={<Link to="/" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Preferences</h1>
        </div>

        {/* Scrollable pill tab bar */}
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
                  'relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                ].join(' ')}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area — relative + overflow-hidden contains exiting elements,
           min-h prevents collapse during mode="wait" exit→enter gap */}
      <div className="relative mx-auto w-full max-w-md flex-1 overflow-hidden px-4 pt-8">
        {/* Animated heading */}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`heading-${activeKey}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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

        {/* Animated editor content */}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`body-${activeKey}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderContent(activeKey)}
          </motion.div>
        </AnimatePresence>
      </div>

      <SaveBar isDirty={isDirty} saveState={saveState} onSave={saveAll} />
    </div>
  )
}
