import { useCallback, useEffect, useState } from 'react'
import { useWizard } from './wizard-shell'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Slider } from '~/components/ui/slider'

interface MealsStepProps {
  userId: Id<'users'>
  initialMealsPerWeek: number
  initialHouseholdSize: number
}

export function MealsStep({
  userId,
  initialMealsPerWeek,
  initialHouseholdSize,
}: MealsStepProps) {
  const { setOnSave } = useWizard()
  const [mealsPerWeek, setMealsPerWeek] = useState(initialMealsPerWeek)
  const [householdSize, setHouseholdSize] = useState(initialHouseholdSize)

  const save = useCallback(async () => {
    const convex = new ConvexHttpClient(
      import.meta.env.VITE_CONVEX_URL as string,
    )
    await convex.mutation(api.preferences.update, {
      userId,
      mealsPerWeek,
      householdSize,
    })
  }, [userId, mealsPerWeek, householdSize])

  useEffect(() => {
    setOnSave(() => save())
    return () => setOnSave(null)
  }, [save, setOnSave])

  const adjustHousehold = (delta: number) => {
    setHouseholdSize((prev) => Math.min(10, Math.max(1, prev + delta)))
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Meal planning
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          How many meals should we plan, and for how many people?
        </p>
      </div>

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
            {householdSize === 1
              ? 'Just me'
              : `${householdSize} people`}
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

      <p className="mt-6 text-center text-xs text-[var(--sea-ink-soft)]/70">
        Defaults work great — skip if you're unsure.
      </p>
    </div>
  )
}
