import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    mealPlanId: v.id('mealPlans'),
    userId: v.id('users'),
    name: v.string(),
    description: v.string(),
    keyIngredients: v.array(v.string()),
    estimatedPrepMinutes: v.number(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('meals', {
      mealPlanId: args.mealPlanId,
      userId: args.userId,
      name: args.name,
      description: args.description,
      keyIngredients: args.keyIngredients,
      estimatedPrepMinutes: args.estimatedPrepMinutes,
      status: 'pending',
      fullRecipe: null,
      sortOrder: args.sortOrder,
    })
  },
})

export const getByMealPlan = query({
  args: {
    mealPlanId: v.id('mealPlans'),
  },
  handler: async (ctx, args) => {
    const meals = await ctx.db
      .query('meals')
      .withIndex('by_mealPlan', (q) => q.eq('mealPlanId', args.mealPlanId))
      .collect()
    return meals.sort((a, b) => a.sortOrder - b.sortOrder)
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id('meals'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

export const deleteByMealPlanAndStatus = mutation({
  args: {
    mealPlanId: v.id('mealPlans'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
    ),
  },
  handler: async (ctx, args) => {
    const meals = await ctx.db
      .query('meals')
      .withIndex('by_mealPlan', (q) => q.eq('mealPlanId', args.mealPlanId))
      .collect()
    const toDelete = meals.filter((m) => m.status === args.status)
    for (const meal of toDelete) {
      await ctx.db.delete(meal._id)
    }
    return toDelete.length
  },
})

export const batchCreate = mutation({
  args: {
    meals: v.array(
      v.object({
        mealPlanId: v.id('mealPlans'),
        userId: v.id('users'),
        name: v.string(),
        description: v.string(),
        keyIngredients: v.array(v.string()),
        estimatedPrepMinutes: v.number(),
        sortOrder: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const ids = []
    for (const meal of args.meals) {
      const id = await ctx.db.insert('meals', {
        ...meal,
        status: 'pending',
        fullRecipe: null,
      })
      ids.push(id)
    }
    return ids
  },
})
