import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/cuisines')({
  component: CuisinesPage,
})

function CuisinesPage() {
  return (
    <p className="py-12 text-center text-muted-foreground">
      Cuisine preferences — coming soon
    </p>
  )
}
