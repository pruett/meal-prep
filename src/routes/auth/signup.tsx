import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { authClient } from '~/lib/auth-client'
import { api } from '../../../convex/_generated/api'
import { GoogleButton } from '~/components/auth/google-button'
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
        const userId = await convex.mutation(api.users.createFromAuth, {
          betterAuthId: result.data.user.id,
          email,
          name,
        })
        await convex.mutation(api.preferences.create, { userId })
        void router.navigate({ to: '/onboarding' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
          <GoogleButton callbackURL="/onboarding" onError={setError} />

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
