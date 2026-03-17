import { ChevronDown } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '~/components/ui/item'

interface RecipeCardProps {
  meal: Doc<'meals'>
}

export function RecipeCard({ meal }: RecipeCardProps) {
  const recipe = meal.fullRecipe

  return (
    <Collapsible defaultOpen className="group/collapsible rounded-2xl border border-border">
      <CollapsibleTrigger className="w-full cursor-pointer text-left">
        <Item>
          <ItemContent>
            <ItemTitle>{meal.name}</ItemTitle>
            {meal.description && (
              <ItemDescription>{meal.description}</ItemDescription>
            )}
          </ItemContent>
          <ItemActions>
            <Badge variant="secondary" className="shrink-0">
              {meal.estimatedPrepMinutes} min
            </Badge>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[open]/collapsible:rotate-180" />
          </ItemActions>
        </Item>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-2">
          {recipe ? (
            <div className="space-y-6">
              {/* Nutrition summary */}
              {recipe.nutritionEstimate && (
                <div className="flex flex-wrap gap-3">
                  <NutritionPill
                    label="Cal"
                    value={recipe.nutritionEstimate.calories}
                  />
                  <NutritionPill
                    label="Protein"
                    value={recipe.nutritionEstimate.protein}
                    unit="g"
                  />
                  <NutritionPill
                    label="Carbs"
                    value={recipe.nutritionEstimate.carbs}
                    unit="g"
                  />
                  <NutritionPill
                    label="Fat"
                    value={recipe.nutritionEstimate.fat}
                    unit="g"
                  />
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Ingredients
                </h4>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li
                      key={i}
                      className="flex items-baseline gap-2 text-sm text-muted-foreground"
                    >
                      <span className="shrink-0 font-medium text-foreground">
                        {ing.quantity} {ing.unit}
                      </span>
                      <span>{ing.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">
                  Instructions
                </h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                      >
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-muted-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Full recipe not yet available.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function NutritionPill({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit?: string
}) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
      <span className="font-semibold tabular-nums text-foreground">
        {value}
        {unit}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
