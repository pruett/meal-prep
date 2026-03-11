import { useCallback, useEffect, useState } from 'react'
import { useWizard } from './wizard-shell'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface AvoidStepProps {
  userId: Id<'users'>
  initialFoodsToAvoid: string
}

export function AvoidStep({ userId, initialFoodsToAvoid }: AvoidStepProps) {
  const { setOnSave } = useWizard()
  const [text, setText] = useState(initialFoodsToAvoid)

  const save = useCallback(async () => {
    const convex = new ConvexHttpClient(
      import.meta.env.VITE_CONVEX_URL as string,
    )
    await convex.mutation(api.preferences.update, {
      userId,
      foodsToAvoid: text.trim(),
    })
  }, [userId, text])

  useEffect(() => {
    setOnSave(() => save())
    return () => setOnSave(null)
  }, [save, setOnSave])

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Foods to avoid
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          List any specific foods, ingredients, or allergens you'd like us to
          keep out of your meal plans.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. shellfish, cilantro, blue cheese, raw tomatoes…"
        rows={5}
        className="w-full rounded-lg border border-[var(--line)] bg-white/60 px-3.5 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]/50 focus:border-[var(--lagoon)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]/20 transition-colors resize-none"
      />

      <p className="mt-3 text-xs text-[var(--sea-ink-soft)]/70">
        Separate items with commas or put each on its own line.
      </p>

      <p className="mt-4 text-center text-xs text-[var(--sea-ink-soft)]/70">
        Nothing to avoid? Just skip this step.
      </p>
    </div>
  )
}
