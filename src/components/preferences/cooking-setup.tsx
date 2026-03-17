import { Slider } from "~/components/ui/slider"
import { cn } from "~/lib/utils"
import { ChipGrid } from "./chip-grid"
import { EQUIPMENT, formatTime, toggleInSet } from "./constants"

export function CookingSetup({
  maxPrepTime,
  onMaxPrepTimeChange,
  equipment,
  onEquipmentChange,
  equipmentLayout,
  showIcons,
  className,
}: {
  maxPrepTime: number
  onMaxPrepTimeChange: (value: number) => void
  equipment: Set<string>
  onEquipmentChange: (next: Set<string>) => void
  equipmentLayout?: "list" | "grid"
  showIcons?: boolean
  className?: string
}) {
  const allSelected = EQUIPMENT.every(({ id }) => equipment.has(id))

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <label className="text-sm font-medium">Max prep time per meal</label>
          <span className="text-2xl font-bold tabular-nums text-primary">
            {formatTime(maxPrepTime)}
          </span>
        </div>
        <Slider
          value={[maxPrepTime]}
          onValueChange={(val) =>
            onMaxPrepTimeChange(Array.isArray(val) ? val[0] : val)
          }
          min={15}
          max={120}
          step={5}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>2 hrs</span>
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium">
          Kitchen equipment
        </label>
        <ChipGrid
          items={EQUIPMENT}
          selected={equipment}
          onToggle={(id) => onEquipmentChange(toggleInSet(equipment, id))}
          showSelectAll
          onSelectAll={() =>
            onEquipmentChange(
              allSelected
                ? new Set()
                : new Set(EQUIPMENT.map(({ id }) => id)),
            )
          }
          layout={equipmentLayout}
          showIcons={showIcons}
        />
      </div>
    </div>
  )
}
