import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/preferences')({
  component: PreferencesPage,
})

function PreferencesPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-8">
      <p className="text-[var(--sea-ink-soft)]">Preferences — coming soon</p>
    </main>
  )
}
