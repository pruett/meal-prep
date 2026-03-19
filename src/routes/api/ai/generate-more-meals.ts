import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

export const Route = createFileRoute('/api/ai/generate-more-meals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest()
        if (auth instanceof Response) return auth
        const { user } = auth

        const body = await request.json()
        const { mealPlanId, count } = body
        if (!mealPlanId) {
          return jsonResponse({ error: 'mealPlanId is required' }, 400)
        }

        const existingMeals = await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId,
        })

        const acceptedMeals = existingMeals.filter((m) => m.status === 'accepted')

        const preferences = await fetchAuthQuery(api.preferences.getByUser, {
          userId: user._id,
        })

        const mealsPerWeek = preferences?.mealsPerWeek ?? {
          breakfast: 0,
          lunch: 0,
          dinner: 5,
        }
        const totalSlots =
          mealsPerWeek.breakfast + mealsPerWeek.lunch + mealsPerWeek.dinner
        const needed = Math.max(0, totalSlots - acceptedMeals.length)

        if (needed === 0) {
          return jsonResponse(
            { error: 'You already have enough meals accepted' },
            400,
          )
        }

        // Delete rejected meals — new ones will get fresh IDs
        await fetchAuthMutation(api.meals.deleteByMealPlanAndStatus, {
          mealPlanId,
          status: 'rejected',
        })

        const toGenerate = typeof count === 'number' && count > 0
          ? Math.min(count, needed + 3)
          : needed + 3
        const maxSortOrder = existingMeals.reduce(
          (max, m) => Math.max(max, m.sortOrder),
          0,
        )

        const result = await withRetry({
          fn: async () => {
            const stream = streamText({
              model: openai('gpt-4o-mini'),
              prompt: buildMealSuggestionsPrompt(
                toGenerate,
                preferences,
                acceptedMeals.map((m) => ({
                  name: m.name,
                  description: m.description,
                })),
              ),
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let sortOrder = maxSortOrder + 1
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
          },
          userId: user._id,
          type: 'meal-regeneration',
          label: 'Generate more meals',
        })

        if ('error' in result) {
          return jsonResponse({ error: result.error, mealPlanId }, 500)
        }
        return jsonResponse({ mealPlanId })
      },
    },
  },
})
