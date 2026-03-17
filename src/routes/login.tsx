import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CookingPot } from '@phosphor-icons/react'
import { authClient } from '~/lib/auth-client'
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

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = authClient.useSession()
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
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || 'Invalid email or password')
      } else {
        void router.navigate({ to: '/' })
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
              <h1 className="text-xl font-bold">Welcome to MealPrep</h1>
              <FieldDescription>
                Don&apos;t have an account?{' '}
                <Link to="/signup">Sign up</Link>
              </FieldDescription>
            </div>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
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
                    Signing in…
                  </span>
                ) : (
                  'Login'
                )}
              </Button>
            </Field>
            <FieldSeparator>Or</FieldSeparator>
            <Field>
              <GoogleButton callbackURL="/" onError={setError} />
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
