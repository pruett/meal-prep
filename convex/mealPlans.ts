import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    userId: v.id('users'),
    weekStartDate: v.string(),
    totalMealsRequested: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('mealPlans', {
      userId: args.userId,
      weekStartDate: args.weekStartDate,
      status: 'generating',
      totalMealsRequested: args.totalMealsRequested,
      createdAt: Date.now(),
    })
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id('mealPlans'),
    status: v.union(
      v.literal('generating'),
      v.literal('reviewing'),
      v.literal('finalized'),
      v.literal('archived'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

export const getByUserAndWeek = query({
  args: {
    userId: v.id('users'),
    weekStartDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('mealPlans')
      .withIndex('by_user_week', (q) =>
        q.eq('userId', args.userId).eq('weekStartDate', args.weekStartDate),
      )
      .unique()
  },
})

export const getByUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('mealPlans')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})
