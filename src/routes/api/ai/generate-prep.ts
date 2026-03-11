import { createFileRoute } from '@tanstack/react-router'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'
import { prepGuideOutputSchema } from '~/lib/ai/schemas'
import { buildPrepGuidePrompt } from '~/lib/ai/prompts'
import { getToken } from '~/lib/auth-server'

const MAX_RETRIES = 2

export const Route = createFileRoute('/api/ai/generate-prep')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = await getToken()
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
        convex.setAuth(token)

        const user = await convex.query(api.users.getAuthenticated, {})
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (user.generationsRemaining <= 0) {
          return new Response(
            JSON.stringify({ error: 'No credits remaining' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const body = await request.json()
        const { mealPlanId } = body
        if (!mealPlanId) {
          return new Response(
            JSON.stringify({ error: 'mealPlanId is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const meals = await convex.query(api.meals.getByMealPlan, {
          mealPlanId,
        })
        const acceptedMeals = meals.filter((m) => m.status === 'accepted')

        if (acceptedMeals.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No accepted meals to generate prep guide for' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const preferences = await convex.query(api.preferences.getByUser, {
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

        let lastError: unknown
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
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
                await convex.mutation(api.meals.updateFullRecipe, {
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
            await convex.mutation(api.prepGuides.create, {
              mealPlanId,
              userId: user._id,
              shoppingList: prepGuide.shoppingList,
              batchPrepSteps: prepGuide.batchPrepSteps,
              totalEstimatedMinutes: prepGuide.totalEstimatedMinutes,
            })

            // Finalize the plan
            await convex.mutation(api.mealPlans.updateStatus, {
              id: mealPlanId,
              status: 'finalized',
            })

            await convex.mutation(api.users.decrementCredits, {
              id: user._id,
            })

            await convex.mutation(api.generationLogs.create, {
              userId: user._id,
              type: 'prep-guide',
              provider: 'openai',
              creditsUsed: 1,
              status: 'success',
            })

            return new Response(
              JSON.stringify({ mealPlanId }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          } catch (error) {
            lastError = error
            if (attempt < MAX_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (attempt + 1)),
              )
            }
          }
        }

        console.error('Prep guide generation failed after retries:', lastError)

        await convex.mutation(api.generationLogs.create, {
          userId: user._id,
          type: 'prep-guide',
          provider: 'openai',
          creditsUsed: 0,
          status: 'failed',
        })

        return new Response(
          JSON.stringify({ error: 'Prep guide generation failed', mealPlanId }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
