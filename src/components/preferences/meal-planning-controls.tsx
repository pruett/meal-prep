import { Minus, Plus } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Slider } from "~/components/ui/slider"
import { cn } from "~/lib/utils"
import { adjustHouseholdSize } from "./constants"

export function MealPlanningControls({
  mealsPerWeek,
  onMealsPerWeekChange,
  householdSize,
  onHouseholdSizeChange,
  className,
}: {
  mealsPerWeek: number
  onMealsPerWeekChange: (value: number) => void
  householdSize: number
  onHouseholdSizeChange: (value: number) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <label className="text-sm font-medium">Meals per week</label>
          <span className="text-2xl font-bold tabular-nums text-primary">
            {mealsPerWeek}
          </span>
        </div>
        <Slider
          value={[mealsPerWeek]}
          onValueChange={(val) =>
            onMealsPerWeekChange(Array.isArray(val) ? val[0] : val)
          }
          min={3}
          max={14}
          step={1}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>3</span>
          <span>14</span>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <label className="text-sm font-medium">Household size</label>
          <span className="text-sm text-muted-foreground">
            {householdSize === 1 ? "Just me" : `${householdSize} people`}
          </span>
        </div>
        <div className="flex items-center justify-center gap-5">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onHouseholdSizeChange(adjustHouseholdSize(householdSize, -1))
            }
            disabled={householdSize <= 1}
            className="rounded-full"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-3xl font-bold tabular-nums text-primary">
            {householdSize}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onHouseholdSizeChange(adjustHouseholdSize(householdSize, 1))
            }
            disabled={householdSize >= 10}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
