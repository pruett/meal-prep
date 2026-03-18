import { Minus, Plus } from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export type Household = { adults: number; kids: number; infants: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function CounterRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(clamp(value - 1, min, max))}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-6 text-center text-lg font-bold tabular-nums text-primary">
          {value}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(clamp(value + 1, min, max))}
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function HouseholdSelector({
  household,
  onHouseholdChange,
  className,
}: {
  household: Household
  onHouseholdChange: (household: Household) => void
  className?: string
}) {
  const total = household.adults + household.kids + household.infants

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">Total</label>
        <span className="text-2xl font-bold tabular-nums text-primary">
          {total} {total === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <CounterRow
          label="Adults"
          value={household.adults}
          min={1}
          max={10}
          onChange={(adults) => onHouseholdChange({ ...household, adults })}
        />
        <CounterRow
          label="Kids"
          value={household.kids}
          min={0}
          max={10}
          onChange={(kids) => onHouseholdChange({ ...household, kids })}
        />
        <CounterRow
          label="Infants"
          value={household.infants}
          min={0}
          max={5}
          onChange={(infants) => onHouseholdChange({ ...household, infants })}
        />
      </div>
    </div>
  )
}
