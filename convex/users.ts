import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

export const getAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    let authUser
    try {
      authUser = await authComponent.getAuthUser(ctx)
    } catch {
      return null
    }
    if (!authUser) return null
    return await ctx.db
      .query('users')
      .withIndex('by_betterAuthId', (q) =>
        q.eq('betterAuthId', authUser._id as string),
      )
      .unique()
  },
})

export const createFromAuth = mutation({
  args: {
    betterAuthId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_betterAuthId', (q) =>
        q.eq('betterAuthId', args.betterAuthId),
      )
      .unique()
    if (existing) {
      return existing._id
    }
    return await ctx.db.insert('users', {
      betterAuthId: args.betterAuthId,
      email: args.email,
      name: args.name,
      generationsRemaining: 25,
      onboardingCompleted: false,
      createdAt: Date.now(),
    })
  },
})

export const getByBetterAuthId = query({
  args: {
    betterAuthId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_betterAuthId', (q) =>
        q.eq('betterAuthId', args.betterAuthId),
      )
      .unique()
  },
})

export const decrementCredits = mutation({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id)
    if (!user) {
      throw new Error('User not found')
    }
    if (user.generationsRemaining <= 0) {
      throw new Error('No credits remaining')
    }
    await ctx.db.patch(args.id, {
      generationsRemaining: user.generationsRemaining - 1,
    })
  },
})

export const completeOnboarding = mutation({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { onboardingCompleted: true })
  },
})
