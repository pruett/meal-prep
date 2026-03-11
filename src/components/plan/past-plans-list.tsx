import { EmptyState } from '~/components/empty-state'
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
      <EmptyState
        icon={
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        title="No past plans"
        description="Your completed and archived meal plans will appear here."
      />
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
