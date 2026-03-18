import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
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
import { AppPage } from '~/components/layout/app-page'
import {
  DIETARY_RESTRICTIONS,
  CUISINES,
  formatTime,
  setsEqual,
} from '~/components/preferences/constants'
import { Leaf, Globe, MessageSquare, CalendarDays, ChefHat, Clock, Users } from 'lucide-react'

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

// ─── Collapsible Section ───────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  summary: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-accent/50">
          <div className="flex min-w-0 items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">
                {title}
              </h3>
              {!open && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {summary}
                </p>
              )}
            </div>
          </div>
          <svg
            className={[
              'ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-180' : '',
            ].join(' ')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-5 pb-5 pt-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Save Button ───────────────────────────────────────────────────────────────

function SaveButton({
  onSave,
  disabled,
}: {
  onSave: () => Promise<void>
  disabled?: boolean
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleSave = async () => {
    setState('saving')
    try {
      await onSave()
      setState('saved')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('idle')
      toast.error('Failed to save preferences')
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleSave}
      disabled={disabled || state === 'saving'}
    >
      {state === 'saving' ? (
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
          Saving...
        </span>
      ) : state === 'saved' ? (
        <span className="flex items-center gap-1.5">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved
        </span>
      ) : (
        'Save'
      )}
    </Button>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function householdsEqual(a: Household, b: Household) {
  return a.adults === b.adults && a.kids === b.kids && a.infants === b.infants
}

function mealsEqual(a: MealsPerWeek, b: MealsPerWeek) {
  return a.breakfast === b.breakfast && a.lunch === b.lunch && a.dinner === b.dinner
}

// ─── Page Component ────────────────────────────────────────────────────────────

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

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updatePreferences = useMutation(api.preferences.update)

  // ── Summaries ──────────────────────────────────────────────────────────────

  const totalPeople = household.adults + household.kids + household.infants
  const householdSummary = `${totalPeople} ${totalPeople === 1 ? 'person' : 'people'}`

  const dietSummary =
    dietSelected.size > 0
      ? Array.from(dietSelected)
          .map((id) => DIETARY_RESTRICTIONS.find((d) => d.id === id)?.label)
          .filter(Boolean)
          .join(', ')
      : 'No restrictions'

  const cuisineSummary =
    cuisineLikes.size > 0
      ? Array.from(cuisineLikes)
          .map((id) => CUISINES.find((c) => c.id === id)?.label)
          .filter(Boolean)
          .join(', ')
      : 'Open to all cuisines'

  const totalMeals = mealsPerWeek.breakfast + mealsPerWeek.lunch + mealsPerWeek.dinner
  const mealsSummary = `${totalMeals} meals/week`

  const equipmentSummary = equipment.size > 0 ? `${equipment.size} items selected` : 'No equipment selected'

  const cookingSummary = `${formatTime(maxWeeklyPrep)} prep / ${formatTime(maxCookTime)} per meal`

  const instructionsSummary = customInstructions.trim() || 'Nothing specific'

  // ── Save handlers ──────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <AppPage className="pt-8">
        <p className="py-12 text-center text-sm text-muted-foreground">
          Unable to load preferences. Please try again.
        </p>
      </AppPage>
    )
  }

  const saveHousehold = async () => {
    await updatePreferences({
      userId,
      household,
    })
    savedHouseholdRef.current = household
  }

  const saveDiet = async () => {
    await updatePreferences({
      userId,
      dietaryRestrictions: Array.from(dietSelected),
    })
    savedDietRef.current = dietSelected
  }

  const saveCuisines = async () => {
    await updatePreferences({
      userId,
      cuisinePreferences: Array.from(cuisineLikes).map((cuisine) => ({
        cuisine,
        preference: 'like' as const,
      })),
    })
    savedCuisinesRef.current = cuisineLikes
  }

  const saveMeals = async () => {
    await updatePreferences({
      userId,
      mealsPerWeek,
    })
    savedMealsRef.current = mealsPerWeek
  }

  const saveEquipment = async () => {
    await updatePreferences({
      userId,
      kitchenEquipment: Array.from(equipment),
    })
    savedEquipmentRef.current = equipment
  }

  const saveCooking = async () => {
    await updatePreferences({
      userId,
      maxWeeklyPrepMinutes: maxWeeklyPrep,
      maxCookTimeMinutes: maxCookTime,
    })
    savedWeeklyPrepRef.current = maxWeeklyPrep
    savedCookTimeRef.current = maxCookTime
  }

  const saveInstructions = async () => {
    await updatePreferences({
      userId,
      customInstructions: customInstructions.trim(),
    })
    savedInstructionsRef.current = customInstructions
  }

  return (
    <AppPage>
      {/* Header */}
      <section className="mb-8">
        <p className="island-kicker mb-2">Preferences</p>
        <h1 className="display-title mb-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Your Preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize how your meal plans are generated.
        </p>
      </section>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {/* ── Household ──────────────────────────────────────────────────── */}
        <Section icon={Users} title="Household" summary={householdSummary}>
          <HouseholdSelector
            household={household}
            onHouseholdChange={setHousehold}
          />
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveHousehold} disabled={!householdDirty} />
          </div>
        </Section>

        {/* ── Diet ─────────────────────────────────────────────────────────── */}
        <Section icon={Leaf} title="Dietary Restrictions" summary={dietSummary}>
          <DietSelector
            selected={dietSelected}
            onChange={setDietSelected}
            showIcons
          />
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveDiet} disabled={!dietDirty} />
          </div>
        </Section>

        {/* ── Cuisines ─────────────────────────────────────────────────────── */}
        <Section icon={Globe} title="Cuisine Preferences" summary={cuisineSummary}>
          <CuisineSelector
            selected={cuisineLikes}
            onChange={setCuisineLikes}
            showIcons
          />
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveCuisines} disabled={!cuisineDirty} />
          </div>
        </Section>

        {/* ── Meal Planning ────────────────────────────────────────────────── */}
        <Section icon={CalendarDays} title="Meal Planning" summary={mealsSummary}>
          <MealPlanningControls
            mealsPerWeek={mealsPerWeek}
            onMealsPerWeekChange={setMealsPerWeek}
          />
          <div className="mt-6 flex justify-end">
            <SaveButton onSave={saveMeals} disabled={!mealsDirty} />
          </div>
        </Section>

        {/* ── Equipment ────────────────────────────────────────────────────── */}
        <Section icon={ChefHat} title="Kitchen Equipment" summary={equipmentSummary}>
          <EquipmentSelector
            equipment={equipment}
            onEquipmentChange={setEquipment}
            showIcons
          />
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveEquipment} disabled={!equipmentDirty} />
          </div>
        </Section>

        {/* ── Cooking Time ───────────────────────────────────────────────────── */}
        <Section icon={Clock} title="Cooking Time" summary={cookingSummary}>
          <CookingSetup
            maxWeeklyPrep={maxWeeklyPrep}
            onMaxWeeklyPrepChange={setMaxWeeklyPrep}
            maxCookTime={maxCookTime}
            onMaxCookTimeChange={setMaxCookTime}
          />
          <div className="mt-6 flex justify-end">
            <SaveButton onSave={saveCooking} disabled={!cookingDirty} />
          </div>
        </Section>

        {/* ── Custom Instructions ──────────────────────────────────────────── */}
        <Section icon={MessageSquare} title="Custom Instructions" summary={instructionsSummary}>
          <CustomInstructionsInput
            value={customInstructions}
            onChange={setCustomInstructions}
          />
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveInstructions} disabled={!instructionsDirty} />
          </div>
        </Section>
      </div>
    </AppPage>
  )
}
