import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import Header from "../components/layout/header";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { ErrorFallback } from "~/components/error-boundary";
import { Skeleton } from "~/components/ui/skeleton";

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import { api } from "../../convex/_generated/api";
import { getToken, fetchAuthQuery } from "~/lib/auth-server";
import { authClient } from "~/lib/auth-client";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { ConvexQueryClient } from "@convex-dev/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  if (!token)
    return {
      token: null,
      onboardingCompleted: undefined as boolean | undefined,
      user: null,
    };

  const user = await fetchAuthQuery(api.users.getAuthenticated, {});

  return {
    token,
    onboardingCompleted: user?.onboardingCompleted,
    user: user ?? null,
  };
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async (ctx) => {
    const { token, onboardingCompleted, user } = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { token, onboardingCompleted, user };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: 'Tastebud',
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  errorComponent: ErrorFallback,
  pendingComponent: DefaultPendingFallback,
  notFoundComponent: DefaultNotFoundComponent,
});

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
  );
}

function DefaultNotFoundComponent() {
  return (
    <main className="page-wrap flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <a href="/" className="mt-6 text-sm font-medium text-primary hover:underline">
        Go home
      </a>
    </main>
  );
}

function RootComponent() {
  const { token, convexQueryClient } = Route.useRouteContext();

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ConvexBetterAuthProvider
        client={convexQueryClient.convexClient}
        authClient={authClient}
        initialToken={token}
      >
        <Header />
        <Outlet />
        <Toaster position="bottom-center" />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      </ConvexBetterAuthProvider>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="light"
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(230,184,162,0.24)]">
        <TanStackQueryProvider>
          {children}
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
