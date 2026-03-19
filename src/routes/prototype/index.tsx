import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/prototype/')({
  component: PrototypeIndex,
})

function PrototypeIndex() {
  const prototypes = [
    {
      to: '/prototype/swipe' as const,
      title: 'Swipe Stack',
      description:
        'Tinder-style stacked cards. Drag right to keep, left to dismiss. One meal at a time, satisfying gesture physics.',
      vibe: 'Playful & tactile',
    },
    {
      to: '/prototype/stories' as const,
      title: 'Stories Flow',
      description:
        'Full-screen immersive cards like Instagram stories. Tap through rapidly, swipe up to keep.',
      vibe: 'Fast & immersive',
    },
    {
      to: '/prototype/roulette' as const,
      title: 'Meal Roulette',
      description:
        'Dramatic one-at-a-time reveal. Spin for the next meal, heart to keep. Slot-machine excitement.',
      vibe: 'Exciting & gamified',
    },
    {
      to: '/prototype/quick-tap' as const,
      title: 'Quick Tap Grid',
      description:
        'Compact 2-column grid. Single tap to toggle. Fastest bulk selection for the decisive mom.',
      vibe: 'Efficient & decisive',
    },
    {
      to: '/prototype/swipe-list' as const,
      title: 'Swipe List',
      description:
        'Mail-style swipeable rows with meal photos. Slide right to keep, left to dismiss. Action backgrounds reveal intent.',
      vibe: 'Familiar & fluid',
    },
  ]

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="text-2xl font-bold tracking-tight">
        Meal Selection Prototypes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        4 interaction models for choosing weekly meals
      </p>
      <div className="mt-6 grid gap-4">
        {prototypes.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {p.vibe}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {p.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}
