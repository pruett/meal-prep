import { useCallback, useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { useWizard } from './wizard-shell'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Slider } from '~/components/ui/slider'

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

interface CookingStepProps {
  userId: Id<'users'>
  initialMaxPrepTime: number
  initialEquipment: string[]
}

export function CookingStep({
  userId,
  initialMaxPrepTime,
  initialEquipment,
}: CookingStepProps) {
  const { setOnSave } = useWizard()
  const [maxPrepTime, setMaxPrepTime] = useState(initialMaxPrepTime)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialEquipment),
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

  const updatePreferences = useMutation(api.preferences.update)

  const save = useCallback(async () => {
    await updatePreferences({
      userId,
      maxPrepTimeMinutes: maxPrepTime,
      kitchenEquipment: Array.from(selected),
    })
  }, [userId, maxPrepTime, selected, updatePreferences])

  useEffect(() => {
    setOnSave(() => save())
    return () => setOnSave(null)
  }, [save, setOnSave])

  const formatTime = (minutes: number) => {
    if (minutes >= 120) return '2 hrs'
    if (minutes >= 60) return `${Math.floor(minutes / 60)} hr ${minutes % 60 > 0 ? `${minutes % 60} min` : ''}`
    return `${minutes} min`
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Cooking preferences
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Set your max prep time and tell us what equipment you have.
        </p>
      </div>

      {/* Max prep time slider */}
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

      {/* Equipment grid */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--sea-ink)]">
          Kitchen equipment
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {EQUIPMENT.map(({ id, label, icon }) => {
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
      </div>

      <p className="mt-4 text-center text-xs text-[var(--sea-ink-soft)]/70">
        Not sure? Skip — we'll suggest recipes for basic kitchens.
      </p>
    </div>
  )
}
