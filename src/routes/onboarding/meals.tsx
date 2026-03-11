import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/meals')({
  component: MealsPage,
})

function MealsPage() {
  return (
    <p className="py-12 text-center text-muted-foreground">
      Meal preferences — coming soon
    </p>
  )
}
