import { betterAuth } from 'better-auth/minimal'
import { createAuthMiddleware } from 'better-auth/api'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components, internal } from './_generated/api'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'

const siteUrl = process.env.SITE_URL!

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    hooks: {
      after: createAuthMiddleware(async (middlewareCtx) => {
        if (
          middlewareCtx.path.startsWith('/callback') ||
          middlewareCtx.path.startsWith('/sign-up')
        ) {
          const newSession = middlewareCtx.context.newSession
          if (newSession && 'runMutation' in ctx) {
            await ctx.runMutation(
              internal.users.createWithPreferences,
              {
                betterAuthId: newSession.user.id,
                email: newSession.user.email,
                name: newSession.user.name,
              },
            )
          }
        }
      }),
    },
    plugins: [convex({ authConfig })],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await authComponent.getAuthUser(ctx)
    } catch {
      return null
    }
  },
})
