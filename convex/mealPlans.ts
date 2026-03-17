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

export const deletePlan = mutation({
  args: {
    id: v.id('mealPlans'),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.id)
    if (!plan) throw new Error('Plan not found')

    // Delete associated meals
    const meals = await ctx.db
      .query('meals')
      .withIndex('by_mealPlan', (q) => q.eq('mealPlanId', args.id))
      .collect()
    for (const meal of meals) {
      await ctx.db.delete(meal._id)
    }

    // Delete associated prep guides
    const prepGuides = await ctx.db
      .query('prepGuides')
      .filter((q) => q.eq(q.field('mealPlanId'), args.id))
      .collect()
    for (const guide of prepGuides) {
      await ctx.db.delete(guide._id)
    }

    // Delete the plan itself
    await ctx.db.delete(args.id)
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
