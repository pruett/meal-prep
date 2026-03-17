import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Spinner } from '~/components/ui/spinner'
import { Button } from '~/components/ui/button'

interface PrepGenerationInterstitialProps {
  mealCount: number
  completed: boolean
  error: string | null
  onRetry: () => void
  onComplete: () => void
}

const STEPS = [
  { label: 'Reading your meals...', delay: 0 },
  { label: 'Crafting detailed recipes...', delay: 8_000 },
  { label: 'Building your shopping list...', delay: 55_000 },
  { label: 'Planning your prep day...', delay: 100_000 },
  { label: 'Finishing touches...', delay: 140_000 },
] as const

function PrepGenerationInterstitial({
  mealCount,
  completed,
  error,
  onRetry,
  onComplete,
}: PrepGenerationInterstitialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const timerIds = useRef<number[]>([])

  // Set up step progression timers
  useEffect(() => {
    if (completed || error) return

    timerIds.current = STEPS.slice(1).map((step, i) =>
      window.setTimeout(() => setCurrentStep(i + 1), step.delay),
    )

    return () => {
      timerIds.current.forEach(clearTimeout)
      timerIds.current = []
    }
  }, [completed, error])

  // Handle completion
  useEffect(() => {
    if (!completed) return

    timerIds.current.forEach(clearTimeout)
    timerIds.current = []
    setCurrentStep(STEPS.length - 1)

    const id = window.setTimeout(onComplete, 1_500)
    return () => clearTimeout(id)
  }, [completed, onComplete])

  // Handle error
  useEffect(() => {
    if (!error) return
    timerIds.current.forEach(clearTimeout)
    timerIds.current = []
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center animate-in fade-in">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Generating your prep guide
        </h2>
        <p className="text-sm text-muted-foreground">
          Building a plan for {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
          &hellip;
        </p>
      </div>

      <ul className="flex flex-col gap-3 text-left">
        {STEPS.map((step, i) => {
          const isDone = completed || i < currentStep
          const isActive = !completed && !error && i === currentStep

          return (
            <li key={step.label} className="flex items-center gap-2.5">
              {isDone ? (
                <Check className="size-4 text-primary shrink-0" />
              ) : isActive ? (
                <Spinner className="size-4 shrink-0" />
              ) : (
                <div className="size-4 shrink-0" />
              )}
              <span
                className={
                  isDone
                    ? 'text-sm text-foreground'
                    : isActive
                      ? 'text-sm text-foreground'
                      : 'text-sm text-muted-foreground/40'
                }
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ul>

      {completed && (
        <p className="text-sm font-medium text-primary animate-in fade-in">
          Your prep guide is ready!
        </p>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}

export { PrepGenerationInterstitial }
export type { PrepGenerationInterstitialProps }
