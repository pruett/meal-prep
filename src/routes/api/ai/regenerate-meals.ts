import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'

export const Route = createFileRoute('/api/ai/regenerate-meals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest()
        if (auth instanceof Response) return auth
        const { convex, user } = auth

        const body = await request.json()
        const { mealPlanId } = body
        if (!mealPlanId) {
          return jsonResponse({ error: 'mealPlanId is required' }, 400)
        }

        const existingMeals = await convex.query(api.meals.getByMealPlan, {
          mealPlanId,
        })

        const acceptedMeals = existingMeals.filter(
          (m) => m.status === 'accepted',
        )
        const rejectedCount = existingMeals.filter(
          (m) => m.status === 'rejected',
        ).length

        if (rejectedCount === 0) {
          return jsonResponse({ error: 'No rejected meals to regenerate' }, 400)
        }

        const preferences = await convex.query(api.preferences.getByUser, {
          userId: user._id,
        })

        await convex.mutation(api.meals.deleteByMealPlanAndStatus, {
          mealPlanId,
          status: 'rejected',
        })

        await convex.mutation(api.mealPlans.updateStatus, {
          id: mealPlanId,
          status: 'generating',
        })

        const prompt = buildMealSuggestionsPrompt(
          rejectedCount,
          preferences,
          acceptedMeals.map((m) => ({
            name: m.name,
            description: m.description,
          })),
        )

        const nextSortOrder =
          existingMeals.length > 0
            ? Math.max(...existingMeals.map((m) => m.sortOrder)) + 1
            : 0

        const result = await withRetry({
          fn: async () => {
            const stream = streamText({
              model: openai('gpt-4o-mini'),
              prompt,
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let sortOrder = nextSortOrder
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
          type: 'meal-regeneration',
          label: 'Meal regeneration',
          onFailure: async () => {
            await convex.mutation(api.mealPlans.updateStatus, {
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
