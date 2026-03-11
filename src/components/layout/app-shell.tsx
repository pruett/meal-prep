import { Link, useRouterState } from '@tanstack/react-router'

function useIsActive(to: string): boolean {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/' as const, label: 'Home', Icon: HomeIcon },
  { to: '/preferences' as const, label: 'Preferences', Icon: SlidersIcon },
  { to: '/account' as const, label: 'Account', Icon: UserIcon },
]

function SidebarLink({
  to,
  label,
  Icon,
}: {
  to: string
  label: string
  Icon: () => React.ReactNode
}) {
  const isActive = useIsActive(to)

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition ${
        isActive
          ? 'text-[var(--lagoon-deep)]'
          : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
      }`}
      style={
        isActive
          ? {
              background:
                'color-mix(in oklab, var(--lagoon) 10%, transparent)',
            }
          : undefined
      }
    >
      <Icon />
      {label}
    </Link>
  )
}

function BottomNavLink({
  to,
  label,
  Icon,
}: {
  to: string
  label: string
  Icon: () => React.ReactNode
}) {
  const isActive = useIsActive(to)

  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.625rem] font-semibold tracking-wide no-underline transition ${
        isActive
          ? 'text-[var(--lagoon-deep)]'
          : 'text-[var(--sea-ink-soft)]'
      }`}
    >
      <Icon />
      {label}
    </Link>
  )
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-[57px] hidden h-[calc(100dvh-57px)] w-52 shrink-0 flex-col border-r border-[var(--line)] lg:flex">
        <nav className="flex flex-col gap-0.5 px-3 pt-5">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <div className="min-w-0 flex-1 pb-[4.5rem] lg:pb-0">{children}</div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => (
            <BottomNavLink key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  )
}
