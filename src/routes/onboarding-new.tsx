import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'

interface Step {
  title: string
  subtitle: string
  options: { id: string; label: string }[]
}

const STEPS: Step[] = [
  {
    title: 'Dietary restrictions',
    subtitle: 'Select any that apply',
    options: [
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'pescatarian', label: 'Pescatarian' },
      { id: 'gluten-free', label: 'Gluten free' },
      { id: 'dairy-free', label: 'Dairy free' },
    ],
  },
  {
    title: 'Cuisine preferences',
    subtitle: 'What do you enjoy cooking?',
    options: [
      { id: 'italian', label: 'Italian' },
      { id: 'mexican', label: 'Mexican' },
      { id: 'asian', label: 'Asian' },
      { id: 'mediterranean', label: 'Mediterranean' },
      { id: 'american', label: 'American' },
    ],
  },
  {
    title: 'Cooking frequency',
    subtitle: 'How often do you cook per week?',
    options: [
      { id: '1-2', label: '1–2 times' },
      { id: '3-4', label: '3–4 times' },
      { id: '5-6', label: '5–6 times' },
      { id: 'daily', label: 'Every day' },
    ],
  },
]

export const Route = createFileRoute('/onboarding-new')({
  component: OnboardingNew,
})

function OnboardingNew() {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selections, setSelections] = useState<Record<number, Set<string>>>(
    () => ({}),
  )

  const step = STEPS[stepIndex]
  const selected = selections[stepIndex] ?? new Set<string>()
  const isLastStep = stepIndex === STEPS.length - 1

  const toggle = (id: string) => {
    setSelections((prev) => {
      const current = new Set(prev[stepIndex] ?? [])
      if (current.has(id)) {
        current.delete(id)
      } else {
        current.add(id)
      }
      return { ...prev, [stepIndex]: current }
    })
  }

  const goForward = () => {
    if (isLastStep) return
    setDirection(1)
    setStepIndex((i) => i + 1)
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setDirection(-1)
    setStepIndex((i) => i - 1)
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center overflow-hidden px-4 pt-12">
      <div className="w-full max-w-md">
        {/* Navigation row */}
        <div className="mb-12 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-lg text-[#919191] hover:text-[#6D6D6D]"
            onClick={goBack}
            disabled={stepIndex === 0}
          >
            &lt;
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-base text-[#919191] hover:text-[#6D6D6D]"
            onClick={goForward}
          >
            Skip
          </Button>
        </div>

        {/* Animated step content */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Heading */}
              <div className="mb-10 text-center">
                <h1 className="text-[40px] font-semibold leading-tight tracking-tight">
                  {step.title}
                </h1>
                <p className="mt-3 text-[22px] font-medium text-[#6D6D6D]">
                  {step.subtitle}
                </p>
              </div>

              {/* Option list */}
              <div className="flex flex-col gap-2.5">
                {step.options.map(({ id, label }) => {
                  const isSelected = selected.has(id)
                  return (
                    <Button
                      key={id}
                      variant="outline"
                      onClick={() => toggle(id)}
                      className={
                        isSelected
                          ? 'h-auto rounded-full border-[#E5E5E5] bg-[#454545] px-6 py-3.5 text-base font-medium text-white hover:bg-[#3a3a3a] hover:text-white'
                          : 'h-auto rounded-full border-[#E5E5E5] bg-[#F5F5F5] px-6 py-3.5 text-base font-medium text-black hover:bg-[#EBEBEB] hover:text-black'
                      }
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Continue button */}
        <div className="mt-10 flex justify-center">
          <Button
            variant="default"
            className="rounded-full bg-[#5A5A5A] px-8 py-4 text-base hover:bg-[#4a4a4a]"
            onClick={goForward}
          >
            {isLastStep ? 'Finish' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
