import { Button } from "~/components/ui/button"
import { Chip, ChipIcon, ChipGroup } from "~/components/ui/chip"
import { cn } from "~/lib/utils"
import type { PreferenceOption } from "./constants"

export function ChipGrid({
  items,
  selected,
  onToggle,
  showSelectAll,
  onSelectAll,
  layout = "grid",
  showIcons = false,
  className,
}: {
  items: PreferenceOption[]
  selected: Set<string>
  onToggle: (id: string) => void
  showSelectAll?: boolean
  onSelectAll?: () => void
  layout?: "list" | "grid"
  showIcons?: boolean
  className?: string
}) {
  const allSelected = items.every(({ id }) => selected.has(id))

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showSelectAll && onSelectAll && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end"
          onClick={onSelectAll}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      )}
      <ChipGroup layout={layout}>
        {items.map(({ id, label, icon }) => (
          <Chip
            key={id}
            selected={selected.has(id)}
            onClick={() => onToggle(id)}
          >
            {showIcons && <ChipIcon>{icon}</ChipIcon>}
            <span className="truncate">{label}</span>
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}
