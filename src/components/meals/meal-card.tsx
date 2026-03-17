import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { Check, CircleCheck, Clock, LeafyGreen, X, XCircle } from 'lucide-react'
import { Button } from '~/components/ui/button'
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

export function MealCard({ meal, showActions = false, isRegenerating = false }: MealCardProps) {
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
    <Item
      variant="outline"
      className={cn(
        MEAL_CARD_HEIGHT,
        'relative overflow-hidden transition-all duration-200',
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
        <div className="flex items-center gap-2">
          <ItemTitle
            className={cn(
              'text-base font-semibold',
              isRejected &&
                'line-through decoration-muted-foreground/30 decoration-1',
            )}
          >
            {meal.name}
          </ItemTitle>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            {meal.estimatedPrepMinutes}m
          </span>
        </div>
        <ItemContent>{meal.description}</ItemContent>
      </ItemContent>
      <ItemFooter>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LeafyGreen className="size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Ingredients</span>{' '}
            {meal.keyIngredients.join(', ')}
          </span>
        </div>
        {showActions && (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant={isAccepted ? 'default' : 'outline'}
              onClick={handleAccept}
              className={cn(
                !isAccepted &&
                  'text-primary border-primary/30 hover:bg-primary/10',
              )}
            >
              <Check data-icon="inline-start" />
              {isAccepted ? 'Accepted' : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant={isRejected ? 'destructive' : 'outline'}
              onClick={handleReject}
              className={cn(
                !isRejected &&
                  'text-destructive border-destructive/30 hover:bg-destructive/10',
              )}
            >
              <X data-icon="inline-start" />
              {isRejected ? 'Rejected' : 'Reject'}
            </Button>
          </div>
        )}
      </ItemFooter>
    </Item>
  )
}
