import { createFileRoute } from '@tanstack/react-router'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { api } from '../../../../convex/_generated/api'
import { prepGuideOutputSchema } from '~/lib/ai/schemas'
import { buildPrepGuidePrompt } from '~/lib/ai/prompts'
import { authenticateRequest, jsonResponse, withRetry } from '~/lib/ai/generate'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

export const Route = createFileRoute('/api/ai/generate-prep')({
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

        const meals = await fetchAuthQuery(api.meals.getByMealPlan, {
          mealPlanId,
        })
        const acceptedMeals = meals.filter((m) => m.status === 'accepted')

        if (acceptedMeals.length === 0) {
          return jsonResponse(
            { error: 'No accepted meals to generate prep guide for' },
            400,
          )
        }

        const preferences = await fetchAuthQuery(api.preferences.getByUser, {
          userId: user._id,
        })
        const householdSize = preferences?.householdSize ?? 2

        const prompt = buildPrepGuidePrompt(
          acceptedMeals.map((m) => ({
            name: m.name,
            description: m.description,
            keyIngredients: m.keyIngredients,
            estimatedPrepMinutes: m.estimatedPrepMinutes,
          })),
          householdSize,
        )

        const result = await withRetry({
          fn: async () => {
            const { object: prepGuide } = await generateObject({
              model: openai('gpt-4o-mini'),
              prompt,
              schema: prepGuideOutputSchema,
            })

            // Update each meal's fullRecipe by matching on mealName
            for (const recipe of prepGuide.recipes) {
              const matchingMeal = acceptedMeals.find(
                (m) => m.name === recipe.mealName,
              )
              if (matchingMeal) {
                await fetchAuthMutation(api.meals.updateFullRecipe, {
                  id: matchingMeal._id,
                  fullRecipe: {
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                    nutritionEstimate: recipe.nutritionEstimate,
                  },
                })
              }
            }

            // Create prep guide doc
            await fetchAuthMutation(api.prepGuides.create, {
              mealPlanId,
              userId: user._id,
              shoppingList: prepGuide.shoppingList,
              batchPrepSteps: prepGuide.batchPrepSteps,
              totalEstimatedMinutes: prepGuide.totalEstimatedMinutes,
            })

            // Finalize the plan
            await fetchAuthMutation(api.mealPlans.updateStatus, {
              id: mealPlanId,
              status: 'finalized',
            })
          },
          userId: user._id,
          type: 'prep-guide',
          label: 'Prep guide generation',
        })

        if ('error' in result) {
          return jsonResponse({ error: result.error, mealPlanId }, 500)
        }
        return jsonResponse({ mealPlanId })
      },
    },
  },
})
