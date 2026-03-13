import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { authClient } from '~/lib/auth-client'
import { ModeToggle } from '~/components/mode-toggle'

function CreditsBadge({ credits }: { credits: number }) {
  const isLow = credits <= 5
  const isEmpty = credits === 0

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums transition"
      style={{
        borderColor: isEmpty
          ? 'rgba(220, 38, 38, 0.3)'
          : isLow
            ? 'rgba(217, 119, 6, 0.3)'
            : 'var(--chip-line)',
        background: isEmpty
          ? 'rgba(220, 38, 38, 0.08)'
          : isLow
            ? 'rgba(217, 119, 6, 0.08)'
            : 'var(--chip-bg)',
        color: isEmpty
          ? 'rgb(185, 28, 28)'
          : isLow
            ? 'rgb(180, 83, 9)'
            : 'var(--lagoon-deep)',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      {credits}
    </div>
  )
}

function UserMenu() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--sand)]" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--lagoon), var(--palm))',
            color: 'white',
          }}
        >
          {session.user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <button
          onClick={() => {
            void authClient.signOut()
          }}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/auth/login"
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3.5 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_4px_16px_rgba(30,90,72,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(30,90,72,0.1)]"
    >
      Sign in
    </Link>
  )
}

export default function Header() {
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  const { data: user } = useQuery({
    ...convexQuery(api.users.getAuthenticated, isAuthenticated ? {} : 'skip'),
  })

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-3 py-3">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,var(--lagoon),var(--palm))]" />
            MealPrep
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {user && (
            <CreditsBadge credits={user.generationsRemaining} />
          )}
          <UserMenu />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
