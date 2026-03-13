import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import Footer from '../components/Footer'
import Header from '../components/layout/header'
import AppShell from '../components/layout/app-shell'
import { Toaster } from '~/components/ui/sonner'
import { ErrorFallback } from '~/components/error-boundary'
import { Skeleton } from '~/components/ui/skeleton'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { api } from '../../convex/_generated/api'
import { getToken, fetchAuthQuery } from '~/lib/auth-server'
import { authClient } from '~/lib/auth-client'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { ConvexQueryClient } from '@convex-dev/react-query'

interface MyRouterContext {
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getToken()
  if (!token) return { token: null, onboardingCompleted: undefined as boolean | undefined }

  const user = await fetchAuthQuery(api.users.getAuthenticated, {})

  return { token, onboardingCompleted: user?.onboardingCompleted }
})

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async (ctx) => {
    const { token, onboardingCompleted } = await getAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { token, onboardingCompleted }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  errorComponent: ErrorFallback,
  pendingComponent: DefaultPendingFallback,
})

function DefaultPendingFallback() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}

function RootComponent() {
  const { token, convexQueryClient } = Route.useRouteContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isAuthRoute = pathname.startsWith('/auth/')
  const isOnboardingRoute = pathname.startsWith('/onboarding/')
  const showAppShell = !!token && !isAuthRoute && !isOnboardingRoute

  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={token}
    >
      <Header />
      {showAppShell ? (
        <AppShell>
          <Outlet />
        </AppShell>
      ) : (
        <>
          <Outlet />
          <Footer />
        </>
      )}
      <Toaster position="bottom-center" />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <TanStackQueryProvider>
          {children}
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
