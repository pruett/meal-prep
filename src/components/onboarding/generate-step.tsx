import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useWizard } from './wizard-shell'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface Preferences {
  dietaryRestrictions: string[]
  cuisinePreferences: {
    cuisine: string
    preference: 'like' | 'neutral' | 'dislike'
  }[]
  mealsPerWeek: number
  householdSize: number
  maxPrepTimeMinutes: number
  kitchenEquipment: string[]
  foodsToAvoid: string
}

interface GenerateStepProps {
  userId: Id<'users'>
  preferences: Preferences
}

export function GenerateStep({ userId, preferences }: GenerateStepProps) {
  const { setOnSave } = useWizard()
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-meals', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const convex = new ConvexHttpClient(
        import.meta.env.VITE_CONVEX_URL as string,
      )
      await convex.mutation(api.users.completeOnboarding, { id: userId })

      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setIsGenerating(false)
    }
  }, [userId, navigate])

  useEffect(() => {
    setOnSave(() => generate())
    return () => setOnSave(null)
  }, [generate, setOnSave])

  const likedCuisines = preferences.cuisinePreferences
    .filter((c) => c.preference === 'like')
    .map((c) => c.cuisine)
  const dislikedCuisines = preferences.cuisinePreferences
    .filter((c) => c.preference === 'dislike')
    .map((c) => c.cuisine)

  const isUsingDefaults =
    preferences.dietaryRestrictions.length === 0 &&
    preferences.cuisinePreferences.length === 0 &&
    preferences.foodsToAvoid.trim() === '' &&
    preferences.kitchenEquipment.length === 0

  const formatTime = (minutes: number) => {
    if (minutes >= 120) return '2 hrs'
    if (minutes >= 60) {
      const rem = minutes % 60
      return `${Math.floor(minutes / 60)} hr${rem > 0 ? ` ${rem} min` : ''}`
    }
    return `${minutes} min`
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Ready to generate
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          {isUsingDefaults
            ? "We've set smart defaults for you. Hit Finish to generate, or go back to customize."
            : "Here's a summary of your preferences. Click Finish to generate your first meal plan."}
        </p>
      </div>

      <div className="space-y-2.5">
        <SummaryRow
          icon="🥗"
          label="Diet"
          value={
            preferences.dietaryRestrictions.length > 0
              ? preferences.dietaryRestrictions.join(', ')
              : 'No restrictions'
          }
        />

        <SummaryRow
          icon="🌍"
          label="Cuisines"
          value={
            likedCuisines.length > 0 || dislikedCuisines.length > 0
              ? [
                  likedCuisines.length > 0 &&
                    `Like: ${likedCuisines.join(', ')}`,
                  dislikedCuisines.length > 0 &&
                    `Avoid: ${dislikedCuisines.join(', ')}`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Open to all cuisines'
          }
        />

        <SummaryRow
          icon="🚫"
          label="Avoid"
          value={preferences.foodsToAvoid.trim() || 'Nothing specific'}
        />

        <SummaryRow
          icon="📅"
          label="Meals"
          value={`${preferences.mealsPerWeek} meals/week · ${preferences.householdSize === 1 ? 'Just me' : `${preferences.householdSize} people`}`}
        />

        <SummaryRow
          icon="👨‍🍳"
          label="Cooking"
          value={`${formatTime(preferences.maxPrepTimeMinutes)} max${preferences.kitchenEquipment.length > 0 ? ` · ${preferences.kitchenEquipment.join(', ')}` : ''}`}
        />
      </div>

      {isGenerating && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-[var(--lagoon)]/20 bg-[var(--lagoon)]/5 px-4 py-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--lagoon)]/30 border-t-[var(--lagoon)]" />
          <span className="text-sm font-medium text-[var(--lagoon-deep)]">
            Generating your meal plan…
          </span>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2.5">
      <span className="text-base leading-none" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--sea-ink-soft)]/60">
          {label}
        </span>
        <p className="mt-0.5 text-sm text-[var(--sea-ink)]">{value}</p>
      </div>
    </div>
  )
}
