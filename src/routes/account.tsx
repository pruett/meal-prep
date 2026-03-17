import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/empty-state'
import { ErrorFallback } from '~/components/error-boundary'
import { AccountSkeleton } from '~/components/route-skeletons'
import { requireAuth } from '~/lib/auth-guard'
import { fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'

// ─── SSR Loader ────────────────────────────────────────────────────────────────

const fetchAccountData = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const user = await fetchAuthQuery(api.users.getAuthenticated, {})
    if (!user) return null

    const logs = await fetchAuthQuery(api.generationLogs.getByUser, {
      userId: user._id,
    })

    return { user, logs }
  } catch {
    return null
  }
})

export const Route = createFileRoute('/account')({
  beforeLoad: requireAuth,
  loader: () => fetchAccountData(),
  component: AccountPage,
  pendingComponent: AccountSkeleton,
  errorComponent: ErrorFallback,
})

// ─── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  'meal-suggestions': 'Meal Plan',
  'meal-regeneration': 'Regeneration',
  'prep-guide': 'Prep Guide',
}

function formatRelativeDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Page Component ────────────────────────────────────────────────────────────

function AccountPage() {
  const loaderData = Route.useLoaderData()
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  // Reactive user subscription
  const { data: reactiveUser } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
    initialData: loaderData?.user,
  })

  const user = reactiveUser ?? loaderData?.user

  // Reactive generation logs subscription
  const { data: reactiveLogs } = useQuery({
    ...convexQuery(
      api.generationLogs.getByUser,
      user ? { userId: user._id } : 'skip',
    ),
    initialData: loaderData?.logs,
  })

  const logs = reactiveLogs ?? loaderData?.logs ?? []

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  if (!user) {
    return (
      <main className="page-wrap px-4 pb-8 pt-8">
        <p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
          Unable to load account. Please try again.
        </p>
      </main>
    )
  }

  const creditsUsed = 25 - user.generationsRemaining
  const isLow = user.generationsRemaining <= 5
  const isEmpty = user.generationsRemaining === 0

  return (
    <main className="page-wrap rise-in px-4 pb-8 pt-14">
      {/* Header */}
      <section className="mb-8">
        <p className="island-kicker mb-2">Account</p>
        <h1 className="display-title mb-1 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Your Account
        </h1>
      </section>

      {/* Profile Card */}
      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
            style={{
              background:
                'linear-gradient(135deg, var(--lagoon), var(--palm))',
              color: 'white',
            }}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--sea-ink)]">
              {user.name}
            </p>
            <p className="truncate text-sm text-[var(--sea-ink-soft)]">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--sea-ink)]">
          Generation Credits
        </h2>

        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{
              color: isEmpty
                ? 'rgb(185, 28, 28)'
                : isLow
                  ? 'rgb(180, 83, 9)'
                  : 'var(--lagoon-deep)',
            }}
          >
            {user.generationsRemaining}
          </span>
          <span className="text-sm text-[var(--sea-ink-soft)]">remaining</span>
        </div>

        {/* Credits progress bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--sand)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(user.generationsRemaining / 25) * 100}%`,
              background: isEmpty
                ? 'rgb(220, 38, 38)'
                : isLow
                  ? 'rgb(217, 119, 6)'
                  : 'linear-gradient(90deg, var(--lagoon), var(--palm))',
            }}
          />
        </div>

        <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
          {creditsUsed} of 25 credits used
        </p>

        {isEmpty && (
          <div className="mt-4 rounded-lg border border-[var(--destructive)]/20 bg-[var(--destructive)]/[0.04] px-4 py-3">
            <p className="text-sm font-medium text-[var(--sea-ink)]">
              Out of credits
            </p>
            <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
              You've used all your generation credits. Meal generation is
              currently unavailable.
            </p>
          </div>
        )}
      </section>

      {/* Generation History */}
      <section className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--sea-ink)]">
          Generation History
        </h2>

        {logs.length === 0 ? (
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
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            }
            title="No generation history"
            description="Generate your first meal plan to see your activity here."
          />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white/40 px-3.5 py-2.5"
              >
                {/* Status dot */}
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      log.status === 'success'
                        ? 'var(--palm)'
                        : 'rgb(220, 38, 38)',
                  }}
                />

                {/* Type + provider */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--sea-ink)]">
                    {TYPE_LABELS[log.type] ?? log.type}
                  </p>
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    {log.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                    {log.creditsUsed > 0 &&
                      ` · ${log.creditsUsed} credit${log.creditsUsed > 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="shrink-0 text-xs text-[var(--sea-ink-soft)]">
                  {formatRelativeDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sign Out */}
      <section>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </section>
    </main>
  )
}
