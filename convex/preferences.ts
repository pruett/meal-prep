import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('preferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    if (existing) {
      return existing._id
    }
    return await ctx.db.insert('preferences', {
      userId: args.userId,
      dietaryRestrictions: [],
      cuisinePreferences: [],
      mealsPerWeek: 7,
      householdSize: 2,
      maxPrepTimeMinutes: 45,
      kitchenEquipment: [],
      foodsToAvoid: '',
    })
  },
})

export const getByUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('preferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
  },
})

export const update = mutation({
  args: {
    userId: v.id('users'),
    dietaryRestrictions: v.optional(v.array(v.string())),
    cuisinePreferences: v.optional(
      v.array(
        v.object({
          cuisine: v.string(),
          preference: v.union(
            v.literal('like'),
            v.literal('neutral'),
            v.literal('dislike'),
          ),
        }),
      ),
    ),
    mealsPerWeek: v.optional(v.number()),
    householdSize: v.optional(v.number()),
    maxPrepTimeMinutes: v.optional(v.number()),
    kitchenEquipment: v.optional(v.array(v.string())),
    foodsToAvoid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('preferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    if (!existing) {
      throw new Error('Preferences not found for user')
    }
    const { userId: _, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined),
    )
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(existing._id, filtered)
    }
  },
})
