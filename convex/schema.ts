import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const MEAL_PLAN_STATUSES = [
  'generating',
  'reviewing',
  'finalized',
  'archived',
] as const

export type MealPlanStatus = (typeof MEAL_PLAN_STATUSES)[number]

export default defineSchema({
  users: defineTable({
    betterAuthId: v.string(),
    email: v.string(),
    name: v.string(),
    generationsRemaining: v.number(),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
  }).index('by_betterAuthId', ['betterAuthId']),

  preferences: defineTable({
    userId: v.id('users'),
    dietaryRestrictions: v.array(v.string()),
    cuisinePreferences: v.array(
      v.object({
        cuisine: v.string(),
        preference: v.union(
          v.literal('like'),
          v.literal('neutral'),
          v.literal('dislike'),
        ),
      }),
    ),
    mealsPerWeek: v.number(),
    householdSize: v.number(),
    maxPrepTimeMinutes: v.number(),
    kitchenEquipment: v.array(v.string()),
    foodsToAvoid: v.string(),
  }).index('by_user', ['userId']),

  mealPlans: defineTable({
    userId: v.id('users'),
    weekStartDate: v.string(),
    status: v.union(
      v.literal('generating'),
      v.literal('reviewing'),
      v.literal('finalized'),
      v.literal('archived'),
    ),
    totalMealsRequested: v.number(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_week', ['userId', 'weekStartDate']),

  meals: defineTable({
    mealPlanId: v.id('mealPlans'),
    userId: v.id('users'),
    name: v.string(),
    description: v.string(),
    keyIngredients: v.array(v.string()),
    estimatedPrepMinutes: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
    ),
    fullRecipe: v.union(
      v.object({
        ingredients: v.array(
          v.object({
            name: v.string(),
            quantity: v.string(),
            unit: v.string(),
          }),
        ),
        instructions: v.array(v.string()),
        nutritionEstimate: v.union(
          v.object({
            calories: v.number(),
            protein: v.number(),
            carbs: v.number(),
            fat: v.number(),
          }),
          v.null(),
        ),
      }),
      v.null(),
    ),
    sortOrder: v.number(),
  })
    .index('by_mealPlan', ['mealPlanId'])
    .index('by_user', ['userId']),

  prepGuides: defineTable({
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
    createdAt: v.number(),
  }),

  generationLogs: defineTable({
    userId: v.id('users'),
    type: v.union(
      v.literal('meal-suggestions'),
      v.literal('meal-regeneration'),
      v.literal('prep-guide'),
    ),
    provider: v.union(v.literal('openai'), v.literal('anthropic')),
    creditsUsed: v.number(),
    status: v.union(v.literal('success'), v.literal('failed')),
    createdAt: v.number(),
  }),
})
