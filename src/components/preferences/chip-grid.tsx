import { Check } from "lucide-react"
import { Button } from "~/components/ui/button"
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
      <div
        className={cn(
          layout === "grid"
            ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            : "flex flex-col gap-2",
        )}
      >
        {items.map(({ id, label, icon }) => {
          const isSelected = selected.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                {showIcons && (
                  <span className="text-base leading-none" aria-hidden="true">
                    {icon}
                  </span>
                )}
                <span className="truncate">{label}</span>
              </span>
              {isSelected && <Check className="h-4 w-4 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
