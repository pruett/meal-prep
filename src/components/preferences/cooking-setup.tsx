import { Slider } from "~/components/ui/slider"
import { cn } from "~/lib/utils"
import { formatTime } from "./constants"

export function CookingSetup({
  maxWeeklyPrep,
  onMaxWeeklyPrepChange,
  maxCookTime,
  onMaxCookTimeChange,
  className,
}: {
  maxWeeklyPrep: number
  onMaxWeeklyPrepChange: (value: number) => void
  maxCookTime: number
  onMaxCookTimeChange: (value: number) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <label className="text-sm font-medium">Weekly prep time</label>
          <span className="text-2xl font-bold tabular-nums text-primary">
            {formatTime(maxWeeklyPrep)}
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          How long you have to batch-prep for the week
        </p>
        <Slider
          value={[maxWeeklyPrep]}
          onValueChange={(val) =>
            onMaxWeeklyPrepChange(Array.isArray(val) ? (val[0] ?? maxWeeklyPrep) : val)
          }
          min={30}
          max={300}
          step={15}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>30 min</span>
          <span>5 hrs</span>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <label className="text-sm font-medium">Cook time per meal</label>
          <span className="text-2xl font-bold tabular-nums text-primary">
            {formatTime(maxCookTime)}
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Max time to finish cooking each meal
        </p>
        <Slider
          value={[maxCookTime]}
          onValueChange={(val) =>
            onMaxCookTimeChange(Array.isArray(val) ? (val[0] ?? maxCookTime) : val)
          }
          min={10}
          max={90}
          step={5}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>10 min</span>
          <span>1 hr 30 min</span>
        </div>
      </div>
    </div>
  )
}
