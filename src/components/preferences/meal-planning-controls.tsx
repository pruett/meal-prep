import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";

export type MealsPerWeek = { breakfast: number; lunch: number; dinner: number };

export function MealPlanningControls({
  mealsPerWeek,
  onMealsPerWeekChange,
  className,
}: {
  mealsPerWeek: MealsPerWeek;
  onMealsPerWeekChange: (value: MealsPerWeek) => void;
  className?: string;
}) {
  const total =
    mealsPerWeek.breakfast + mealsPerWeek.lunch + mealsPerWeek.dinner;

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">Total meals per week</label>
        <span className="text-2xl font-bold tabular-nums text-primary">
          {total}
        </span>
      </div>

      <MealSlider
        label="Breakfast"
        value={mealsPerWeek.breakfast}
        onChange={(v) =>
          onMealsPerWeekChange({ ...mealsPerWeek, breakfast: v })
        }
      />
      <MealSlider
        label="Lunch"
        value={mealsPerWeek.lunch}
        onChange={(v) => onMealsPerWeekChange({ ...mealsPerWeek, lunch: v })}
      />
      <MealSlider
        label="Dinner"
        value={mealsPerWeek.dinner}
        onChange={(v) => onMealsPerWeekChange({ ...mealsPerWeek, dinner: v })}
      />
    </div>
  );
}

function MealSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-primary">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val) =>
          onChange(Array.isArray(val) ? (val[0] ?? value) : val)
        }
        min={0}
        max={7}
        step={1}
      />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>7</span>
      </div>
    </div>
  );
}
