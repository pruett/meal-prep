import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemFooter,
  ItemTitle,
} from '~/components/ui/item'
import { cn } from '~/lib/utils'

export const MEAL_CARD_HEIGHT = 'h-[140px]'

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
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
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
        'overflow-hidden transition-all duration-200',
        isAccepted && 'ring-2 ring-primary',
        isRejected && 'opacity-50 grayscale-[20%]',
      )}
    >
      <ItemContent>
        <ItemTitle
          className={cn(
            isRejected &&
              'line-through decoration-muted-foreground/30 decoration-1',
          )}
        >
          {meal.name}
        </ItemTitle>
        <ItemContent>{meal.description}</ItemContent>
      </ItemContent>
      {showActions && (
        <ItemActions>
          <Button
            size="sm"
            variant={isAccepted ? 'default' : 'outline'}
            onClick={handleAccept}
            className={cn(
              !isAccepted &&
                'text-primary border-primary/30 hover:bg-primary/10',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-icon="inline-start"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-icon="inline-start"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {isRejected ? 'Rejected' : 'Reject'}
          </Button>
        </ItemActions>
      )}
      <ItemFooter>
        <div className="flex flex-wrap gap-1.5">
          {meal.keyIngredients.map((ingredient) => (
            <Badge key={ingredient} variant="secondary">
              {ingredient}
            </Badge>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {meal.estimatedPrepMinutes} min prep
        </span>
      </ItemFooter>
    </Item>
  )
}
