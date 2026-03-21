import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { Check, CircleCheck, LeafyGreen, X, XCircle } from 'lucide-react'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemTitle,
} from '~/components/ui/item'
import { cn } from '~/lib/utils'

export const MEAL_CARD_HEIGHT = 'min-h-[140px]'

interface MealCardProps {
  meal: Doc<'meals'>
  showActions?: boolean
  isRegenerating?: boolean
}

export function MealCard({
  meal,
  showActions = false,
  isRegenerating = false,
}: MealCardProps) {
  const updateStatus = useMutation(api.meals.updateStatus)

  const isAccepted = meal.status === 'accepted'
  const isRejected = meal.status === 'rejected'

  const handleAccept = async () => {
    try {
      await updateStatus({
        id: meal._id,
        status: isAccepted ? 'pending' : 'accepted',
      })
    } catch {
      toast.error('Failed to update meal status')
    }
  }

  const handleReject = async () => {
    try {
      await updateStatus({
        id: meal._id,
        status: isRejected ? 'pending' : 'rejected',
      })
    } catch {
      toast.error('Failed to update meal status')
    }
  }

  if (isRegenerating) {
    return (
      <Item variant="outline" className={MEAL_CARD_HEIGHT}>
        <ItemContent>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </ItemContent>
        <ItemFooter>
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-20" />
        </ItemFooter>
      </Item>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {showActions && (
        <button
          type="button"
          onClick={handleReject}
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            isRejected
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-destructive/30 text-destructive hover:bg-destructive/10',
          )}
        >
          <X className="size-5" />
        </button>
      )}
      <Item
        variant="outline"
        className={cn(
          MEAL_CARD_HEIGHT,
          'relative flex-1 overflow-hidden transition-all duration-200',
          isAccepted && 'border-foreground/30',
        )}
      >
        {isAccepted && (
          <CircleCheck className="absolute right-3 top-3 size-5" />
        )}
        {isRejected && (
          <XCircle className="absolute right-3 top-3 size-5 text-destructive" />
        )}
        <ItemContent>
          <ItemTitle
            className={cn(
              'text-base font-semibold',
              isRejected &&
                'line-through decoration-muted-foreground/30 decoration-1',
            )}
          >
            {meal.name}
          </ItemTitle>
        </ItemContent>
        <ItemFooter>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LeafyGreen className="size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Ingredients</span>{' '}
              {meal.keyIngredients.join(', ')}
            </span>
          </div>
        </ItemFooter>
      </Item>
      {showActions && (
        <button
          type="button"
          onClick={handleAccept}
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            isAccepted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-primary/30 text-primary hover:bg-primary/10',
          )}
        >
          <Check className="size-5" />
        </button>
      )}
    </div>
  )
}
