import * as React from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react"
import { Heart, X } from "lucide-react"

import { cn } from "~/lib/utils"
import { Item } from "~/components/ui/item"
import { Separator } from "~/components/ui/separator"

// ────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────

type SwipeListContextValue<T = unknown> = {
  items: T[]
  pending: T[]
  kept: T[]
  dismissed: T[]
  total: number
  keep: (item: T) => void
  dismiss: (item: T) => void
  reset: () => void
  getItemId: (item: T) => string
  swipeThreshold: number
  swipeFullThreshold: number
}

const SwipeListContext =
  React.createContext<SwipeListContextValue | null>(null)

function useSwipeList<T = unknown>() {
  const ctx = React.useContext(SwipeListContext)
  if (!ctx) {
    throw new Error("SwipeList components must be used within <SwipeList>")
  }
  return ctx as SwipeListContextValue<T>
}

// ────────────────────────────────────────────────
// SwipeList
// ────────────────────────────────────────────────

type SwipeListProps<T> = React.ComponentProps<"div"> & {
  items: T[]
  getItemId: (item: T) => string
  swipeThreshold?: number
  swipeFullThreshold?: number
  onKeep?: (item: T) => void
  onDismiss?: (item: T) => void
  onReset?: () => void
}

function SwipeList<T>({
  items,
  getItemId,
  swipeThreshold = 100,
  swipeFullThreshold = 160,
  onKeep,
  onDismiss,
  onReset,
  className,
  children,
  ...props
}: SwipeListProps<T>) {
  const [kept, setKept] = React.useState<T[]>([])
  const [dismissed, setDismissed] = React.useState<T[]>([])

  const keptIds = React.useMemo(
    () => new Set(kept.map(getItemId)),
    [kept, getItemId],
  )
  const dismissedIds = React.useMemo(
    () => new Set(dismissed.map(getItemId)),
    [dismissed, getItemId],
  )

  const pending = React.useMemo(
    () =>
      items.filter((item) => {
        const id = getItemId(item)
        return !keptIds.has(id) && !dismissedIds.has(id)
      }),
    [items, keptIds, dismissedIds, getItemId],
  )

  const keep = React.useCallback(
    (item: T) => {
      setKept((prev) => [...prev, item])
      onKeep?.(item)
    },
    [onKeep],
  )

  const dismiss = React.useCallback(
    (item: T) => {
      setDismissed((prev) => [...prev, item])
      onDismiss?.(item)
    },
    [onDismiss],
  )

  const reset = React.useCallback(() => {
    setKept([])
    setDismissed([])
    onReset?.()
  }, [onReset])

  const contextValue = React.useMemo<SwipeListContextValue>(
    () => ({
      items: items as unknown[],
      pending: pending as unknown[],
      kept: kept as unknown[],
      dismissed: dismissed as unknown[],
      total: pending.length + kept.length + dismissed.length,
      keep: keep as (item: unknown) => void,
      dismiss: dismiss as (item: unknown) => void,
      reset,
      getItemId: getItemId as (item: unknown) => string,
      swipeThreshold,
      swipeFullThreshold,
    }),
    [
      items,
      pending,
      kept,
      dismissed,
      keep,
      dismiss,
      reset,
      getItemId,
      swipeThreshold,
      swipeFullThreshold,
    ],
  )

  return (
    <SwipeListContext.Provider value={contextValue}>
      <div
        data-slot="swipe-list"
        className={cn("flex flex-col", className)}
        {...props}
      >
        {children}
      </div>
    </SwipeListContext.Provider>
  )
}

// ────────────────────────────────────────────────
// SwipeListHeader
// ────────────────────────────────────────────────

function SwipeListHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-header"
      className={cn(
        "flex items-center justify-between gap-2 px-4 pb-1 pt-4",
        className,
      )}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────
// SwipeListTitle
// ────────────────────────────────────────────────

function SwipeListTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-title"
      className={cn("text-lg font-bold tracking-tight", className)}
      {...props}
    />
  )
}

// ────────────────────────────────────────────────
// SwipeListProgress
// ────────────────────────────────────────────────

