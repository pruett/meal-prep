import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/avoid')({
  component: AvoidPage,
})

function AvoidPage() {
  return (
    <p className="py-12 text-center text-muted-foreground">
      Foods to avoid — coming soon
    </p>
  )
}
