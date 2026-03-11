import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/cooking')({
  component: CookingPage,
})

function CookingPage() {
  return (
    <p className="py-12 text-center text-muted-foreground">
      Cooking preferences — coming soon
    </p>
  )
}
