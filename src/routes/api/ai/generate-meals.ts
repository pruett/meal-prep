import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'

export const Route = createFileRoute('/api/ai/generate-meals')({
  server: {
    handlers: {
      POST: async () => {
        const auth = await authenticateRequest()
        if (auth instanceof Response) return auth
        const { convex, user } = auth

        const preferences = await convex.query(api.preferences.getByUser, {
          userId: user._id,
        })

        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.getFullYear(), now.getMonth(), diff)
        const weekStartDate = monday.toISOString().split('T')[0]!
        const totalMeals = preferences?.mealsPerWeek ?? 7

        const mealPlanId = await convex.mutation(api.mealPlans.create, {
          userId: user._id,
          weekStartDate,
          totalMealsRequested: totalMeals,
        })

        const result = await withRetry({
          fn: async () => {
            const stream = streamText({
              model: openai('gpt-4o-mini'),
              prompt: buildMealSuggestionsPrompt(totalMeals, preferences),
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let sortOrder = 0
            for await (const meal of stream.elementStream) {
              await convex.mutation(api.meals.create, {
                mealPlanId,
                userId: user._id,
                name: meal.name,
                description: meal.description,
                keyIngredients: meal.keyIngredients,
                estimatedPrepMinutes: meal.estimatedPrepMinutes,
                sortOrder: sortOrder++,
              })
            }

            await convex.mutation(api.mealPlans.updateStatus, {
              id: mealPlanId,
              status: 'reviewing',
            })
          },
          convex,
          userId: user._id,
          type: 'meal-suggestions',
          label: 'Meal generation',
        })

        if ('error' in result) {
          return jsonResponse({ error: result.error, mealPlanId }, 500)
        }
        return jsonResponse({ mealPlanId })
      },
    },
  },
})
