import { ChipGrid } from "./chip-grid"
import { CUISINES, toggleInSet } from "./constants"

export function CuisineSelector({
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
  const allSelected = CUISINES.every(({ id }) => selected.has(id))

  return (
    <ChipGrid
      items={CUISINES}
      selected={selected}
      onToggle={(id) => onChange(toggleInSet(selected, id))}
      showSelectAll
      onSelectAll={() =>
        onChange(allSelected ? new Set() : new Set(CUISINES.map(({ id }) => id)))
      }
      layout={layout}
      showIcons={showIcons}
      className={className}
    />
  )
}
