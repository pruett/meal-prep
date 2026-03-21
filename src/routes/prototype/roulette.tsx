import { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, Shuffle, ArrowLeft, Sparkles, ChefHat } from 'lucide-react'

export const Route = createFileRoute('/prototype/roulette')({
  component: RoulettePrototype,
})

const MOCK_MEALS = [
  {
    id: '1',
    name: 'Honey Garlic Salmon',
    description: 'Glazed salmon fillets with roasted broccoli and jasmine rice',
    time: '25 min',
    difficulty: 'Easy',
    ingredients: ['salmon', 'honey', 'garlic', 'broccoli', 'rice'],
    color: 'oklch(0.65 0.14 170)',
    emoji: '🐟',
  },
  {
    id: '2',
    name: 'One-Pot Tuscan Chicken',
    description: 'Creamy sun-dried tomato chicken with spinach and beans',
    time: '30 min',
    difficulty: 'Easy',
    ingredients: ['chicken', 'sun-dried tomatoes', 'spinach', 'white beans'],
    color: 'oklch(0.68 0.15 45)',
    emoji: '🍗',
  },
  {
    id: '3',
    name: 'Korean Beef Bowls',
    description: 'Sweet & spicy ground beef over rice with pickled veggies',
    time: '20 min',
    difficulty: 'Easy',
    ingredients: ['ground beef', 'gochujang', 'rice', 'cucumber'],
    color: 'oklch(0.62 0.17 20)',
    emoji: '🥩',
  },
  {
    id: '4',
    name: 'Lemon Herb Pasta',
    description: 'Light lemon cream sauce with fresh herbs and parmesan',
    time: '15 min',
    difficulty: 'Super Easy',
    ingredients: ['penne', 'lemon', 'cream', 'parmesan', 'basil'],
    color: 'oklch(0.78 0.11 95)',
    emoji: '🍝',
  },
  {
    id: '5',
    name: 'Sheet Pan Fajitas',
    description: 'Colorful bell peppers and chicken with warm tortillas',
    time: '25 min',
    difficulty: 'Easy',
    ingredients: ['chicken', 'bell peppers', 'onion', 'tortillas'],
    color: 'oklch(0.70 0.16 70)',
    emoji: '🌮',
  },
  {
    id: '6',
    name: 'Coconut Curry Shrimp',
    description: 'Creamy Thai coconut curry with shrimp and snap peas',
    time: '20 min',
    difficulty: 'Medium',
    ingredients: ['shrimp', 'coconut milk', 'curry paste', 'snap peas'],
    color: 'oklch(0.65 0.12 185)',
    emoji: '🍤',
  },
  {
    id: '7',
    name: 'BBQ Chicken Pizza',
    description: 'Flatbread pizza with BBQ chicken, red onion, and cilantro',
    time: '20 min',
    difficulty: 'Easy',
    ingredients: ['flatbread', 'chicken', 'BBQ sauce', 'mozzarella'],
    color: 'oklch(0.60 0.14 30)',
    emoji: '🍕',
  },
]

type Meal = (typeof MOCK_MEALS)[number]

function RoulettePrototype() {
  const [pool, setPool] = useState<Meal[]>([...MOCK_MEALS])
  const [current, setCurrent] = useState<Meal | null>(null)
  const [kept, setKept] = useState<Meal[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [revealKey, setRevealKey] = useState(0)

  const spin = useCallback(() => {
    if (pool.length === 0) return
    setIsSpinning(true)

    // animate through a few "slot" items quickly
    let count = 0
    const totalFlashes = 6
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length)
      setCurrent(pool[randomIndex]!)
      count++
      if (count >= totalFlashes) {
        clearInterval(interval)
        // land on first item in pool
        const chosen = pool[0]!
        setCurrent(chosen)
        setPool((prev) => prev.slice(1))
        setIsSpinning(false)
        setRevealKey((k) => k + 1)
      }
    }, 100)
  }, [pool])

  const handleKeep = useCallback(() => {
    if (!current) return
    setKept((prev) => [...prev, current])
    setCurrent(null)
  }, [current])

  const handleSkipAndSpin = useCallback(() => {
    setCurrent(null)
    // small delay before next spin for transition
    setTimeout(spin, 200)
  }, [spin])

  const handleReset = () => {
    setPool([...MOCK_MEALS])
    setCurrent(null)
    setKept([])
    setIsSpinning(false)
  }

  const isDone = pool.length === 0 && !current

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Link
          to="/prototype"
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <ChefHat className="size-4 text-muted-foreground" />
          {kept.length} meals kept
        </div>
      </div>

      {/* main area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <span className="text-6xl">🎰</span>
              <h2 className="text-2xl font-bold">All done!</h2>
              <p className="text-sm text-muted-foreground">
                You kept {kept.length} meals for the week
              </p>
              <button
                onClick={handleReset}
                className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Play Again
              </button>
            </motion.div>
          ) : !current && !isSpinning ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="text-7xl"
              >
                🎰
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Meal Roulette</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pool.length} meals waiting to be revealed
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.03 }}
                onClick={spin}
                className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg"
              >
                <Sparkles className="size-5" />
                Spin!
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key={`meal-${revealKey}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
              className="w-full max-w-sm"
              style={{ perspective: 1000 }}
            >
              {current && (
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                  {/* hero */}
                  <div
                    className="relative flex items-center justify-center py-12"
                    style={{ background: current.color }}
                  >
                    <motion.span
                      key={current.id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 180,
                        damping: 12,
                        delay: 0.1,
                      }}
                      className="text-[100px] drop-shadow-lg"
                    >
                      {current.emoji}
                    </motion.span>

                    {/* spinning overlay */}
                    {isSpinning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.5,
                            ease: 'linear',
                          }}
                        >
                          <Sparkles className="size-10 text-white" />
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* details */}
                  <motion.div
                    className="p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isSpinning ? 0.3 : 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-bold tracking-tight">
                        {current.name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {current.time}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {current.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {current.ingredients.map((ing) => (
                        <span
                          key={ing}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        {current.difficulty}
                      </span>
                    </div>
                  </motion.div>

                  {/* actions */}
                  {!isSpinning && (
                    <motion.div
                      className="flex gap-3 p-5 pt-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={handleSkipAndSpin}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-muted-foreground active:bg-muted"
                      >
                        <Shuffle className="size-4" />
                        Spin Again
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={handleKeep}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
                      >
                        <Heart className="size-4" />
                        Keep It!
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* remaining counter */}
      <div className="px-6 pb-2 text-center text-xs text-muted-foreground">
        {pool.length} suggestions remaining
      </div>

      {/* kept meals tray */}
      {kept.length > 0 && (
        <motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          className="border-t border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3 overflow-x-auto">
            {kept.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ background: m.color }}
                title={m.name}
              >
                <span className="text-xl">{m.emoji}</span>
              </motion.div>
            ))}
            <div className="shrink-0 pl-2 text-xs text-muted-foreground">
              {kept.length} kept
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
