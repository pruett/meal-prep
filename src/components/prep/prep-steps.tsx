import { Badge } from '~/components/ui/badge'

type BatchPrepStep = {
  stepNumber: number
  instruction: string
  estimatedMinutes: number
  relatedMeals: string[]
}

interface PrepStepsProps {
  steps: BatchPrepStep[]
}

export function PrepSteps({ steps }: PrepStepsProps) {
  if (steps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
        No prep steps.
      </p>
    )
  }

  const sorted = steps.slice().sort((a, b) => a.stepNumber - b.stepNumber)

  return (
    <div className="space-y-4">
      {sorted.map((step) => (
        <PrepStep key={step.stepNumber} step={step} />
      ))}
    </div>
  )
}

function PrepStep({ step }: { step: BatchPrepStep }) {
  return (
    <div className="flex gap-3 rounded-xl border border-[var(--line)] p-3 sm:gap-4 sm:p-4">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: 'var(--lagoon-deep)' }}
      >
        {step.stepNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--sea-ink)]">{step.instruction}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {step.estimatedMinutes} min
          </span>
          {step.relatedMeals.map((meal) => (
            <Badge key={meal} variant="secondary" className="text-xs">
              {meal}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
