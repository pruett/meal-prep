import { useState, useCallback, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, X, ChevronUp, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/prototype/stories')({
  component: StoriesPrototype,
})

const MOCK_MEALS = [
  {
    id: '1',
    name: 'Honey Garlic Salmon',
    description: 'Glazed salmon fillets with roasted broccoli and jasmine rice',
    time: '25 min',
    ingredients: ['salmon', 'honey', 'garlic', 'broccoli'],
    gradient: 'linear-gradient(145deg, oklch(0.55 0.15 180), oklch(0.35 0.12 200))',
    emoji: '🐟',
  },
  {
    id: '2',
    name: 'One-Pot Tuscan Chicken',
    description: 'Creamy sun-dried tomato chicken with spinach',
    time: '30 min',
    ingredients: ['chicken thighs', 'sun-dried tomatoes', 'spinach'],
    gradient: 'linear-gradient(145deg, oklch(0.60 0.16 40), oklch(0.40 0.14 25))',
    emoji: '🍗',
  },
  {
    id: '3',
    name: 'Korean Beef Bowls',
    description: 'Sweet & spicy ground beef over rice with pickled veggies',
    time: '20 min',
    ingredients: ['ground beef', 'gochujang', 'rice', 'cucumber'],
    gradient: 'linear-gradient(145deg, oklch(0.55 0.18 15), oklch(0.35 0.15 5))',
    emoji: '🥩',
  },
  {
    id: '4',
    name: 'Lemon Herb Pasta',
    description: 'Light lemon cream sauce with fresh herbs and parmesan',
    time: '15 min',
    ingredients: ['penne', 'lemon', 'cream', 'parmesan'],
    gradient: 'linear-gradient(145deg, oklch(0.70 0.12 95), oklch(0.50 0.10 105))',
    emoji: '🍝',
  },
  {
    id: '5',
    name: 'Sheet Pan Fajitas',
    description: 'Colorful bell peppers and chicken with warm tortillas',
    time: '25 min',
    ingredients: ['chicken', 'bell peppers', 'onion', 'tortillas'],
    gradient: 'linear-gradient(145deg, oklch(0.65 0.17 65), oklch(0.45 0.14 50))',
    emoji: '🌮',
  },
  {
    id: '6',
    name: 'Coconut Curry Shrimp',
    description: 'Creamy Thai coconut curry with shrimp and snap peas',
    time: '20 min',
    ingredients: ['shrimp', 'coconut milk', 'curry paste', 'snap peas'],
    gradient: 'linear-gradient(145deg, oklch(0.60 0.13 170), oklch(0.40 0.11 185))',
    emoji: '🍤',
  },
  {
    id: '7',
    name: 'BBQ Chicken Pizza',
    description: 'Flatbread pizza with BBQ chicken and red onion',
    time: '20 min',
    ingredients: ['flatbread', 'chicken', 'BBQ sauce', 'mozzarella'],
    gradient: 'linear-gradient(145deg, oklch(0.55 0.14 30), oklch(0.35 0.12 20))',
    emoji: '🍕',
  },
]

