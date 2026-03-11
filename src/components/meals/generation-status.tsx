import { cn } from '~/lib/utils'

interface GenerationStatusProps {
  status: 'generating' | 'reviewing' | 'finalized' | 'archived'
  totalMeals: number
  mealsCount: number
  acceptedCount: number
  rejectedCount: number
}

export function GenerationStatus({
  status,
  totalMeals,
  mealsCount,
  acceptedCount,
  rejectedCount,
}: GenerationStatusProps) {
  const pendingCount = mealsCount - acceptedCount - rejectedCount

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        status === 'generating' &&
          'border-[var(--lagoon)]/25 bg-[var(--lagoon)]/[0.06]',
        status === 'reviewing' &&
          'border-[var(--lagoon)]/25 bg-[var(--lagoon)]/[0.06]',
        status === 'finalized' &&
          'border-[var(--palm)]/25 bg-[var(--palm)]/[0.06]',
        status === 'archived' && 'border-[var(--line)] bg-[var(--surface)]',
      )}
    >
      {/* Status icon */}
      <div className="flex shrink-0 items-center">
        {status === 'generating' && <GeneratingIcon />}
        {status === 'reviewing' && <ReviewingIcon />}
        {status === 'finalized' && <FinalizedIcon />}
        {status === 'archived' && <ArchivedIcon />}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-semibold',
              status === 'generating' && 'text-[var(--lagoon-deep)]',
              status === 'reviewing' && 'text-[var(--lagoon-deep)]',
              status === 'finalized' && 'text-[var(--palm)]',
              status === 'archived' && 'text-[var(--sea-ink-soft)]',
            )}
          >
            {status === 'generating' && 'Generating meals…'}
            {status === 'reviewing' && 'Review your meals'}
            {status === 'finalized' && 'Plan finalized'}
            {status === 'archived' && 'Archived'}
          </span>
        </div>
        <p className="text-xs text-[var(--sea-ink-soft)]">
          {status === 'generating' &&
            `${mealsCount} of ${totalMeals} meals ready`}
          {status === 'reviewing' && (
            <>
              <span className="font-medium text-[var(--palm)]">
                {acceptedCount} accepted
              </span>
              {rejectedCount > 0 && (
                <>
                  {' · '}
                  <span className="font-medium text-destructive">
                    {rejectedCount} rejected
                  </span>
                </>
              )}
              {pendingCount > 0 && <> · {pendingCount} to review</>}
            </>
          )}
          {status === 'finalized' &&
            `${acceptedCount} meals ready for prep`}
          {status === 'archived' &&
            `${mealsCount} meals · ${acceptedCount} accepted`}
        </p>
      </div>

      {/* Progress bar for generating */}
      {status === 'generating' && (
        <div className="flex w-16 shrink-0 items-center">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lagoon)]/15">
            <div
              className="h-full rounded-full bg-[var(--lagoon)] transition-all duration-500 ease-out"
              style={{
                width: `${totalMeals > 0 ? (mealsCount / totalMeals) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function GeneratingIcon() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      <svg
        className="animate-spin text-[var(--lagoon)]"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function ReviewingIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lagoon)]/15">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--lagoon-deep)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </div>
  )
}

function FinalizedIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--palm)]/15">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--palm)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function ArchivedIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sea-ink-soft)]/10">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--sea-ink-soft)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8v13H3V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    </div>
  )
}
