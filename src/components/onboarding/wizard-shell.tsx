import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'

const STEPS = [
  { path: '/onboarding/diet', label: 'Diet' },
  { path: '/onboarding/cuisines', label: 'Cuisines' },
  { path: '/onboarding/avoid', label: 'Avoid' },
  { path: '/onboarding/meals', label: 'Meals' },
  { path: '/onboarding/cooking', label: 'Cooking' },
  { path: '/onboarding/generate', label: 'Generate' },
] as const

type StepPath = (typeof STEPS)[number]['path']

interface WizardContextValue {
  currentStep: number
  totalSteps: number
  setOnSave: (fn: (() => Promise<void>) | null) => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardShell')
  return ctx
}

interface WizardShellProps {
  children: React.ReactNode
}

export function WizardShell({ children }: WizardShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const onSaveRef = useRef<(() => Promise<void>) | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentIndex = STEPS.findIndex((s) => location.pathname === s.path)
  const currentStep = currentIndex >= 0 ? currentIndex : 0
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const setOnSave = useCallback((fn: (() => Promise<void>) | null) => {
    onSaveRef.current = fn
  }, [])

  const goTo = (path: StepPath) => {
    void navigate({ to: path })
  }

  const handleBack = () => {
    const prevStep = STEPS[currentStep - 1]
    if (prevStep) goTo(prevStep.path)
  }

  const handleNext = async () => {
    if (onSaveRef.current) {
      setIsSaving(true)
      try {
        await onSaveRef.current()
      } finally {
        setIsSaving(false)
      }
    }
    const nextStep = STEPS[currentStep + 1]
    if (nextStep) goTo(nextStep.path)
  }

  const handleSkip = () => {
    const nextStep = STEPS[currentStep + 1]
    if (nextStep) goTo(nextStep.path)
  }

  return (
    <WizardContext.Provider
      value={{ currentStep: currentStep + 1, totalSteps: STEPS.length, setOnSave }}
    >
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
        <div className="rise-in w-full max-w-lg">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="island-kicker">
                Step {currentStep + 1} of {STEPS.length}
              </p>
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">
                {STEPS[currentStep].label}
              </p>
            </div>

            {/* Step dots + progress bar */}
            <div className="relative">
              {/* Background track */}
              <div className="h-1 w-full rounded-full bg-[var(--line)]" />
              {/* Filled track */}
              <div
                className="absolute inset-y-0 left-0 h-1 rounded-full bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--lagoon)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
              {/* Step dots */}
              <div className="absolute inset-0 flex items-center justify-between">
                {STEPS.map((step, i) => (
                  <div
                    key={step.path}
                    className={[
                      'h-2.5 w-2.5 rounded-full border-2 transition-all duration-300',
                      i < currentStep + 1
                        ? 'border-[var(--lagoon)] bg-[var(--lagoon)]'
                        : 'border-[var(--line)] bg-[var(--foam)]',
                      i === currentStep && 'h-3 w-3 ring-4 ring-[var(--lagoon)]/15',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="island-shell rounded-xl p-6">{children}</div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstStep}
              className="text-[var(--sea-ink-soft)]"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[var(--sea-ink-soft)]"
                >
                  Skip
                </Button>
              )}
              <Button onClick={handleNext} disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                    {isLastStep ? 'Generating…' : 'Saving…'}
                  </span>
                ) : isLastStep ? (
                  'Generate Plan'
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  )
}
