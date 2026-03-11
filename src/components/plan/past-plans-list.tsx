import { PlanSummary } from './plan-summary'

interface MealPlanSummary {
  _id: string
  weekStartDate: string
  status: 'generating' | 'reviewing' | 'finalized' | 'archived'
  totalMealsRequested: number
  mealCount: number
}

interface PastPlansListProps {
  plans: MealPlanSummary[]
}

export function PastPlansList({ plans }: PastPlansListProps) {
  if (plans.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">
        No past plans yet. Your plan history will appear here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {plans.map((plan) => (
        <PlanSummary
          key={plan._id}
          weekStartDate={plan.weekStartDate}
          status={plan.status}
          mealCount={plan.mealCount}
          totalMealsRequested={plan.totalMealsRequested}
        />
      ))}
    </div>
  )
}
