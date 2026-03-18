import { cn } from "~/lib/utils"
import { ChipGrid } from "./chip-grid"
import { EQUIPMENT, toggleInSet } from "./constants"

export function EquipmentSelector({
  equipment,
  onEquipmentChange,
  layout,
  showIcons,
  className,
}: {
  equipment: Set<string>
  onEquipmentChange: (next: Set<string>) => void
  layout?: "list" | "grid"
  showIcons?: boolean
  className?: string
}) {
  const allSelected = EQUIPMENT.every(({ id }) => equipment.has(id))

  return (
    <div className={cn(className)}>
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
        layout={layout}
        showIcons={showIcons}
      />
    </div>
  )
}
