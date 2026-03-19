import { createContext, useContext } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useMutation } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { CheckCircle, X, XCircle } from '@phosphor-icons/react'
import { MealSkeleton } from './meal-skeleton'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Item,
  ItemContent,
  ItemTitle,
} from '~/components/ui/item'
import { cn } from '~/lib/utils'
import { useMealImage } from '~/hooks/use-meal-image'

const MEAL_SUGGESTION_ITEM_WIDTH = 'w-[280px] shrink-0 snap-start'
const MEAL_SUGGESTION_EASE = [0.22, 1, 0.36, 1] as const

type MealSuggestionContextValue = {
  meal: Doc<'meals'>
  showActions: boolean
  isRegenerating: boolean
  isAccepted: boolean
  isRejected: boolean
  handleAccept: () => Promise<void>
  handleReject: () => Promise<void>
}

const MealSuggestionContext = createContext<MealSuggestionContextValue | null>(
  null,
)

interface MealSuggestionProviderProps {
  meal: Doc<'meals'>
  children: ReactNode
  showActions?: boolean
  isRegenerating?: boolean
  onStatusChange?: (status: Doc<'meals'>['status']) => void | Promise<void>
}

export function MealSuggestionProvider({
  meal,
  children,
  showActions = false,
  isRegenerating = false,
  onStatusChange,
}: MealSuggestionProviderProps) {
  const updateStatus = useMutation(api.meals.updateStatus)

  const isAccepted = meal.status === 'accepted'
  const isRejected = meal.status === 'rejected'

  const handleAccept = async () => {
    try {
      const status = isAccepted ? 'pending' : 'accepted'

      if (onStatusChange) {
        await onStatusChange(status)
        return
      }

      await updateStatus({ id: meal._id, status })
    } catch {
      toast.error('Failed to update meal status')
    }
  }

  const handleReject = async () => {
    try {
      const status = isRejected ? 'pending' : 'rejected'

      if (onStatusChange) {
        await onStatusChange(status)
        return
      }

      await updateStatus({ id: meal._id, status })
    } catch {
      toast.error('Failed to update meal status')
    }
  }

  return (
    <MealSuggestionContext.Provider
      value={{
        meal,
        showActions,
        isRegenerating,
        isAccepted,
        isRejected,
        handleAccept,
        handleReject,
      }}
    >
      {children}
    </MealSuggestionContext.Provider>
  )
}

function useMealSuggestion() {
  const context = useContext(MealSuggestionContext)

  if (!context) {
    throw new Error(
      'Meal suggestion components must be used within MealSuggestionProvider',
    )
  }

  return context
}

export function MealSuggestionViewport({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="meal-suggestion-viewport"
      className={cn(
        'flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none',
        className,
      )}
      {...props}
    />
  )
}

interface MealSuggestionItemProps extends ComponentProps<'div'> {
  index: number
  children: ReactNode
  className?: string
}

