import { Item, ItemContent, ItemFooter } from '~/components/ui/item'
import { Skeleton } from '~/components/ui/skeleton'
import { MEAL_CARD_HEIGHT } from './meal-card'

export function MealSkeleton() {
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
