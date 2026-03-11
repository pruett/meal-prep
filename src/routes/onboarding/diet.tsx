import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/diet')({
  component: DietPage,
})

function DietPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Diet preferences — coming soon</p>
    </div>
  )
}
