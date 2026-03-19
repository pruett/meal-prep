import { useState, useCallback, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from 'motion/react'
import { Heart, X, ArrowLeft, Clock, RotateCcw, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/prototype/swipe-list')({
  component: SwipeListPrototype,
})

const MEAL_IMAGES = ['/meal1.png', '/meal2.png']

const MOCK_MEALS = [
  {
    id: '1',
    name: 'Honey Garlic Salmon',
    description: 'Glazed salmon fillets with roasted broccoli and jasmine rice',
    time: '25 min',
    tags: ['high protein', 'omega-3'],
    img: MEAL_IMAGES[0]!,
  },
  {
    id: '2',
    name: 'One-Pot Tuscan Chicken',
    description:
      'Creamy sun-dried tomato chicken with spinach and white beans',
    time: '30 min',
    tags: ['one-pot', 'comfort food'],
    img: MEAL_IMAGES[1]!,
  },
  {
    id: '3',
    name: 'Korean Beef Bowls',
    description: 'Sweet & spicy ground beef over rice with pickled veggies',
    time: '20 min',
    tags: ['kid-friendly', 'quick'],
    img: MEAL_IMAGES[0]!,
  },
  {
    id: '4',
    name: 'Lemon Herb Pasta',
    description: 'Light lemon cream sauce with fresh herbs and parmesan',
    time: '15 min',
    tags: ['vegetarian', 'quick'],
    img: MEAL_IMAGES[1]!,
  },
  {
    id: '5',
    name: 'Sheet Pan Fajitas',
    description: 'Colorful bell peppers and chicken with warm tortillas',
    time: '25 min',
    tags: ['sheet pan', 'family style'],
    img: MEAL_IMAGES[0]!,
  },
  {
    id: '6',
    name: 'Coconut Curry Shrimp',
    description: 'Creamy Thai coconut curry with shrimp and snap peas',
    time: '20 min',
    tags: ['thai', 'date night'],
    img: MEAL_IMAGES[1]!,
  },
  {
    id: '7',
    name: 'BBQ Chicken Pizza',
    description: 'Flatbread pizza with BBQ chicken, red onion, and cilantro',
    time: '20 min',
    tags: ['kid-friendly', 'fun'],
    img: MEAL_IMAGES[0]!,
  },
]

type Meal = (typeof MOCK_MEALS)[number]

// ────────────────────────────────────────────────
// Swipeable row — the core interaction
// ────────────────────────────────────────────────

const SWIPE_THRESHOLD = 100
const ACTION_FULL_THRESHOLD = 160

