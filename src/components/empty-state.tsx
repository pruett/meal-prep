import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sand)]">
        <span className="text-[var(--sea-ink-soft)]">{icon}</span>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
        {title}
      </h3>
      <p className="max-w-[260px] text-sm leading-relaxed text-[var(--sea-ink-soft)]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
