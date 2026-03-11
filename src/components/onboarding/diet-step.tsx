import { useCallback, useEffect, useState } from 'react'
import { useWizard } from './wizard-shell'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

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

interface DietStepProps {
  userId: Id<'users'>
  initialRestrictions: string[]
}

export function DietStep({ userId, initialRestrictions }: DietStepProps) {
  const { setOnSave } = useWizard()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialRestrictions),
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const save = useCallback(async () => {
    const convex = new ConvexHttpClient(
      import.meta.env.VITE_CONVEX_URL as string,
    )
    await convex.mutation(api.preferences.update, {
      userId,
      dietaryRestrictions: Array.from(selected),
    })
  }, [userId, selected])

  useEffect(() => {
    setOnSave(() => save())
    return () => setOnSave(null)
  }, [save, setOnSave])

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Dietary restrictions
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Select any that apply. We'll tailor your meal plans accordingly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {DIETARY_RESTRICTIONS.map(({ id, label, icon }) => {
          const isSelected = selected.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
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

      <p className="mt-4 text-center text-xs text-[var(--sea-ink-soft)]/70">
        No restrictions? Just skip this step.
      </p>
    </div>
  )
}
