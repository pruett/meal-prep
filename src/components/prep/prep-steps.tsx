import { useState } from 'react'
import { Check, Clock, UtensilsCrossed } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemFooter,
  ItemGroup,
} from '~/components/ui/item'

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
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())

  if (steps.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No prep steps.
      </p>
    )
  }

  const sorted = steps.slice().sort((a, b) => a.stepNumber - b.stepNumber)

  function toggleDone(stepNumber: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }

  return (
    <ItemGroup>
      {sorted.map((step) => (
        <PrepStep
          key={step.stepNumber}
          step={step}
          done={doneSteps.has(step.stepNumber)}
          onToggleDone={() => toggleDone(step.stepNumber)}
        />
      ))}
    </ItemGroup>
  )
}

function PrepStep({
  step,
  done,
  onToggleDone,
}: {
  step: BatchPrepStep
  done: boolean
  onToggleDone: () => void
}) {
  return (
    <Item variant="outline" className={done ? 'opacity-50' : ''}>
      <ItemMedia>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground bg-primary"
        >
          {step.stepNumber}
        </span>
      </ItemMedia>
      <ItemContent>
        <p
          className={`text-sm text-foreground ${done ? 'line-through' : ''}`}
        >
          {step.instruction}
        </p>
      </ItemContent>
      <ItemActions>
        <Button
          variant={done ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleDone}
        >
          <Check data-icon="inline-start" />
          Mark complete
        </Button>
      </ItemActions>
      <ItemFooter>
        {step.relatedMeals.length > 0 ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <UtensilsCrossed className="size-3.5 shrink-0" />
            <span className="shrink-0">Meals</span>
            {step.relatedMeals.map((meal) => (
              <Badge key={meal} variant="secondary" className="text-xs">
                {meal}
              </Badge>
            ))}
          </div>
        ) : (
          <div />
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {step.estimatedMinutes} min
        </span>
      </ItemFooter>
    </Item>
  )
}
