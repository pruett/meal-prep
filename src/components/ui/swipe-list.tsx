import * as React from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

import { cn } from "~/lib/utils";
import { Item } from "~/components/ui/item";
import { Skeleton } from "~/components/ui/skeleton";

// ────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────

type Identifiable = { id: string } | { _id: string };

function getItemId(item: Identifiable): string {
  return "_id" in item ? item._id : item.id;
}

type SwipeListEvent = {
  type: "swipeRight" | "swipeLeft";
  item: unknown;
  at: number;
};

type SwipeListTriggers<T = unknown> = {
  onSwipeRight?: (item: T) => void;
  onSwipeLeft?: (item: T) => void;
};

type SwipeListContextValue<T = unknown> = {
  items: T[];
  remaining: T[];
  swipedRight: T[];
  swipedLeft: T[];
  total: number;
  onSwipeRight: (item: T) => void;
  onSwipeLeft: (item: T) => void;
  swipeThreshold: number;
  lastEvent: SwipeListEvent | null;
};

const SwipeListContext = React.createContext<SwipeListContextValue | null>(
  null,
);

function useSwipeList<T = unknown>() {
  const ctx = React.useContext(SwipeListContext);
  if (!ctx) {
    throw new Error(
      "SwipeList components must be used within <SwipeListProvider>",
    );
  }
  return ctx as SwipeListContextValue<T>;
}

// ────────────────────────────────────────────────
// SwipeListProvider
// ────────────────────────────────────────────────

type SwipeListProviderProps<T extends Identifiable> =
  React.ComponentProps<"div"> & {
    items: T[];
    swipeThreshold?: number;
    loadMoreThreshold?: number;
    onSwipeRight?: (item: T) => void;
    onSwipeLeft?: (item: T) => void;
    onLoadMore?: () => void;
    triggers?: SwipeListTriggers<T>;
  };

function SwipeListProvider<T extends Identifiable>({
  items,
  swipeThreshold = 100,
  loadMoreThreshold = 3,
  onSwipeRight,
  onSwipeLeft,
  onLoadMore,
  triggers,
  className,
  children,
  ...props
}: SwipeListProviderProps<T>) {
  const [swipedRight, setSwipedRight] = React.useState<T[]>([]);
  const [swipedLeft, setSwipedLeft] = React.useState<T[]>([]);
  const [lastEvent, setLastEvent] = React.useState<SwipeListEvent | null>(null);

  // Destructure to stable refs — avoids useCallback churn from inline triggers objects
  const triggerSwipeRight = triggers?.onSwipeRight;
  const triggerSwipeLeft = triggers?.onSwipeLeft;

  const rightIds = React.useMemo(
    () => new Set(swipedRight.map(getItemId)),
    [swipedRight],
  );
  const leftIds = React.useMemo(
    () => new Set(swipedLeft.map(getItemId)),
    [swipedLeft],
  );

  const remaining = React.useMemo(
    () =>
      items.filter(
        (item) =>
          !rightIds.has(getItemId(item)) && !leftIds.has(getItemId(item)),
      ),
    [items, rightIds, leftIds],
  );

  const swipeRight = React.useCallback(
    (item: T) => {
      setSwipedRight((prev) => [...prev, item]);
      setLastEvent({ type: "swipeRight", item, at: Date.now() });
      onSwipeRight?.(item);
      triggerSwipeRight?.(item);
    },
    [onSwipeRight, triggerSwipeRight],
  );

  const swipeLeft = React.useCallback(
    (item: T) => {
      setSwipedLeft((prev) => [...prev, item]);
      setLastEvent({ type: "swipeLeft", item, at: Date.now() });
      onSwipeLeft?.(item);
      triggerSwipeLeft?.(item);
    },
    [onSwipeLeft, triggerSwipeLeft],
  );

  React.useEffect(() => {
    if (remaining.length > 0 && remaining.length <= loadMoreThreshold) {
      onLoadMore?.();
    }
  }, [remaining.length, loadMoreThreshold, onLoadMore]);

  const contextValue = React.useMemo<SwipeListContextValue>(
    () => ({
      items: items as unknown[],
      remaining: remaining as unknown[],
      swipedRight: swipedRight as unknown[],
      swipedLeft: swipedLeft as unknown[],
      total: remaining.length + swipedRight.length + swipedLeft.length,
      onSwipeRight: swipeRight as (item: unknown) => void,
      onSwipeLeft: swipeLeft as (item: unknown) => void,
      swipeThreshold,
      lastEvent,
    }),
    [
      items,
      remaining,
      swipedRight,
      swipedLeft,
      swipeRight,
      swipeLeft,
      swipeThreshold,
      lastEvent,
    ],
  );

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
  );
}

