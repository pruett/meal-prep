import type { Doc } from '../../../convex/_generated/dataModel'
import { MealCard } from './meal-card'

interface MealGridProps {
  meals: Doc<'meals'>[]
}

export function MealGrid({ meals }: MealGridProps) {
  if (meals.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No meals yet. Generate a meal plan to get started.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealCard key={meal._id} meal={meal} />
      ))}
    </div>
  )
}
