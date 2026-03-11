import { useCallback, useEffect, useState } from 'react'
import { useWizard } from './wizard-shell'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

type Preference = 'like' | 'neutral' | 'dislike'

interface CuisineState {
  cuisine: string
  preference: Preference
}

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

interface CuisinesStepProps {
  userId: Id<'users'>
  initialPreferences: Array<{ cuisine: string; preference: Preference }>
}

export function CuisinesStep({ userId, initialPreferences }: CuisinesStepProps) {
  const { setOnSave } = useWizard()
  const [preferences, setPreferences] = useState<Map<string, Preference>>(() => {
    const map = new Map<string, Preference>()
    for (const pref of initialPreferences) {
      map.set(pref.cuisine, pref.preference)
    }
    return map
  })

  const getPreference = (id: string): Preference =>
    preferences.get(id) ?? 'neutral'

  const cyclePreference = (id: string) => {
    setPreferences((prev) => {
      const next = new Map(prev)
      const current = next.get(id) ?? 'neutral'
      const order: Preference[] = ['neutral', 'like', 'dislike']
      const nextPref = order[(order.indexOf(current) + 1) % order.length]
      if (nextPref === 'neutral') {
        next.delete(id)
      } else {
        next.set(id, nextPref)
      }
      return next
    })
  }

  const setPreference = (id: string, pref: Preference) => {
    setPreferences((prev) => {
      const next = new Map(prev)
      if (pref === 'neutral') {
        next.delete(id)
      } else {
        next.set(id, pref)
      }
      return next
    })
  }

  const save = useCallback(async () => {
    const convex = new ConvexHttpClient(
      import.meta.env.VITE_CONVEX_URL as string,
    )
    const cuisinePreferences: CuisineState[] = []
    for (const [cuisine, preference] of preferences) {
      cuisinePreferences.push({ cuisine, preference })
    }
    await convex.mutation(api.preferences.update, {
      userId,
      cuisinePreferences,
    })
  }, [userId, preferences])

  useEffect(() => {
    setOnSave(() => save())
    return () => setOnSave(null)
  }, [save, setOnSave])

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Cuisine preferences
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Tap to cycle through like, dislike, or neutral — or use the buttons.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-3 px-1">
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
          const pref = getPreference(id)
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
              {/* Cuisine label — clickable to cycle */}
              <button
                type="button"
                onClick={() => cyclePreference(id)}
                className="flex flex-1 items-center gap-2.5 text-left"
              >
                <span className="text-base leading-none" aria-hidden="true">
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
                {/* Like */}
                <button
                  type="button"
                  onClick={() => setPreference(id, pref === 'like' ? 'neutral' : 'like')}
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

                {/* Dislike */}
                <button
                  type="button"
                  onClick={() =>
                    setPreference(id, pref === 'dislike' ? 'neutral' : 'dislike')
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

      <p className="mt-4 text-center text-xs text-[var(--sea-ink-soft)]/70">
        No strong feelings? Just skip this step.
      </p>
    </div>
  )
}
