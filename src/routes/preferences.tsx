import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Slider } from '~/components/ui/slider'
import { ErrorFallback } from '~/components/error-boundary'
import { PreferencesSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'

// ─── Data Constants ────────────────────────────────────────────────────────────

const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🍖' },
  { id: 'low-carb', label: 'Low-Carb', icon: '🍞' },
  { id: 'low-sodium', label: 'Low-Sodium', icon: '🧂' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
] as const

const CUISINES = [
  { id: 'italian', label: 'Italian', icon: '🍝' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'chinese', label: 'Chinese', icon: '🥡' },
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'thai', label: 'Thai', icon: '🍜' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { id: 'korean', label: 'Korean', icon: '🥘' },
  { id: 'french', label: 'French', icon: '🥐' },
  { id: 'american', label: 'American', icon: '🍔' },
  { id: 'greek', label: 'Greek', icon: '🥙' },
  { id: 'middle-eastern', label: 'Middle Eastern', icon: '🧆' },
  { id: 'vietnamese', label: 'Vietnamese', icon: '🍲' },
  { id: 'spanish', label: 'Spanish', icon: '🥘' },
  { id: 'ethiopian', label: 'Ethiopian', icon: '🫓' },
  { id: 'caribbean', label: 'Caribbean', icon: '🥥' },
] as const

const EQUIPMENT = [
  { id: 'oven', label: 'Oven', icon: '🔥' },
  { id: 'stovetop', label: 'Stovetop', icon: '🍳' },
  { id: 'microwave', label: 'Microwave', icon: '📡' },
  { id: 'slow-cooker', label: 'Slow Cooker', icon: '🥘' },
  { id: 'instant-pot', label: 'Instant Pot', icon: '♨️' },
  { id: 'air-fryer', label: 'Air Fryer', icon: '🌀' },
  { id: 'blender', label: 'Blender', icon: '🫗' },
  { id: 'food-processor', label: 'Food Processor', icon: '⚙️' },
  { id: 'grill', label: 'Grill', icon: '🔥' },
  { id: 'wok', label: 'Wok', icon: '🥡' },
  { id: 'cast-iron', label: 'Cast Iron', icon: '🫕' },
  { id: 'sheet-pan', label: 'Sheet Pan', icon: '🍽️' },
] as const

type CuisinePreference = 'like' | 'neutral' | 'dislike'

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
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string
  summary: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/40"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--sea-ink)]">
            {title}
          </h3>
          {!open && (
            <p className="mt-0.5 truncate text-xs text-[var(--sea-ink-soft)]">
              {summary}
            </p>
          )}
        </div>
        <svg
          className={[
            'ml-3 h-4 w-4 shrink-0 text-[var(--sea-ink-soft)] transition-transform duration-200',
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
      </button>
      {open && (
        <div className="border-t border-[var(--line)] px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
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
          Saving…
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

  // Diet
  const [dietSelected, setDietSelected] = useState<Set<string>>(
    () => new Set(prefs?.dietaryRestrictions ?? []),
  )

  // Cuisines
  const [cuisinePrefs, setCuisinePrefs] = useState<Map<string, CuisinePreference>>(
    () => {
      const map = new Map<string, CuisinePreference>()
      for (const p of prefs?.cuisinePreferences ?? []) {
        map.set(p.cuisine, p.preference)
      }
      return map
    },
  )

  // Foods to avoid
  const [foodsToAvoid, setFoodsToAvoid] = useState(prefs?.foodsToAvoid ?? '')

  // Meals planning
  const [mealsPerWeek, setMealsPerWeek] = useState(prefs?.mealsPerWeek ?? 7)
  const [householdSize, setHouseholdSize] = useState(prefs?.householdSize ?? 2)

  // Cooking
  const [maxPrepTime, setMaxPrepTime] = useState(prefs?.maxPrepTimeMinutes ?? 45)
  const [equipment, setEquipment] = useState<Set<string>>(
    () => new Set(prefs?.kitchenEquipment ?? []),
  )

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updatePreferences = useMutation(api.preferences.update)

  const toggleDiet = (id: string) => {
    setDietSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getCuisinePref = (id: string): CuisinePreference =>
    cuisinePrefs.get(id) ?? 'neutral'

  const cycleCuisine = (id: string) => {
    setCuisinePrefs((prev) => {
      const next = new Map(prev)
      const current = next.get(id) ?? 'neutral'
      const order: CuisinePreference[] = ['neutral', 'like', 'dislike']
      const nextPref = order[(order.indexOf(current) + 1) % order.length]
      if (nextPref === 'neutral') next.delete(id)
      else next.set(id, nextPref)
      return next
    })
  }

  const setCuisinePref = (id: string, pref: CuisinePreference) => {
    setCuisinePrefs((prev) => {
      const next = new Map(prev)
      if (pref === 'neutral') next.delete(id)
      else next.set(id, pref)
      return next
    })
  }

  const toggleEquipment = (id: string) => {
    setEquipment((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const adjustHousehold = (delta: number) => {
    setHouseholdSize((prev) => Math.min(10, Math.max(1, prev + delta)))
  }

  const formatTime = (minutes: number) => {
    if (minutes >= 120) return '2 hrs'
    if (minutes >= 60)
      return `${Math.floor(minutes / 60)} hr ${minutes % 60 > 0 ? `${minutes % 60} min` : ''}`
    return `${minutes} min`
  }

  // ── Summaries ──────────────────────────────────────────────────────────────

  const dietSummary =
    dietSelected.size > 0
      ? Array.from(dietSelected)
          .map((id) => DIETARY_RESTRICTIONS.find((d) => d.id === id)?.label)
          .filter(Boolean)
          .join(', ')
      : 'No restrictions'

  const cuisineSummary = (() => {
    const likes = CUISINES.filter((c) => cuisinePrefs.get(c.id) === 'like').map(
      (c) => c.label,
    )
    const dislikes = CUISINES.filter(
      (c) => cuisinePrefs.get(c.id) === 'dislike',
    ).map((c) => c.label)
    const parts: string[] = []
    if (likes.length > 0) parts.push(`Like: ${likes.join(', ')}`)
    if (dislikes.length > 0) parts.push(`Dislike: ${dislikes.join(', ')}`)
    return parts.length > 0 ? parts.join(' · ') : 'Open to all cuisines'
  })()

  const avoidSummary = foodsToAvoid.trim() || 'Nothing specific'

  const mealsSummary = `${mealsPerWeek} meals/week · ${householdSize === 1 ? 'Just me' : `${householdSize} people`}`

  const cookingSummary = `${formatTime(maxPrepTime)} max · ${equipment.size > 0 ? `${equipment.size} items` : 'No equipment selected'}`

  // ── Save handlers ──────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <main className="page-wrap px-4 pb-8 pt-8">
        <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
          Unable to load preferences. Please try again.
        </p>
      </main>
    )
  }

  const saveDiet = async () => {
    await updatePreferences({
      userId,
      dietaryRestrictions: Array.from(dietSelected),
    })
  }

  const saveCuisines = async () => {
    const cuisinePreferences: Array<{
      cuisine: string
      preference: CuisinePreference
    }> = []
    for (const [cuisine, preference] of cuisinePrefs) {
      cuisinePreferences.push({ cuisine, preference })
    }
    await updatePreferences({
      userId,
      cuisinePreferences,
    })
  }

  const saveAvoid = async () => {
    await updatePreferences({
      userId,
      foodsToAvoid: foodsToAvoid.trim(),
    })
  }

  const saveMeals = async () => {
    await updatePreferences({
      userId,
      mealsPerWeek,
      householdSize,
    })
  }

  const saveCooking = async () => {
    await updatePreferences({
      userId,
      maxPrepTimeMinutes: maxPrepTime,
      kitchenEquipment: Array.from(equipment),
    })
  }

  return (
    <main className="page-wrap rise-in px-4 pb-8 pt-14">
      {/* Header */}
      <section className="mb-8">
        <p className="island-kicker mb-2">Preferences</p>
        <h1 className="display-title mb-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Your Preferences
        </h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Customize how your meal plans are generated.
        </p>
      </section>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {/* ── Diet ─────────────────────────────────────────────────────────── */}
        <Section title="Dietary Restrictions" summary={dietSummary}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {DIETARY_RESTRICTIONS.map(({ id, label, icon }) => {
              const isSelected = dietSelected.has(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleDiet(id)}
                  className={[
                    'group relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                    isSelected
                      ? 'border-[var(--lagoon)] bg-[var(--lagoon)]/8 text-[var(--sea-ink)] shadow-sm shadow-[var(--lagoon)]/10'
                      : 'border-[var(--line)] bg-white/50 text-[var(--sea-ink-soft)] hover:border-[var(--lagoon)]/40 hover:bg-white/80',
                  ].join(' ')}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {icon}
                  </span>
                  <span className="truncate">{label}</span>
                  {isSelected && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      <svg
                        className="h-3.5 w-3.5 text-[var(--lagoon-deep)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveDiet} />
          </div>
        </Section>

        {/* ── Cuisines ─────────────────────────────────────────────────────── */}
        <Section title="Cuisine Preferences" summary={cuisineSummary}>
          <div className="mb-3 flex flex-wrap items-center gap-2 px-1 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--lagoon)]" />
              Like
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--line)]" />
              Neutral
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              Dislike
            </div>
          </div>

          <div className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1 -mr-1">
            {CUISINES.map(({ id, label, icon }) => {
              const pref = getCuisinePref(id)
              return (
                <div
                  key={id}
                  className={[
                    'group flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-200',
                    pref === 'like'
                      ? 'border-[var(--lagoon)] bg-[var(--lagoon)]/8 shadow-sm shadow-[var(--lagoon)]/10'
                      : pref === 'dislike'
                        ? 'border-rose-300/60 bg-rose-50/50'
                        : 'border-[var(--line)] bg-white/40',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => cycleCuisine(id)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className="text-base leading-none"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    <span
                      className={[
                        'text-sm font-medium transition-colors',
                        pref === 'like'
                          ? 'text-[var(--sea-ink)]'
                          : pref === 'dislike'
                            ? 'text-rose-700/80'
                            : 'text-[var(--sea-ink-soft)]',
                      ].join(' ')}
                    >
                      {label}
                    </span>
                  </button>

                  {/* 3-state toggle */}
                  <div className="flex items-center gap-0.5 rounded-md border border-[var(--line)] bg-white/60 p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCuisinePref(
                          id,
                          pref === 'like' ? 'neutral' : 'like',
                        )
                      }
                      aria-label={`Like ${label}`}
                      className={[
                        'flex h-6 w-6 items-center justify-center rounded transition-all duration-150',
                        pref === 'like'
                          ? 'bg-[var(--lagoon)] text-white shadow-sm'
                          : 'text-[var(--sea-ink-soft)]/40 hover:text-[var(--lagoon)] hover:bg-[var(--lagoon)]/10',
                      ].join(' ')}
                    >
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
                          d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCuisinePref(
                          id,
                          pref === 'dislike' ? 'neutral' : 'dislike',
                        )
                      }
                      aria-label={`Dislike ${label}`}
                      className={[
                        'flex h-6 w-6 items-center justify-center rounded transition-all duration-150',
                        pref === 'dislike'
                          ? 'bg-rose-400 text-white shadow-sm'
                          : 'text-[var(--sea-ink-soft)]/40 hover:text-rose-400 hover:bg-rose-50',
                      ].join(' ')}
                    >
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
                          d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveCuisines} />
          </div>
        </Section>

        {/* ── Foods to Avoid ───────────────────────────────────────────────── */}
        <Section title="Foods to Avoid" summary={avoidSummary}>
          <textarea
            value={foodsToAvoid}
            onChange={(e) => setFoodsToAvoid(e.target.value)}
            placeholder="e.g. shellfish, cilantro, blue cheese, raw tomatoes…"
            rows={4}
            className="w-full rounded-lg border border-[var(--line)] bg-white/60 px-3.5 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]/20 transition-colors resize-none"
          />
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]/70">
            Separate items with commas or put each on its own line.
          </p>
          <div className="mt-4 flex justify-end">
            <SaveButton onSave={saveAvoid} />
          </div>
        </Section>

        {/* ── Meal Planning ────────────────────────────────────────────────── */}
        <Section title="Meal Planning" summary={mealsSummary}>
          {/* Meals per week */}
          <div className="mb-8">
            <div className="mb-4 flex items-baseline justify-between">
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Meals per week
              </label>
              <span className="text-2xl font-bold tabular-nums text-[var(--lagoon-deep)]">
                {mealsPerWeek}
              </span>
            </div>
            <Slider
              value={[mealsPerWeek]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                setMealsPerWeek(v)
              }}
              min={3}
              max={14}
              step={1}
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--sea-ink-soft)]/60">
              <span>3</span>
              <span>14</span>
            </div>
          </div>

          {/* Household size */}
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Household size
              </label>
              <span className="text-sm text-[var(--sea-ink-soft)]">
                {householdSize === 1 ? 'Just me' : `${householdSize} people`}
              </span>
            </div>
            <div className="flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => adjustHousehold(-1)}
                disabled={householdSize <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/60 text-lg font-semibold text-[var(--sea-ink)] transition-colors hover:border-[var(--lagoon)]/40 hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-12 text-center text-3xl font-bold tabular-nums text-[var(--lagoon-deep)]">
                {householdSize}
              </span>
              <button
                type="button"
                onClick={() => adjustHousehold(1)}
                disabled={householdSize >= 10}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/60 text-lg font-semibold text-[var(--sea-ink)] transition-colors hover:border-[var(--lagoon)]/40 hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <SaveButton onSave={saveMeals} />
          </div>
        </Section>

        {/* ── Cooking ──────────────────────────────────────────────────────── */}
        <Section title="Cooking Preferences" summary={cookingSummary}>
          {/* Max prep time */}
          <div className="mb-8">
            <div className="mb-4 flex items-baseline justify-between">
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Max prep time per meal
              </label>
              <span className="text-2xl font-bold tabular-nums text-[var(--lagoon-deep)]">
                {formatTime(maxPrepTime)}
              </span>
            </div>
            <Slider
              value={[maxPrepTime]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                setMaxPrepTime(v)
              }}
              min={15}
              max={120}
              step={5}
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--sea-ink-soft)]/60">
              <span>15 min</span>
              <span>2 hrs</span>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="mb-3 block text-sm font-medium text-[var(--sea-ink)]">
              Kitchen equipment
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {EQUIPMENT.map(({ id, label, icon }) => {
                const isSelected = equipment.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleEquipment(id)}
                    className={[
                      'group relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                      isSelected
                        ? 'border-[var(--lagoon)] bg-[var(--lagoon)]/8 text-[var(--sea-ink)] shadow-sm shadow-[var(--lagoon)]/10'
                        : 'border-[var(--line)] bg-white/50 text-[var(--sea-ink-soft)] hover:border-[var(--lagoon)]/40 hover:bg-white/80',
                    ].join(' ')}
                  >
                    <span
                      className="text-base leading-none"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    <span className="truncate">{label}</span>
                    {isSelected && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        <svg
                          className="h-3.5 w-3.5 text-[var(--lagoon-deep)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <SaveButton onSave={saveCooking} />
          </div>
        </Section>
      </div>
    </main>
  )
}
