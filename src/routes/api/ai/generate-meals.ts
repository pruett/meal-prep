import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

export const Route = createFileRoute('/api/ai/generate-meals')({
  server: {
    handlers: {
      POST: async () => {
        const auth = await authenticateRequest()
        if (auth instanceof Response) return auth
        const { user } = auth

        const preferences = await fetchAuthQuery(api.preferences.getByUser, {
          userId: user._id,
        })

        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.getFullYear(), now.getMonth(), diff)
        const weekStartDate = monday.toISOString().split('T')[0]!
        const mealsPerWeek = preferences?.mealsPerWeek ?? { breakfast: 0, lunch: 0, dinner: 5 }
        const totalMeals = mealsPerWeek.breakfast + mealsPerWeek.lunch + mealsPerWeek.dinner

        const mealPlanId = await fetchAuthMutation(api.mealPlans.create, {
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
              await fetchAuthMutation(api.meals.create, {
                mealPlanId,
                userId: user._id,
                name: meal.name,
                description: meal.description,
                keyIngredients: meal.keyIngredients,
                estimatedPrepMinutes: meal.estimatedPrepMinutes,
                imagePrompt: meal.imagePrompt,
                sortOrder: sortOrder++,
              })
            }

            const finishReason = await stream.finishReason
            if (finishReason === 'error') {
              throw new Error('AI stream failed')
            }

            await fetchAuthMutation(api.mealPlans.updateStatus, {
              id: mealPlanId,
              status: 'reviewing',
            })
          },
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