function StoriesPrototype() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [kept, setKept] = useState<Set<string>>(new Set())
  const [lastAction, setLastAction] = useState<'keep' | 'skip' | null>(null)
  const [isDone, setIsDone] = useState(false)
  const touchStartY = useRef(0)

  const meal = MOCK_MEALS[currentIndex]

  const advance = useCallback(() => {
    if (currentIndex < MOCK_MEALS.length - 1) {
      setCurrentIndex((i) => i + 1)
      setLastAction(null)
    } else {
      setIsDone(true)
    }
  }, [currentIndex])

  const handleKeep = useCallback(() => {
    if (!meal) return
    setKept((prev) => new Set(prev).add(meal.id))
    setLastAction('keep')
    setTimeout(advance, 400)
  }, [meal, advance])

  const handleSkip = useCallback(() => {
    if (!meal) return
    setLastAction('skip')
    setTimeout(advance, 300)
  }, [meal, advance])

  // tap zones: left third = go back, right third = skip
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const tapX = e.clientX - rect.left
      const third = rect.width / 3

      if (tapX < third && currentIndex > 0) {
        // go back
        setCurrentIndex((i) => i - 1)
        setLastAction(null)
      } else if (tapX > third * 2) {
        handleSkip()
      }
      // middle third does nothing (for details reading)
    },
    [currentIndex, handleSkip],
  )

  // swipe up to keep
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]!.clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0]!.clientY
    if (deltaY > 80) {
      handleKeep()
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setKept(new Set())
    setLastAction(null)
    setIsDone(false)
  }

  if (isDone) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-background p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-6xl"
        >
          ✨
        </motion.div>
        <h2 className="text-2xl font-bold">Week sorted!</h2>
        <p className="text-muted-foreground">
          You kept {kept.size} of {MOCK_MEALS.length} meals
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {MOCK_MEALS.filter((m) => kept.has(m.id)).map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl p-3 text-left"
              style={{ background: m.gradient }}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-sm font-semibold text-white">
                {m.name}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleReset}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
          >
            Start Over
          </button>
          <Link
            to="/prototype"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Back to Prototypes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* progress segments */}
      <div className="absolute left-0 right-0 top-0 z-30 flex gap-1 px-3 pt-3">
        {MOCK_MEALS.map((m, i) => (
          <div key={m.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{
                width:
                  i < currentIndex
                    ? '100%'
                    : i === currentIndex
                      ? '100%'
                      : '0%',
                background: kept.has(m.id)
                  ? 'oklch(0.80 0.18 155)'
                  : 'rgba(255,255,255,0.85)',
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* back button + counter */}
      <div className="absolute left-3 top-6 z-30 flex items-center gap-3">
        <Link
          to="/prototype"
          className="flex size-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>
      </div>
      <div className="absolute right-3 top-6 z-30">
        {kept.size > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-white backdrop-blur-sm"
          >
            <Heart className="size-3.5 fill-white" />
            <span className="text-xs font-semibold">{kept.size}</span>
          </motion.div>
        )}
      </div>

      {/* full-screen meal card */}
      <AnimatePresence mode="wait">
        {meal && (
          <motion.div
            key={meal.id}
            className="absolute inset-0 flex flex-col justify-end"
            style={{ background: meal.gradient }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            onClick={handleTap}
          >
            {/* big emoji hero */}
            <div className="flex flex-1 items-center justify-center">
              <motion.span
                className="text-[120px] drop-shadow-lg"
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 12,
                  delay: 0.1,
                }}
              >
                {meal.emoji}
              </motion.span>
            </div>

            {/* keep/skip flash */}
            <AnimatePresence>
              {lastAction === 'keep' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-emerald-500/30 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.2 }}
                    className="text-7xl"
                  >
                    ❤️
                  </motion.div>
                </motion.div>
              )}
              {lastAction === 'skip' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.2 }}
                    className="text-5xl opacity-60"
                  >
                    👋
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* info panel */}
            <motion.div
              className="relative z-10 rounded-t-3xl bg-gradient-to-t from-black/70 via-black/40 to-transparent px-6 pb-8 pt-16"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {meal.name}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                {meal.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  ⏱ {meal.time}
                </span>
                {meal.ingredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70"
                  >
                    {ing}
                  </span>
                ))}
              </div>

              {/* action buttons */}
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSkip()
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-sm font-medium text-white backdrop-blur-sm active:bg-white/20"
                >
                  <X className="size-5" />
                  Skip
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleKeep()
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-black active:bg-white/90"
                >
                  <Heart className="size-5" />
                  Keep It!
                </button>
              </div>

              {/* swipe up hint */}
              <motion.div
                className="mt-4 flex flex-col items-center text-white/40"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ChevronUp className="size-4" />
                <span className="text-[10px]">swipe up to keep</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
