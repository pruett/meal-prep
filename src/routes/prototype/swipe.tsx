import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from 'motion/react'
import { Heart, X, ArrowLeft, RotateCcw } from 'lucide-react'

export const Route = createFileRoute('/prototype/swipe')({
  component: SwipePrototype,
})

// ── placeholder data ──
const MOCK_MEALS = [
  {
    id: '1',
    name: 'Honey Garlic Salmon',
    description: 'Glazed salmon fillets with roasted broccoli and jasmine rice',
    time: '25 min',
    ingredients: ['salmon', 'honey', 'garlic', 'broccoli', 'rice'],
    color: 'oklch(0.85 0.12 160)',
  },
  {
    id: '2',
    name: 'One-Pot Tuscan Chicken',
    description:
      'Creamy sun-dried tomato chicken with spinach and white beans',
    time: '30 min',
    ingredients: [
      'chicken thighs',
      'sun-dried tomatoes',
      'spinach',
      'white beans',
    ],
    color: 'oklch(0.82 0.14 50)',
  },
  {
    id: '3',
    name: 'Korean Beef Bowls',
    description: 'Sweet & spicy ground beef over rice with pickled veggies',
    time: '20 min',
    ingredients: ['ground beef', 'gochujang', 'rice', 'cucumber', 'carrots'],
    color: 'oklch(0.78 0.16 25)',
  },
  {
    id: '4',
    name: 'Lemon Herb Pasta',
    description: 'Light lemon cream sauce with fresh herbs and parmesan',
    time: '15 min',
    ingredients: ['penne', 'lemon', 'cream', 'parmesan', 'basil'],
    color: 'oklch(0.90 0.10 95)',
  },
  {
    id: '5',
    name: 'Sheet Pan Fajitas',
    description: 'Colorful bell peppers and chicken with warm tortillas',
    time: '25 min',
    ingredients: [
      'chicken breast',
      'bell peppers',
      'onion',
      'tortillas',
      'lime',
    ],
    color: 'oklch(0.80 0.15 75)',
  },
  {
    id: '6',
    name: 'Coconut Curry Shrimp',
    description: 'Creamy Thai coconut curry with shrimp and snap peas',
    time: '20 min',
    ingredients: ['shrimp', 'coconut milk', 'curry paste', 'snap peas', 'basil'],
    color: 'oklch(0.83 0.11 195)',
  },
  {
    id: '7',
    name: 'BBQ Chicken Pizza',
    description: 'Flatbread pizza with BBQ chicken, red onion, and cilantro',
    time: '20 min',
    ingredients: [
      'flatbread',
      'chicken',
      'BBQ sauce',
      'mozzarella',
      'red onion',
    ],
    color: 'oklch(0.75 0.13 35)',
  },
]

type Meal = (typeof MOCK_MEALS)[number]

// ── swipeable card ──
function SwipeCard({
  meal,
  onSwipe,
  isTop,
}: {
  meal: Meal
  onSwipe: (direction: 'left' | 'right') => void
  isTop: boolean
}) {
  const x = useMotionValue(0)

  // visual feedback transforms
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18])
  const keepOpacity = useTransform(x, [0, 80], [0, 1])
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0])
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const swipeThreshold = 100
      const velocityThreshold = 500

      if (
        info.offset.x > swipeThreshold ||
        info.velocity.x > velocityThreshold
      ) {
        onSwipe('right')
      } else if (
        info.offset.x < -swipeThreshold ||
        info.velocity.x < -velocityThreshold
      ) {
        onSwipe('left')
      }
    },
    [onSwipe],
  )

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, scale, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        opacity: 1,
        y: isTop ? 0 : 8,
      }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
      >
        {/* hero image placeholder */}
        <div
          className="relative flex-1"
          style={{ background: meal.color, minHeight: '55%' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-40">🍽️</span>
          </div>

          {/* swipe indicators */}
          <motion.div
            className="absolute left-5 top-5 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white shadow-lg"
            style={{ opacity: keepOpacity }}
          >
            KEEP!
          </motion.div>
          <motion.div
            className="absolute right-5 top-5 rounded-xl bg-rose-500 px-4 py-2 font-bold text-white shadow-lg"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>
        </div>

        {/* meal info */}
        <div className="flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">{meal.name}</h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {meal.time}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {meal.description}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {meal.ingredients.map((ing) => (
              <span
                key={ing}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SwipePrototype() {
  const [deck, setDeck] = useState<Meal[]>([...MOCK_MEALS])
  const [kept, setKept] = useState<Meal[]>([])
  const [dismissed, setDismissed] = useState<Meal[]>([])

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const current = deck[0]
      if (!current) return

      setDeck((prev) => prev.slice(1))
      if (direction === 'right') {
        setKept((prev) => [...prev, current])
      } else {
        setDismissed((prev) => [...prev, current])
      }
    },
    [deck],
  )

  const handleReset = () => {
    setDeck([...MOCK_MEALS])
    setKept([])
    setDismissed([])
  }

  const handleLoadMore = () => {
    // simulate generating more suggestions
    setDeck([...MOCK_MEALS].sort(() => Math.random() - 0.5))
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link to="/prototype" className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Building your week</p>
          <p className="text-sm font-semibold">
            {kept.length} meals kept
          </p>
        </div>
        <button onClick={handleReset} className="text-sm text-muted-foreground">
          <RotateCcw className="size-4" />
        </button>
      </div>

      {/* progress dots */}
      <div className="flex gap-1 px-6 py-2">
        {MOCK_MEALS.map((m, i) => (
          <div
            key={m.id}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              background: kept.some((k) => k.id === m.id)
                ? 'oklch(0.72 0.19 155)'
                : dismissed.some((d) => d.id === m.id)
                  ? 'oklch(0.70 0.19 25)'
                  : i < MOCK_MEALS.length - deck.length
                    ? 'var(--muted)'
                    : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* card stack */}
      <div className="relative mx-auto flex-1 w-full max-w-sm px-4 py-4">
        {deck.length > 0 ? (
          <AnimatePresence>
            {deck
              .slice(0, 3)
              .reverse()
              .map((meal, i, arr) => (
                <SwipeCard
                  key={meal.id}
                  meal={meal}
                  onSwipe={handleSwipe}
                  isTop={i === arr.length - 1}
                />
              ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full flex-col items-center justify-center gap-4 text-center"
          >
            <span className="text-5xl">🎉</span>
            <h2 className="text-xl font-bold">You picked {kept.length} meals!</h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              {kept.length >= 5
                ? "That's a full week sorted. Nice work!"
                : 'Want to see more options?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLoadMore}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                More Suggestions
              </button>
              <button
                onClick={handleReset}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
              >
                Start Over
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* action buttons (tinder-style) */}
      {deck.length > 0 && (
        <div className="flex items-center justify-center gap-6 pb-8 pt-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('left')}
            className="flex size-16 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 shadow-sm active:bg-rose-50"
          >
            <X className="size-7" strokeWidth={2.5} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe('right')}
            className="flex size-20 items-center justify-center rounded-full border-2 border-emerald-200 bg-white text-emerald-500 shadow-lg active:bg-emerald-50"
          >
            <Heart className="size-8" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}

      {/* kept meals tray */}
      {kept.length > 0 && (
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Keeping:
            </span>
            {kept.map((m) => (
              <span
                key={m.id}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: m.color, color: 'oklch(0.2 0 0)' }}
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
