import { Skeleton } from '~/components/ui/skeleton'

// ─── Shared Building Blocks ───────────────────────────────────────────────────

function PageHeader({ kicker, titleWidth = 'w-48' }: { kicker: string; titleWidth?: string }) {
  return (
    <section className="mb-8">
      <p className="island-kicker mb-2">{kicker}</p>
      <Skeleton className={`h-9 ${titleWidth} mb-1`} />
      <Skeleton className="h-4 w-56" />
    </section>
  )
}

function SectionHeading() {
  return <Skeleton className="mb-3 h-3 w-24" />
}

function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-4 w-4 shrink-0" />
      </div>
    </div>
  )
}


// ─── Home Page Skeleton ───────────────────────────────────────────────────────

export function HomeSkeleton() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <PageHeader kicker="Home" titleWidth="w-36" />

      {/* This Week */}
      <section className="mb-10">
        <SectionHeading />
        <CardSkeleton />
      </section>

      {/* Past Plans */}
      <section>
        <SectionHeading />
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    </main>
  )
}

// ─── Meal Plan Page Skeleton ──────────────────────────────────────────────────

export function MealPlanSkeleton() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <PageHeader kicker="Meal Plan" titleWidth="w-44" />

      {/* Status banner skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </div>

      {/* Meals grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <div className="mb-3 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
    </main>
  )
}

// ─── Prep Guide Page Skeleton ─────────────────────────────────────────────────

export function PrepGuideSkeleton() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {/* Back link */}
      <Skeleton className="mb-4 h-4 w-36" />
      <PageHeader kicker="Prep Guide" titleWidth="w-44" />

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>

      {/* Recipe cards skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <Skeleton className="mb-3 h-6 w-48" />
            <Skeleton className="mb-4 h-4 w-full" />
            <div className="mb-4 flex gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

// ─── Preferences Page Skeleton ────────────────────────────────────────────────

export function PreferencesSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Sticky header skeleton */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <Skeleton className="h-5 w-28" />
        </div>

        {/* Tab bar skeleton */}
        <div className="flex gap-1 px-4 pb-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-8 shrink-0 rounded-full"
              style={{ width: `${[80, 64, 76, 68, 84][i]}px` }}
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto w-full max-w-md px-4 pt-8">
        <Skeleton className="mb-2 h-7 w-36" />
        <Skeleton className="mb-6 h-4 w-52" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Account Page Skeleton ────────────────────────────────────────────────────

export function AccountSkeleton() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <PageHeader kicker="Account" titleWidth="w-44" />

      {/* Profile card */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <Skeleton className="mb-4 h-4 w-36" />
        <Skeleton className="mb-3 h-10 w-16" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>

      {/* Generation History */}
      <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <Skeleton className="mb-4 h-4 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white/40 px-3.5 py-2.5"
            >
              <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Sign out button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </main>
  )
}
