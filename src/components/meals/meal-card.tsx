import { useMutation } from 'convex/react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import { Badge } from '~/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface MealCardProps {
  meal: Doc<'meals'>
  showActions?: boolean
}

export function MealCard({ meal, showActions = false }: MealCardProps) {
  const updateStatus = useMutation(api.meals.updateStatus)

  const isAccepted = meal.status === 'accepted'
  const isRejected = meal.status === 'rejected'

  const handleAccept = () => {
    updateStatus({
      id: meal._id,
      status: isAccepted ? 'pending' : 'accepted',
    })
  }

  const handleReject = () => {
    updateStatus({
      id: meal._id,
      status: isRejected ? 'pending' : 'rejected',
    })
  }

  return (
    <Card
      size="sm"
      className={cn(
        'transition-all duration-200',
        isAccepted &&
          'ring-2 ring-[var(--palm)] bg-[linear-gradient(165deg,rgba(47,106,74,0.06),rgba(47,106,74,0.02))]',
        isRejected && 'opacity-50 grayscale-[20%]',
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            isRejected &&
              'line-through decoration-[var(--sea-ink-soft)]/30 decoration-1',
          )}
        >
          {meal.name}
        </CardTitle>
        <CardDescription>{meal.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {meal.keyIngredients.map((ingredient) => (
            <Badge key={ingredient} variant="secondary">
              {ingredient}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {meal.estimatedPrepMinutes} min prep
        </p>
      </CardContent>
      {showActions && (
        <CardFooter className="gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
              isAccepted
                ? 'bg-[var(--palm)] text-white shadow-sm'
                : 'bg-[var(--palm)]/10 text-[var(--palm)] hover:bg-[var(--palm)]/20',
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {isAccepted ? 'Accepted' : 'Accept'}
          </button>
          <button
            type="button"
            onClick={handleReject}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
              isRejected
                ? 'bg-destructive text-white shadow-sm'
                : 'bg-destructive/10 text-destructive hover:bg-destructive/20',
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {isRejected ? 'Rejected' : 'Reject'}
          </button>
        </CardFooter>
      )}
    </Card>
  )
}
