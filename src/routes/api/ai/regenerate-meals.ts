import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

export const Route = createFileRoute('/api/ai/regenerate-meals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest()
        if (auth instanceof Response) return auth
        const { user } = auth

        const body = await request.json()
        const { mealPlanId } = body
        if (!mealPlanId) {
          return jsonResponse({ error: 'mealPlanId is required' }, 400)
        }

        const existingMeals = await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId,
        })

        const acceptedMeals = existingMeals.filter(
          (m) => m.status === 'accepted',
        )
        const rejectedMeals = existingMeals.filter(
          (m) => m.status === 'rejected',
        )

        if (rejectedMeals.length === 0) {
          return jsonResponse({ error: 'No rejected meals to regenerate' }, 400)
        }

        // Sort rejected meals by sortOrder so we replace them in order
        const rejectedByOrder = [...rejectedMeals].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )

        const preferences = await fetchAuthQuery(api.preferences.getByUser, {
          userId: user._id,
        })

        await fetchAuthMutation(api.mealPlans.updateStatus, {
          id: mealPlanId,
          status: 'generating',
        })

        const prompt = buildMealSuggestionsPrompt(
          rejectedMeals.length,
          preferences,
          acceptedMeals.map((m) => ({
            name: m.name,
            description: m.description,
          })),
        )

        const result = await withRetry({
          fn: async () => {
            const stream = streamText({
              model: openai('gpt-4o-mini'),
              prompt,
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let index = 0
            for await (const meal of stream.elementStream) {
              if (index >= rejectedByOrder.length) break

              // Update the rejected meal in place — preserves sortOrder and position
              await fetchAuthMutation(api.meals.replaceContent, {
                id: rejectedByOrder[index]._id,
                name: meal.name,
                description: meal.description,
                keyIngredients: meal.keyIngredients,
                estimatedPrepMinutes: meal.estimatedPrepMinutes,
              })
              index++
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
          type: 'meal-regeneration',
          label: 'Meal regeneration',
          onFailure: async () => {
            await fetchAuthMutation(api.mealPlans.updateStatus, {
              id: mealPlanId,
              status: 'reviewing',
            })
          },
        })

        if ('error' in result) {
          return jsonResponse({ error: result.error, mealPlanId }, 500)
        }
        return jsonResponse({ mealPlanId })
      },
    },
  },
})
