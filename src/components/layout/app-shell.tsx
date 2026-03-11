import { SidebarNav, BottomNav } from './nav'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-[57px] hidden h-[calc(100dvh-57px)] w-52 shrink-0 flex-col border-r border-[var(--line)] lg:flex">
        <SidebarNav />
      </aside>

      {/* Main content — extra bottom padding on mobile for bottom nav */}
      <div className="min-w-0 flex-1 pb-[4.5rem] lg:pb-0">{children}</div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
