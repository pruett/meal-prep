import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { authClient } from '~/lib/auth-client'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
})

function SignupPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (sessionPending) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--lagoon)]" />
      </div>
    )
  }

  if (session?.user) {
    void router.navigate({ to: '/' })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })
      if (result.error) {
        setError(result.error.message || 'Could not create account')
      } else {
        const convex = new ConvexHttpClient(
          import.meta.env.VITE_CONVEX_URL as string,
        )
        await convex.mutation(api.users.createFromAuth, {
          betterAuthId: result.data.user.id,
          email,
          name,
        })
        void router.navigate({ to: '/onboarding/diet' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/onboarding/diet',
      })
    } catch {
      setError('Google sign-up failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="rise-in w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="island-kicker mb-2">Get started</p>
          <h1 className="display-title text-2xl font-semibold tracking-tight text-[var(--sea-ink)]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            Meal planning, simplified.
          </p>
        </div>

        <div className="island-shell rounded-xl p-6">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium uppercase tracking-widest text-[var(--sea-ink-soft)]">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--sea-ink-soft)]">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-[var(--lagoon-deep)] hover:text-[var(--lagoon)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
