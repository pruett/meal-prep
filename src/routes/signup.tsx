import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { CookingPot } from '@phosphor-icons/react'
import { authClient } from '~/lib/auth-client'
import { api } from '../../convex/_generated/api'
import { GoogleButton } from '~/components/auth/google-button'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '~/components/ui/field'

export const Route = createFileRoute('/signup')({
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
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <CookingPot className="size-6" weight="duotone" />
                </div>
              </div>
              <h1 className="text-xl font-bold">Create your account</h1>
              <FieldDescription>
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </FieldDescription>
            </div>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
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
            </Field>
            {error && (
              <FieldError>{error}</FieldError>
            )}
            <Field>
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
            </Field>
            <FieldSeparator>Or</FieldSeparator>
            <Field>
              <GoogleButton callbackURL="/onboarding" onError={setError} />
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
