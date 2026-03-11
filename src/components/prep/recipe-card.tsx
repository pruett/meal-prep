import type { Doc } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface RecipeCardProps {
  meal: Doc<'meals'>
}

export function RecipeCard({ meal }: RecipeCardProps) {
  const recipe = meal.fullRecipe

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{meal.name}</CardTitle>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
              {meal.description}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {meal.estimatedPrepMinutes} min
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
              <h4 className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
                Ingredients
              </h4>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {recipe.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-2 text-sm text-[var(--sea-ink-soft)]"
                  >
                    <span className="shrink-0 font-medium text-[var(--sea-ink)]">
                      {ing.quantity} {ing.unit}
                    </span>
                    <span>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
                Instructions
              </h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: 'var(--lagoon-deep)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[var(--sea-ink-soft)]">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Full recipe not yet available.
          </p>
        )}
      </CardContent>
    </Card>
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
    <span className="inline-flex items-baseline gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs">
      <span className="font-semibold tabular-nums text-[var(--sea-ink)]">
        {value}
        {unit}
      </span>
      <span className="text-[var(--sea-ink-soft)]">{label}</span>
    </span>
  )
}
