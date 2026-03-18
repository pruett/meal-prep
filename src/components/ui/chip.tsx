import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

const chipVariants = cva(
  "h-auto rounded-lg justify-between text-left",
  {
    variants: {
      variant: {
        default:
          "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border-border bg-input/30 text-muted-foreground hover:bg-input/50 hover:text-foreground",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-5 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const chipGroupVariants = cva("", {
  variants: {
    layout: {
      grid: "grid grid-cols-2 gap-2.5 sm:grid-cols-3",
      list: "flex flex-col gap-2",
      inline: "flex flex-wrap gap-2",
    },
  },
  defaultVariants: {
    layout: "grid",
  },
})

/* ─── Chip ─── */

type ChipProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof chipVariants> & {
    selected?: boolean
  }

function Chip({
  className,
  variant = "default",
  size = "default",
  selected = false,
  children,
  ...props
}: ChipProps) {
  return (
    <Button
      variant="ghost"
      data-slot="chip"
      data-selected={selected ? "" : undefined}
      aria-pressed={selected}
      className={cn(
        chipVariants({ variant, size }),
        selected &&
          "border-primary bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {selected && <Check className="ml-2 size-4" />}
    </Button>
  )
}

/* ─── ChipIcon ─── */

function ChipIcon({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="chip-icon"
      className={cn("mr-2.5 text-base leading-none", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  )
}

/* ─── ChipGroup ─── */

type ChipGroupProps = React.ComponentProps<"div"> &
  VariantProps<typeof chipGroupVariants>

function ChipGroup({
  className,
  layout = "grid",
  children,
  ...props
}: ChipGroupProps) {
  return (
    <div
      data-slot="chip-group"
      role="group"
      className={cn(chipGroupVariants({ layout }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Chip, ChipIcon, ChipGroup, chipVariants, chipGroupVariants }