// ────────────────────────────────────────────────
// SwipeListHeader
// ────────────────────────────────────────────────

function SwipeListHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-header"
      className={cn(
        "flex items-center justify-between gap-2 px-4 pb-1 pt-4",
        className,
      )}
      {...props}
    />
  );
}

// ────────────────────────────────────────────────
// SwipeListTitle
// ────────────────────────────────────────────────

function SwipeListTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-title"
      className={cn("text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

// ────────────────────────────────────────────────
// SwipeListProgress
// ────────────────────────────────────────────────

function SwipeListProgress({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { swipedRight, swipedLeft, total } = useSwipeList();

  return (
    <div
      data-slot="swipe-list-progress"
      className={cn("px-4 pb-2 pt-1", className)}
      {...props}
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          {swipedRight.length} kept
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-rose-400" />
          {swipedLeft.length} dismissed
        </span>
        <span className="ml-auto">
          {total - swipedRight.length - swipedLeft.length} remaining
        </span>
      </div>
      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-l-full bg-emerald-500"
          animate={{
            width: `${total > 0 ? (swipedRight.length / total) * 100 : 0}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div
          className="h-full bg-rose-400"
          animate={{
            width: `${total > 0 ? (swipedLeft.length / total) * 100 : 0}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="h-full flex-1 bg-muted" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// SwipeListHint
// ────────────────────────────────────────────────

function SwipeListHint({ className }: { className?: string }) {
  const { remaining, total } = useSwipeList();

  if (remaining.length !== total) return null;

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
        Swipe left to dismiss <span className="text-rose-500">&larr;</span>
      </span>
    </motion.div>
  );
}

// ────────────────────────────────────────────────
// SwipeList
// ────────────────────────────────────────────────

function SwipeList({
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
  );
}

// ────────────────────────────────────────────────
// SwipeListCard Context
// ────────────────────────────────────────────────

type SwipeListCardContextValue = {
  x: MotionValue<number>;
  swipeDirection: "none" | "right" | "left";
  isTriggered: boolean;
  handleDragEnd: (
    event: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => void;
};

const SwipeListCardContext =
  React.createContext<SwipeListCardContextValue | null>(null);

function useSwipeListCard() {
  const ctx = React.useContext(SwipeListCardContext);
  if (!ctx) {
    throw new Error(
      "SwipeListCard sub-components must be used within SwipeListCard",
    );
  }
  return ctx;
}

// ────────────────────────────────────────────────
// Spring configs
// ────────────────────────────────────────────────

const DRAG_SPRING = { bounceStiffness: 500, bounceDamping: 25 };
const EXIT_SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const REFLOW_SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

// ────────────────────────────────────────────────
// SwipeListCard
// ────────────────────────────────────────────────

type SwipeListCardProps = {
  value: unknown;
  className?: string;
  children?: React.ReactNode;
};

function SwipeListCard({ value, className, children }: SwipeListCardProps) {
  const { onSwipeRight, onSwipeLeft, swipeThreshold } = useSwipeList();

  const x = useMotionValue(0);
  const [swipeDirection, setSwipeDirection] = React.useState<
    "none" | "right" | "left"
  >("none");
  const [isTriggered, setIsTriggered] = React.useState(false);
  const acted = React.useRef(false);

  useMotionValueEvent(x, "change", (latest) => {
    if (acted.current) return;
    if (latest > 0) {
      setSwipeDirection("right");
      setIsTriggered(latest > swipeThreshold);
    } else if (latest < 0) {
      setSwipeDirection("left");
      setIsTriggered(latest < -swipeThreshold);
    } else {
      setSwipeDirection("none");
      setIsTriggered(false);
    }
  });

  const handleDragEnd = React.useCallback(() => {
    if (!isTriggered) return;
    if (swipeDirection === "right") {
      acted.current = true;
      onSwipeRight(value);
    } else if (swipeDirection === "left") {
      acted.current = true;
      onSwipeLeft(value);
    }
  }, [isTriggered, swipeDirection, onSwipeRight, onSwipeLeft, value]);

  const cardContext = React.useMemo<SwipeListCardContextValue>(
    () => ({
      x,
      swipeDirection,
      isTriggered,
      handleDragEnd,
    }),
    [x, swipeDirection, isTriggered, handleDragEnd],
  );

  return (
    <SwipeListCardContext.Provider value={cardContext}>
      <motion.div
        data-slot="swipe-list-card"
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{
          opacity: 0,
          height: 0,
          marginBottom: 0,
        }}
        transition={{
          layout: REFLOW_SPRING,
          height: EXIT_SPRING,
          opacity: { duration: 0.2 },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </SwipeListCardContext.Provider>
  );
}

// ────────────────────────────────────────────────
// SwipeListStage
// ────────────────────────────────────────────────

type SwipeSlotState = { active: boolean; triggered: boolean };

type SwipeListStageProps = React.ComponentProps<"div"> & {
  renderSwipeRight?: (state: SwipeSlotState) => React.ReactNode;
  renderSwipeLeft?: (state: SwipeSlotState) => React.ReactNode;
};

function SwipeRightIcon({ triggered }: SwipeSlotState) {
  return (
    <motion.div
      className="text-white"
      animate={{ scale: triggered ? 1.4 : 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <ThumbsUp className="size-4" />
    </motion.div>
  );
}

function SwipeLeftIcon({ triggered }: SwipeSlotState) {
  return (
    <motion.div
      className="text-white"
      animate={{ scale: triggered ? 1.4 : 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <ThumbsDown className="size-4" />
    </motion.div>
  );
}

function SwipeListStage({
  renderSwipeRight = (state) => <SwipeRightIcon {...state} />,
  renderSwipeLeft = (state) => <SwipeLeftIcon {...state} />,
  className,
  children,
  ...props
}: SwipeListStageProps) {
  const { swipeDirection, isTriggered } = useSwipeListCard();

  const isRightActive = swipeDirection === "right";
  const isRightTriggered = isRightActive && isTriggered;
  const rightState = isRightTriggered
    ? "triggered"
    : isRightActive
      ? "active"
      : "idle";

  const isLeftActive = swipeDirection === "left";
  const isLeftTriggered = isLeftActive && isTriggered;
  const leftState = isLeftTriggered
    ? "triggered"
    : isLeftActive
      ? "active"
      : "idle";

  return (
    <div
      data-slot="swipe-list-card-stage"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <div
        data-slot="swipe-list-card-stage-right"
        data-state={rightState}
        className="absolute inset-0 flex items-center px-5 transition-colors duration-150 bg-muted data-[state=active]:z-1 data-[state=active]:bg-[oklch(0.75_0.16_155)] data-[state=triggered]:z-1 data-[state=triggered]:bg-[oklch(0.62_0.20_155)]"
      >
        {renderSwipeRight({
          active: isRightActive,
          triggered: isRightTriggered,
        })}
      </div>
      <div
        data-slot="swipe-list-card-stage-left"
        data-state={leftState}
        className="absolute inset-0 flex items-center justify-end px-5 transition-colors duration-150 bg-muted data-[state=active]:bg-[oklch(0.68_0.18_25)] data-[state=triggered]:bg-[oklch(0.55_0.22_25)]"
      >
        {renderSwipeLeft({
          active: isLeftActive,
          triggered: isLeftTriggered,
        })}
      </div>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────
// SwipeListCardItem
// ────────────────────────────────────────────────

function SwipeListCardItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Item>) {
  const { x, handleDragEnd } = useSwipeListCard();

  return (
    <motion.div
      data-slot="swipe-list-card-item"
      className="relative z-10 cursor-grab bg-card active:cursor-grabbing"
      style={{ x }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.45}
      dragTransition={DRAG_SPRING}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.99 }}
    >
      <Item
        className={cn(
          "rounded-none border-transparent p-0 shadow-sm",
          className,
        )}
        {...props}
      >
        {children}
      </Item>
    </motion.div>
  );
}

// ────────────────────────────────────────────────
// SwipeListTray
// ────────────────────────────────────────────────

type SwipeListTrayProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem: (item: any) => React.ReactNode;
  label?: string;
  className?: string;
};

function SwipeListTray({
  renderItem,
  label = "Your picks",
  className,
}: SwipeListTrayProps) {
  const { swipedRight } = useSwipeList();

  return (
    <AnimatePresence>
      {swipedRight.length > 0 && (
        <motion.div
          data-slot="swipe-list-tray"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className={cn("border-t border-border bg-card px-4 py-3", className)}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {swipedRight.map((item) => (
              <motion.div
                key={getItemId(item as Identifiable)}
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
  );
}

// ────────────────────────────────────────────────
// SwipeListEmpty
// ────────────────────────────────────────────────

function SwipeListEmpty({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { remaining } = useSwipeList();

  if (remaining.length > 0) return null;

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
  );
}

// ────────────────────────────────────────────────
// SwipeListCardSkeleton
// ────────────────────────────────────────────────

function SwipeListCardSkeleton({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-card-skeleton"
      className={cn(
        "flex w-full items-center bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────
// SwipeListProgressSkeleton
// ────────────────────────────────────────────────

function SwipeListProgressSkeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="swipe-list-progress-skeleton"
      className={cn("px-4 pb-2 pt-1", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-3.5 w-14 rounded-md" />
        <Skeleton className="h-3.5 w-18 rounded-md" />
        <Skeleton className="ml-auto h-3.5 w-16 rounded-md" />
      </div>
      <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
    </div>
  );
}

// ────────────────────────────────────────────────
// SwipeListConfetti
// ────────────────────────────────────────────────

type ConfettiParticle = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  rounded: boolean;
};

const CONFETTI_COLORS = [
  "#34d399",
  "#fbbf24",
  "#818cf8",
  "#f472b6",
  "#38bdf8",
  "#a78bfa",
  "#fb923c",
];

function generateParticles(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 260,
    y: Math.random() * -180 - 30,
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    rounded: Math.random() > 0.5,
  }));
}

function SwipeListConfetti({
  count = 16,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const { lastEvent } = useSwipeList();
  const [bursts, setBursts] = React.useState<
    { id: number; particles: ConfettiParticle[] }[]
  >([]);

  React.useEffect(() => {
    if (!lastEvent || lastEvent.type !== "swipeRight") return;

    const id = lastEvent.at;
    setBursts((prev) => [...prev, { id, particles: generateParticles(count) }]);

    const timer = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 900);

    return () => clearTimeout(timer);
  }, [lastEvent, count]);

  if (bursts.length === 0) return null;

  return (
    <div
      data-slot="swipe-list-confetti"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute inset-0 flex items-center justify-center"
        >
          {burst.particles.map((p, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute size-2",
                p.rounded ? "rounded-full" : "rounded-sm",
              )}
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: p.scale,
                rotate: p.rotation,
                opacity: 0,
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────

export {
  SwipeListProvider,
  SwipeListHeader,
  SwipeListTitle,
  SwipeListProgress,
  SwipeListProgressSkeleton,
  SwipeListHint,
  SwipeList,
  SwipeListCard,
  SwipeListCardSkeleton,
  SwipeListStage,
  SwipeListCardItem,
  SwipeListTray,
  SwipeListEmpty,
  SwipeListConfetti,
  useSwipeList,
  useSwipeListCard,
};

export type { SwipeListEvent, SwipeListTriggers };
