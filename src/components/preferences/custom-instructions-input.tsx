import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"

export function CustomInstructionsInput({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn(className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. avoid shellfish, prefer one-pot meals, kid-friendly options, extra protein..."
        rows={4}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Any special requests or instructions for your meal plans.
      </p>
    </div>
  )
}
