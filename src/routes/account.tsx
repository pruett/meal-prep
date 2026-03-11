import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

function AccountPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-8">
      <p className="text-[var(--sea-ink-soft)]">Account — coming soon</p>
    </main>
  )
}