function SwipeRow({
  meal,
  onKeep,
  onDismiss,
}: {
  meal: Meal
  onKeep: () => void
  onDismiss: () => void
}) {
  const x = useMotionValue(0)
  const [swipeDirection, setSwipeDirection] = useState<
    'none' | 'right' | 'left'
  >('none')
  const [isTriggered, setIsTriggered] = useState(false)
  const acted = useRef(false)

  // track direction for background color
  useMotionValueEvent(x, 'change', (latest) => {
    if (acted.current) return
    if (latest > 20) {
      setSwipeDirection('right')
      setIsTriggered(latest > ACTION_FULL_THRESHOLD)
    } else if (latest < -20) {
      setSwipeDirection('left')
      setIsTriggered(latest < -ACTION_FULL_THRESHOLD)
    } else {
      setSwipeDirection('none')
      setIsTriggered(false)
    }
  })

  // background icon scale — grows as user approaches threshold
  const rightIconScale = useTransform(
    x,
    [0, SWIPE_THRESHOLD, ACTION_FULL_THRESHOLD],
    [0.6, 1, 1.3],
  )
  const leftIconScale = useTransform(
    x,
    [-ACTION_FULL_THRESHOLD, -SWIPE_THRESHOLD, 0],
    [1.3, 1, 0.6],
  )

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const combinedRight = info.offset.x + info.velocity.x * 0.15
      const combinedLeft = info.offset.x + info.velocity.x * 0.15

      if (combinedRight > SWIPE_THRESHOLD) {
        acted.current = true
        onKeep()
      } else if (combinedLeft < -SWIPE_THRESHOLD) {
        acted.current = true
        onDismiss()
      }
    },
    [onKeep, onDismiss],
  )

  return (
    <div className="relative overflow-hidden">
      {/* ── action backgrounds (always rendered, revealed by slide) ── */}

      {/* right swipe → keep (green) */}
      <div
        className="absolute inset-0 flex items-center px-5 transition-colors duration-150"
        style={{
          background:
            swipeDirection === 'right'
              ? isTriggered
                ? 'oklch(0.62 0.20 155)'
                : 'oklch(0.75 0.16 155)'
              : 'oklch(0.85 0.08 155)',
        }}
      >
        <motion.div
          className="flex items-center gap-2 text-white"
          style={{ scale: rightIconScale }}
        >
          <Heart
            className="size-6"
            fill={isTriggered && swipeDirection === 'right' ? 'white' : 'none'}
          />
          <span className="text-sm font-bold">
            {isTriggered && swipeDirection === 'right' ? 'Added!' : 'Keep'}
          </span>
        </motion.div>
      </div>

      {/* left swipe → dismiss (rose) */}
      <div
        className="absolute inset-0 flex items-center justify-end px-5 transition-colors duration-150"
        style={{
          background:
            swipeDirection === 'left'
              ? isTriggered
                ? 'oklch(0.55 0.22 25)'
                : 'oklch(0.68 0.18 25)'
              : 'oklch(0.82 0.10 25)',
        }}
      >
        <motion.div
          className="flex items-center gap-2 text-white"
          style={{ scale: leftIconScale }}
        >
          <span className="text-sm font-bold">
            {isTriggered && swipeDirection === 'left' ? 'Gone!' : 'Nope'}
          </span>
          <X className="size-6" />
        </motion.div>
      </div>

      {/* ── the actual card content (slides over the background) ── */}
      <motion.div
        className="relative z-10 flex cursor-grab items-stretch gap-0 bg-card active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.45}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.99 }}
      >
        {/* meal photo */}
        <div className="w-24 shrink-0 sm:w-28">
          <img
            src={meal.img}
            alt={meal.name}
            className="size-full object-cover"
          />
        </div>

        {/* meal info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3.5">
          <h3 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
            {meal.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {meal.description}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {meal.time}
            </span>
            {meal.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────

function SwipeListPrototype() {
  const [pending, setPending] = useState<Meal[]>([...MOCK_MEALS])
  const [kept, setKept] = useState<Meal[]>([])
  const [dismissed, setDismissed] = useState<Meal[]>([])

  const handleKeep = useCallback(
    (meal: Meal) => {
      setPending((p) => p.filter((m) => m.id !== meal.id))
      setKept((k) => [...k, meal])
    },
    [],
  )

  const handleDismiss = useCallback(
    (meal: Meal) => {
      setPending((p) => p.filter((m) => m.id !== meal.id))
      setDismissed((d) => [...d, meal])
    },
    [],
  )

  const handleReset = () => {
    setPending([...MOCK_MEALS])
    setKept([])
    setDismissed([])
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* ── header ── */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <Link
          to="/prototype"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <button onClick={handleReset} className="text-muted-foreground">
          <RotateCcw className="size-4" />
        </button>
      </div>

      {/* ── title + progress ── */}
      <div className="px-4 pb-2 pt-1">
        <h1 className="text-lg font-bold tracking-tight">This week's picks</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            {kept.length} kept
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-rose-400" />
            {dismissed.length} dismissed
          </span>
          <span className="ml-auto">{pending.length} remaining</span>
        </div>
        {/* progress bar */}
        <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-l-full bg-emerald-500"
            animate={{
              width: `${(kept.length / MOCK_MEALS.length) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <motion.div
            className="h-full bg-rose-400"
            animate={{
              width: `${(dismissed.length / MOCK_MEALS.length) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <div className="h-full flex-1 bg-muted" />
        </div>
      </div>

      {/* ── swipe hint (shows briefly) ── */}
      {pending.length === MOCK_MEALS.length && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mx-4 mb-2 flex items-center justify-center gap-4 rounded-xl bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-600">→</span> Swipe right to keep
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            Swipe left to dismiss <span className="text-rose-500">←</span>
          </span>
        </motion.div>
      )}

      {/* ── meal list ── */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {pending.map((meal) => (
              <motion.div
                key={meal.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginBottom: 0,
                  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                }}
                transition={{
                  layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                }}
              >
                <SwipeRow
                  meal={meal}
                  onKeep={() => handleKeep(meal)}
                  onDismiss={() => handleDismiss(meal)}
                />
                <div className="h-px bg-border" />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* generate more */}
          {pending.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-12 text-center"
            >
              <span className="text-4xl">✨</span>
              <div>
                <h2 className="text-lg font-bold">All reviewed!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You kept {kept.length} meal{kept.length !== 1 ? 's' : ''} for
                  the week
                </p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Sparkles className="size-4" />
                Get More Suggestions
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── kept meals tray ── */}
      <AnimatePresence>
        {kept.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="border-t border-border bg-card px-4 py-3"
          >
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Your week
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {kept.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5"
                >
                  <img
                    src={m.img}
                    alt={m.name}
                    className="size-7 rounded-lg object-cover"
                  />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {m.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
