import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Check, X, ChefHat, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/prototype/quick-tap')({
  component: QuickTapPrototype,
})

const MOCK_MEALS = [
  {
    id: '1',
    name: 'Honey Garlic Salmon',
    time: '25 min',
    ingredients: ['salmon', 'honey', 'garlic', 'broccoli'],
    color: 'oklch(0.85 0.10 170)',
    emoji: '🐟',
  },
  {
    id: '2',
    name: 'Tuscan Chicken',
    time: '30 min',
    ingredients: ['chicken', 'tomatoes', 'spinach'],
    color: 'oklch(0.87 0.11 45)',
    emoji: '🍗',
  },
  {
    id: '3',
    name: 'Korean Beef Bowls',
    time: '20 min',
    ingredients: ['ground beef', 'gochujang', 'rice'],
    color: 'oklch(0.84 0.12 20)',
    emoji: '🥩',
  },
  {
    id: '4',
    name: 'Lemon Herb Pasta',
    time: '15 min',
    ingredients: ['penne', 'lemon', 'cream'],
    color: 'oklch(0.90 0.08 95)',
    emoji: '🍝',
  },
  {
    id: '5',
    name: 'Sheet Pan Fajitas',
    time: '25 min',
    ingredients: ['chicken', 'peppers', 'tortillas'],
    color: 'oklch(0.86 0.12 70)',
    emoji: '🌮',
  },
  {
    id: '6',
    name: 'Coconut Curry Shrimp',
    time: '20 min',
    ingredients: ['shrimp', 'coconut milk', 'curry'],
    color: 'oklch(0.85 0.09 185)',
    emoji: '🍤',
  },
  {
    id: '7',
    name: 'BBQ Chicken Pizza',
    time: '20 min',
    ingredients: ['flatbread', 'chicken', 'BBQ'],
    color: 'oklch(0.83 0.11 30)',
    emoji: '🍕',
  },
  {
    id: '8',
    name: 'Teriyaki Stir Fry',
    time: '15 min',
    ingredients: ['tofu', 'broccoli', 'soy sauce'],
    color: 'oklch(0.82 0.10 140)',
    emoji: '🥦',
  },
]

type Decision = 'kept' | 'dismissed'

function QuickTapPrototype() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const keptCount = Object.values(decisions).filter(
    (d) => d === 'kept',
  ).length
  const dismissedCount = Object.values(decisions).filter(
    (d) => d === 'dismissed',
  ).length
  const totalDecided = keptCount + dismissedCount

  const handleTap = useCallback(
    (id: string) => {
      setDecisions((prev) => {
        const current = prev[id]
        if (!current) return { ...prev, [id]: 'kept' }
        if (current === 'kept') return { ...prev, [id]: 'dismissed' }
        // dismissed -> remove decision (back to undecided)
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [],
  )

  const handleLongPress = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const handleReset = () => {
    setDecisions({})
    setExpandedId(null)
  }

  const allDecided = totalDecided === MOCK_MEALS.length

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <Link
          to="/prototype"
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground"
        >
          Reset
        </button>
      </div>

      {/* title */}
      <div className="px-4 pb-3 pt-1">
        <h1 className="text-lg font-bold tracking-tight">Pick your meals</h1>
        <p className="text-xs text-muted-foreground">
          Tap to keep, tap again to dismiss, tap once more to undo
        </p>
      </div>

      {/* grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-28">
        <div className="grid grid-cols-2 gap-2.5">
          {MOCK_MEALS.map((meal, index) => {
            const decision = decisions[meal.id]
            const isKept = decision === 'kept'
            const isDismissed = decision === 'dismissed'
            const isExpanded = expandedId === meal.id

            return (
              <motion.button
                key={meal.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleTap(meal.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleLongPress(meal.id)
                }}
                className="relative overflow-hidden rounded-2xl text-left transition-shadow active:scale-[0.97]"
                style={{
                  background: isDismissed
                    ? 'var(--muted)'
                    : meal.color,
                  outline: isKept
                    ? '3px solid oklch(0.65 0.20 155)'
                    : 'none',
                  outlineOffset: '-1px',
                }}
              >
                {/* status overlay */}
                <AnimatePresence>
                  {isKept && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.div>
                  )}
                  {isDismissed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-foreground/20 text-foreground/40"
                    >
                      <X className="size-3.5" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* card content */}
                <div className={`p-4 ${isDismissed ? 'opacity-40' : ''}`}>
                  <motion.span
                    className="text-4xl block"
                    animate={
                      isKept
                        ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                  >
                    {meal.emoji}
                  </motion.span>
                  <h3 className="mt-2 text-sm font-bold leading-tight text-foreground">
                    {meal.name}
                  </h3>
                  <span className="mt-0.5 block text-[11px] text-foreground/50">
                    {meal.time}
                  </span>

                  {/* expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 flex flex-wrap gap-1">
                          {meal.ingredients.map((ing) => (
                            <span
                              key={ing}
                              className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-foreground/60"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* load more */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground"
        >
          <Sparkles className="size-4" />
          Generate More Suggestions
        </motion.button>
      </div>

      {/* bottom bar */}
      <motion.div
        className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-md"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold">{keptCount} kept</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-foreground/20" />
              <span className="text-sm text-muted-foreground">
                {dismissedCount} dismissed
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            animate={
              allDecided
                ? {
                    background: ['oklch(0.212 0.019 322.12)', 'oklch(0.45 0.20 155)', 'oklch(0.212 0.019 322.12)'],
                  }
                : {}
            }
            transition={allDecided ? { repeat: Infinity, duration: 2 } : {}}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            disabled={keptCount === 0}
          >
            <ChefHat className="size-4" />
            Done ({keptCount})
          </motion.button>
        </div>

        {/* progress */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-foreground/30"
            animate={{
              width: `${(totalDecided / MOCK_MEALS.length) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          {totalDecided} of {MOCK_MEALS.length} reviewed
        </p>
      </motion.div>
    </div>
  )
}