function SwipeListProgress({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { kept, dismissed, total } = useSwipeList()

  return (
    <div
      data-slot="swipe-list-progress"
      className={cn("px-4 pb-2 pt-1", className)}
      {...props}
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          {kept.length} kept
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-rose-400" />
          {dismissed.length} dismissed
        </span>
        <span className="ml-auto">
          {total - kept.length - dismissed.length} remaining
        </span>
      </div>
      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-l-full bg-emerald-500"
          animate={{
            width: `${total > 0 ? (kept.length / total) * 100 : 0}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div
          className="h-full bg-rose-400"
          animate={{
            width: `${total > 0 ? (dismissed.length / total) * 100 : 0}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="h-full flex-1 bg-muted" />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// SwipeListHint
// ────────────────────────────────────────────────

function SwipeListHint({ className }: { className?: string }) {
  const { pending, total } = useSwipeList()

  if (pending.length !== total) return null

  return (
    <motion.div
      data-slot="swipe-list-hint"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "mx-4 mb-2 flex items-center justify-center gap-4 rounded-xl bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-emerald-600">&rarr;</span> Swipe right to keep
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        Swipe left to dismiss{" "}
        <span className="text-rose-500">&larr;</span>
      </span>
    </motion.div>
  )
}

// ────────────────────────────────────────────────
// SwipeListContent
// ────────────────────────────────────────────────

function SwipeListContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-content"
      className={cn("flex-1 overflow-y-auto pb-4", className)}
      {...props}
    >
      <div className="flex flex-col">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// SwipeListCard
// ────────────────────────────────────────────────

const SWIPE_EXIT_EASE = [0.22, 1, 0.36, 1] as const

type SwipeListCardProps = {
  value: unknown
  keepLabel?: string
  keepTriggeredLabel?: string
  keepIcon?: React.ReactNode
  dismissLabel?: string
  dismissTriggeredLabel?: string
  dismissIcon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

function SwipeListCard({
  value,
  keepLabel = "Keep",
  keepTriggeredLabel = "Added!",
  keepIcon,
  dismissLabel = "Nope",
  dismissTriggeredLabel = "Gone!",
  dismissIcon,
  className,
  children,
}: SwipeListCardProps) {
  const { keep, dismiss, swipeThreshold, swipeFullThreshold } =
    useSwipeList()

  const x = useMotionValue(0)
  const [swipeDirection, setSwipeDirection] = React.useState<
    "none" | "right" | "left"
  >("none")
  const [isTriggered, setIsTriggered] = React.useState(false)
  const acted = React.useRef(false)

  useMotionValueEvent(x, "change", (latest) => {
    if (acted.current) return
    if (latest > 20) {
      setSwipeDirection("right")
      setIsTriggered(latest > swipeFullThreshold)
    } else if (latest < -20) {
      setSwipeDirection("left")
      setIsTriggered(latest < -swipeFullThreshold)
    } else {
      setSwipeDirection("none")
      setIsTriggered(false)
    }
  })

  const rightIconScale = useTransform(
    x,
    [0, swipeThreshold, swipeFullThreshold],
    [0.6, 1, 1.3],
  )
  const leftIconScale = useTransform(
    x,
    [-swipeFullThreshold, -swipeThreshold, 0],
    [1.3, 1, 0.6],
  )

  const handleDragEnd = React.useCallback(
    (
      _: unknown,
      info: { offset: { x: number }; velocity: { x: number } },
    ) => {
      const combined = info.offset.x + info.velocity.x * 0.15
      if (combined > swipeThreshold) {
        acted.current = true
        keep(value)
      } else if (combined < -swipeThreshold) {
        acted.current = true
        dismiss(value)
      }
    },
    [keep, dismiss, value, swipeThreshold],
  )

  return (
    <motion.div
      data-slot="swipe-list-card"
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.25, ease: SWIPE_EXIT_EASE },
      }}
      transition={{
        layout: { duration: 0.3, ease: SWIPE_EXIT_EASE },
      }}
      className={className}
    >
      <div className="relative overflow-hidden">
        {/* keep background (right swipe → green) */}
        <div
          className="absolute inset-0 flex items-center px-5 transition-colors duration-150"
          style={{
            background:
              swipeDirection === "right"
                ? isTriggered
                  ? "oklch(0.62 0.20 155)"
                  : "oklch(0.75 0.16 155)"
                : "oklch(0.85 0.08 155)",
          }}
        >
          <motion.div
            className="flex items-center gap-2 text-white"
            style={{ scale: rightIconScale }}
          >
            {keepIcon ?? (
              <Heart
                className="size-6"
                fill={
                  isTriggered && swipeDirection === "right"
                    ? "white"
                    : "none"
                }
              />
            )}
            <span className="text-sm font-bold">
              {isTriggered && swipeDirection === "right"
                ? keepTriggeredLabel
                : keepLabel}
            </span>
          </motion.div>
        </div>

        {/* dismiss background (left swipe → rose) */}
        <div
          className="absolute inset-0 flex items-center justify-end px-5 transition-colors duration-150"
          style={{
            background:
              swipeDirection === "left"
                ? isTriggered
                  ? "oklch(0.55 0.22 25)"
                  : "oklch(0.68 0.18 25)"
                : "oklch(0.82 0.10 25)",
          }}
        >
          <motion.div
            className="flex items-center gap-2 text-white"
            style={{ scale: leftIconScale }}
          >
            <span className="text-sm font-bold">
              {isTriggered && swipeDirection === "left"
                ? dismissTriggeredLabel
                : dismissLabel}
            </span>
            {dismissIcon ?? <X className="size-6" />}
          </motion.div>
        </div>

        {/* draggable card — wraps Item for structure */}
        <motion.div
          className="relative z-10 cursor-grab bg-card active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.45}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.99 }}
        >
          <Item
            variant="default"
            size="sm"
            className="rounded-none border-transparent"
          >
            {children}
          </Item>
        </motion.div>
      </div>
      <Separator className="my-0" />
    </motion.div>
  )
}

// ────────────────────────────────────────────────
// SwipeListTray
// ────────────────────────────────────────────────

type SwipeListTrayProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem: (item: any) => React.ReactNode
  label?: string
  className?: string
}

function SwipeListTray({
  renderItem,
  label = "Your picks",
  className,
}: SwipeListTrayProps) {
  const { kept, getItemId } = useSwipeList()

  return (
    <AnimatePresence>
      {kept.length > 0 && (
        <motion.div
          data-slot="swipe-list-tray"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className={cn(
            "border-t border-border bg-card px-4 py-3",
            className,
          )}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {kept.map((item) => (
              <motion.div
                key={getItemId(item)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
              >
                {renderItem(item)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ────────────────────────────────────────────────
// SwipeListEmpty
// ────────────────────────────────────────────────

function SwipeListEmpty({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { pending } = useSwipeList()

  if (pending.length > 0) return null

  return (
    <motion.div
      data-slot="swipe-list-empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center gap-4 py-12 text-center",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

// ────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────

export {
  SwipeList,
  SwipeListHeader,
  SwipeListTitle,
  SwipeListProgress,
  SwipeListHint,
  SwipeListContent,
  SwipeListCard,
  SwipeListTray,
  SwipeListEmpty,
  useSwipeList,
}
