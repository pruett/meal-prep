import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'

function AlertIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  )
}

interface ErrorFallbackProps {
  error: Error
  reset?: () => void
  title?: string
  compact?: boolean
}

/**
 * Presentational error fallback. Works as:
 * - A TanStack Router `errorComponent` (receives `{ error, reset }`)
 * - The fallback UI for the `ErrorBoundary` class component
 * - A standalone error display anywhere in the app
 */
export function ErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  compact = false,
}: ErrorFallbackProps) {
  let routerReset: (() => void) | undefined
  try {
    const router = useRouter()
    routerReset = () => router.invalidate()
  } catch {
    // Not inside a router context — that's fine
  }

  const handleRetry = reset ?? routerReset ?? (() => window.location.reload())

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--destructive, #dc2626)' }}
        >
          <AlertIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--sea-ink)' }}>
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--sea-ink-soft)' }}>
            {error.message}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshIcon />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="rise-in flex min-h-[40vh] items-center justify-center px-4 py-12">
      <div className="island-shell w-full max-w-md rounded-2xl p-8 text-center">
        <div
          className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: 'var(--destructive, #dc2626)' }}
        >
          <AlertIcon />
        </div>

        <h2
          className="display-title text-xl font-bold"
          style={{ color: 'var(--sea-ink)' }}
        >
          {title}
        </h2>

        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: 'var(--sea-ink-soft)' }}
        >
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="mt-6">
          <Button onClick={handleRetry}>
            <RefreshIcon />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  title?: string
  compact?: boolean
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Class-based React error boundary that catches render errors in its subtree.
 * Renders `ErrorFallback` (or a custom fallback) when an error is caught.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <ErrorFallback
          error={this.state.error}
          reset={this.reset}
          title={this.props.title}
          compact={this.props.compact}
        />
      )
    }
    return this.props.children
  }
}
