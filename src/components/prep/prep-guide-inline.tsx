import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { ItemGroup } from '~/components/ui/item'
import { RecipeCard } from '~/components/prep/recipe-card'
import { ShoppingList } from '~/components/prep/shopping-list'
import { PrepSteps } from '~/components/prep/prep-steps'
import { Spinner } from '~/components/ui/spinner'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Doc } from '../../../convex/_generated/dataModel'

interface PrepGuideInlineProps {
  mealPlanId: Id<'mealPlans'>
}

export function PrepGuideInline({ mealPlanId }: PrepGuideInlineProps) {
  const { data: prepGuide, isLoading: loadingGuide } = useQuery(
    convexQuery(api.prepGuides.getByMealPlan, { mealPlanId }),
  )

  const { data: meals, isLoading: loadingMeals } = useQuery(
    convexQuery(api.meals.getByMealPlan, { mealPlanId }),
  )

  const acceptedMeals =
    meals?.filter((m: Doc<'meals'>) => m.status === 'accepted') ?? []

  if (loadingGuide || loadingMeals) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (!prepGuide) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No prep guide available.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" />
          {prepGuide.totalEstimatedMinutes} min total
        </span>
        <span className="text-border">|</span>
        <span>{acceptedMeals.length} recipes</span>
        <span className="text-border">|</span>
        <span>{prepGuide.shoppingList.length} items</span>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="recipes">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
          <TabsTrigger value="prep">Prep Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes">
          {acceptedMeals.length > 0 ? (
            <ItemGroup>
              {acceptedMeals.map((meal: Doc<'meals'>) => (
                <RecipeCard key={meal._id} meal={meal} />
              ))}
            </ItemGroup>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No accepted meals with recipes.
            </p>
          )}
        </TabsContent>

        <TabsContent value="shopping">
          <ShoppingList items={prepGuide.shoppingList} />
        </TabsContent>

        <TabsContent value="prep">
          <PrepSteps steps={prepGuide.batchPrepSteps} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
