import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/generate')({
  component: GeneratePage,
})

function GeneratePage() {
  return (
    <p className="py-12 text-center text-muted-foreground">
      Review &amp; generate — coming soon
    </p>
  )
}
