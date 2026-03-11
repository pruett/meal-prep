import type { Doc } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface MealCardProps {
  meal: Doc<'meals'>
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Card size="sm" className={cn('transition-all')}>
      <CardHeader>
        <CardTitle>{meal.name}</CardTitle>
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
    </Card>
  )
}
