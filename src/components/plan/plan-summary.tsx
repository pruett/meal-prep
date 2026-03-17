import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'

interface PlanSummaryProps {
  weekStartDate: string
  status: 'generating' | 'reviewing' | 'finalized'
  mealCount: number
  totalMealsRequested: number
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endStr = end.toLocaleDateString(
    'en-US',
    start.getMonth() === end.getMonth()
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' },
  )

  return `${startStr} – ${endStr}`
}

const STATUS_CONFIG = {
  generating: {
    label: 'Generating',
    dotClass: 'bg-[var(--lagoon)] animate-pulse',
    textClass: 'text-[var(--lagoon-deep)]',
    bgClass: 'bg-[var(--lagoon)]/[0.08]',
  },
  reviewing: {
    label: 'In Progress',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700',
    bgClass: 'bg-sky-50',
  },
  finalized: {
    label: 'Ready',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
  },
} as const

export function PlanSummary({
  weekStartDate,
  status,
  mealCount,
  totalMealsRequested,
}: PlanSummaryProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Link
      to="/plan/$weekStart"
      params={{ weekStart: weekStartDate }}
      className="group flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 no-underline transition hover:bg-[var(--surface-strong)] hover:shadow-sm"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--sea-ink)]">
          {formatWeekRange(weekStartDate)}
        </span>
        <span className="text-xs text-[var(--sea-ink-soft)]">
          {mealCount} of {totalMealsRequested} meals
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium',
            config.bgClass,
            config.textClass,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
          {config.label}
        </span>
        <svg
          className="h-4 w-4 text-[var(--sea-ink-soft)] transition-transform group-hover:translate-x-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  )
}
