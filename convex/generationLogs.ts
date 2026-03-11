import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('meal-suggestions'),
      v.literal('meal-regeneration'),
      v.literal('prep-guide'),
    ),
    provider: v.union(v.literal('openai'), v.literal('anthropic')),
    creditsUsed: v.number(),
    status: v.union(v.literal('success'), v.literal('failed')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('generationLogs', {
      userId: args.userId,
      type: args.type,
      provider: args.provider,
      creditsUsed: args.creditsUsed,
      status: args.status,
      createdAt: Date.now(),
    })
  },
})

export const getByUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generationLogs')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect()
  },
})
