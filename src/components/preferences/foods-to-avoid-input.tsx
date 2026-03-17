import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"

export function FoodsToAvoidInput({
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
        placeholder="e.g. shellfish, cilantro, blue cheese, raw tomatoes..."
        rows={4}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Separate items with commas or put each on its own line.
      </p>
    </div>
  )
}