export function MealSuggestionItem({
  index,
  className,
  children,
}: MealSuggestionItemProps) {
  const direction = index % 2 === 0 ? 1 : -1

  return (
    <motion.div
      data-slot="meal-suggestion-item"
      layout="position"
      exit={{
        x: 28 * direction,
        y: 104,
        rotate: 10 * direction,
        opacity: 0,
        transition: {
          duration: 0.45,
          ease: MEAL_SUGGESTION_EASE,
        },
      }}
      transition={{
        layout: {
          duration: 0.25,
          ease: MEAL_SUGGESTION_EASE,
        },
      }}
      className={cn(
        MEAL_SUGGESTION_ITEM_WIDTH,
        'will-change-transform',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function MealSuggestionStatus() {
  const { isAccepted, isRejected } = useMealSuggestion()

  if (!isAccepted && !isRejected) return null

  return isAccepted ? (
    <CheckCircle
      data-slot="meal-suggestion-status"
      className="absolute right-3 top-3 size-5 text-primary drop-shadow-sm"
    />
  ) : (
    <XCircle
      data-slot="meal-suggestion-status"
      className="absolute right-3 top-3 size-5 text-destructive drop-shadow-sm"
    />
  )
}

export function MealSuggestionTitle() {
  const { meal, isRejected } = useMealSuggestion()

  return (
    <ItemContent data-slot="meal-suggestion-content">
      <ItemTitle
        data-slot="meal-suggestion-title"
        className={cn(
          'text-base font-semibold',
          isRejected &&
            'line-through decoration-muted-foreground/30 decoration-1',
        )}
      >
        {meal.name}
      </ItemTitle>
    </ItemContent>
  )
}

export function MealSuggestionImage() {
  const { meal } = useMealSuggestion()
  const { imageUrl } = useMealImage(meal)

  return (
    <div
      data-slot="meal-suggestion-image"
      className="relative aspect-[4/3] w-full overflow-hidden bg-muted"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={meal.name}
          className="size-full object-cover"
        />
      ) : (
        <Skeleton className="size-full rounded-none" />
      )}
    </div>
  )
}

export function MealSuggestionIngredients() {
  const { meal } = useMealSuggestion()

  return (
    <p
      data-slot="meal-suggestion-ingredients"
      className="text-xs text-muted-foreground"
    >
      {meal.keyIngredients.join(', ')}
    </p>
  )
}

export function MealSuggestionActions() {
  const {
    showActions,
    isAccepted,
    isRejected,
    handleAccept,
    handleReject,
  } = useMealSuggestion()

  if (!showActions) return null

  return (
    <div
      data-slot="meal-suggestion-actions"
      className="mt-auto flex items-center gap-2 px-4 pb-3.5 pt-2"
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReject}
        className="flex-1 text-muted-foreground"
      >
        <X data-icon="inline-start" />
        {isRejected ? 'Dismissed' : 'Dismiss'}
      </Button>
      <Button
        size="sm"
        variant="default"
        onClick={handleAccept}
        className="flex-1"
      >
        {isAccepted ? 'Added' : '+ Add to Plan'}
      </Button>
    </div>
  )
}

export function MealSuggestionLoadingCard({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <Item
      data-slot="meal-suggestion-loading-card"
      variant="outline"
      className={cn('flex-col items-stretch overflow-hidden p-0', className)}
      {...props}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    </Item>
  )
}

export function MealSuggestionCard({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  const { meal, isAccepted, isRegenerating } = useMealSuggestion()

  if (isRegenerating) {
    return <MealSuggestionLoadingCard className={className} {...props} />
  }

  return (
    <Item
      data-slot="meal-suggestion-card"
      data-status={meal.status}
      variant="outline"
      className={cn(
        'relative h-full flex-col items-stretch overflow-hidden bg-background p-0 transition-all duration-200',
        isAccepted && 'border-foreground/30',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <MealSuggestionImage />
          <div className="flex flex-1 flex-col gap-1 px-4 pt-3">
            <MealSuggestionStatus />
            <MealSuggestionTitle />
            <MealSuggestionIngredients />
          </div>
          <MealSuggestionActions />
        </>
      )}
    </Item>
  )
}

interface MealSuggestionCarouselProps {
  meals: Doc<'meals'>[]
  planStatus: string
  isActivelyGenerating: boolean
  currentMealCount: number
  totalRequested: number
  className?: string
  onMealStatusChange?: (
    meal: Doc<'meals'>,
    status: Doc<'meals'>['status'],
  ) => void | Promise<void>
}

export function MealSuggestionCarousel({
  meals,
  planStatus,
  isActivelyGenerating,
  currentMealCount,
  totalRequested,
  className,
  onMealStatusChange,
}: MealSuggestionCarouselProps) {
  const visibleMeals =
    planStatus === 'generating'
      ? meals
      : meals.filter((meal) => meal.status !== 'rejected')

  return (
    <MealSuggestionViewport className={className}>
      <AnimatePresence initial={false} mode="popLayout">
        {visibleMeals.map((meal, index) => (
          <MealSuggestionItem key={meal._id} index={index}>
            <MealSuggestionProvider
              meal={meal}
              showActions={planStatus === 'reviewing'}
              isRegenerating={
                meal.status === 'rejected' && planStatus === 'generating'
              }
              onStatusChange={
                onMealStatusChange
                  ? (status) => onMealStatusChange(meal, status)
                  : undefined
              }
            >
              <MealSuggestionCard />
            </MealSuggestionProvider>
          </MealSuggestionItem>
        ))}
      </AnimatePresence>
      {isActivelyGenerating &&
        currentMealCount < totalRequested &&
        Array.from({ length: totalRequested - currentMealCount }, (_, i) => (
          <div
            key={`h-skeleton-${i}`}
            data-slot="meal-suggestion-placeholder"
            className={MEAL_SUGGESTION_ITEM_WIDTH}
          >
            <MealSkeleton />
          </div>
        ))}
    </MealSuggestionViewport>
  )
}
