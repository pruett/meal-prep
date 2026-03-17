import { ChipGrid } from "./chip-grid"
import { DIETARY_RESTRICTIONS, toggleInSet } from "./constants"

export function DietSelector({
  selected,
  onChange,
  layout,
  showIcons,
  className,
}: {
  selected: Set<string>
  onChange: (next: Set<string>) => void
  layout?: "list" | "grid"
  showIcons?: boolean
  className?: string
}) {
  return (
    <ChipGrid
      items={DIETARY_RESTRICTIONS}
      selected={selected}
      onToggle={(id) => onChange(toggleInSet(selected, id))}
      layout={layout}
      showIcons={showIcons}
      className={className}
    />
  )
}
