import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    mealPlanId: v.id('mealPlans'),
    userId: v.id('users'),
    shoppingList: v.array(
      v.object({
        item: v.string(),
        quantity: v.string(),
        unit: v.string(),
        category: v.string(),
      }),
    ),
    batchPrepSteps: v.array(
      v.object({
        stepNumber: v.number(),
        instruction: v.string(),
        estimatedMinutes: v.number(),
        relatedMeals: v.array(v.string()),
      }),
    ),
    totalEstimatedMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('prepGuides', {
      mealPlanId: args.mealPlanId,
      userId: args.userId,
      shoppingList: args.shoppingList,
      batchPrepSteps: args.batchPrepSteps,
      totalEstimatedMinutes: args.totalEstimatedMinutes,
      createdAt: Date.now(),
    })
  },
})

export const getByMealPlan = query({
  args: {
    mealPlanId: v.id('mealPlans'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('prepGuides')
      .filter((q) => q.eq(q.field('mealPlanId'), args.mealPlanId))
      .unique()
  },
})
