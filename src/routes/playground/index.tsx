import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, ChevronRight, Layers, PanelBottom, SlidersHorizontal, SwatchBook } from "lucide-react"
import { Button } from "~/components/ui/button"

export const Route = createFileRoute("/playground/")({
  component: PlaygroundIndex,
})

const PROTOTYPES = [
  {
    to: "/playground/prefs-drawer" as const,
    icon: PanelBottom,
    title: "A — Drawer Cards",
    description: "Summary cards with bottom-sheet editor. iOS Settings pattern — compact overview, drill into details.",
  },
  {
    to: "/playground/prefs-tabs" as const,
    icon: SlidersHorizontal,
    title: "B — Scrollable Tabs",
    description: "Horizontal pill tabs for instant category switching. Same animated transitions as onboarding.",
  },
  {
    to: "/playground/prefs-stepper" as const,
    icon: Layers,
    title: "C — Stepper Remix",
    description: "Identical to onboarding wizard, but progress dots are tappable. Summary step with jump-to-edit.",
  },
  {
    to: "/playground/swipe-list" as const,
    icon: SwatchBook,
    title: "Swipe List",
    description: "SwipeList component playground with mock meal data.",
  },
]

function PlaygroundIndex() {
  return (
    <div className="min-h-dvh bg-background px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-2">
          <Button variant="ghost" size="sm" render={<Link to="/" />}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Home
          </Button>
        </div>

        <h1 className="mb-1 text-2xl font-bold tracking-tight">Playground</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Prototype UIs for preferences flow
        </p>

        <div className="flex flex-col gap-3">
          {PROTOTYPES.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent/50 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <p.icon className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {p.description}
                </div>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
