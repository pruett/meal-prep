import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { getToken } from '~/lib/auth-server'

const MAX_RETRIES = 2

export const Route = createFileRoute('/api/ai/regenerate-meals')({
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
          return new Response(
            JSON.stringify({ error: 'No rejected meals to regenerate' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        await convex.mutation(api.meals.deleteByMealPlanAndStatus, {
          mealPlanId,
          status: 'rejected',
        })

        await convex.mutation(api.mealPlans.updateStatus, {
          id: mealPlanId,
          status: 'generating',
        })

        const acceptedContext = acceptedMeals
          .map((m) => `- ${m.name}: ${m.description}`)
          .join('\n')

        const prompt = `You are a meal planning assistant. Generate exactly ${rejectedCount} replacement meal suggestions for a week of home cooking.

The user already has these accepted meals in their plan:
${acceptedContext || '(none)'}

Requirements:
- Do NOT suggest any meals similar to the accepted meals listed above
- Each meal should be practical for home cooking
- Vary the cuisines and protein sources
- Include a mix of quick weeknight meals and slightly more involved options
- All meals should be nutritious and well-balanced
- Estimated prep time should include both preparation and cooking

For each meal, provide:
- A descriptive name
- A brief description (1-2 sentences)
- Key ingredients (5-8 main ingredients, not seasonings/oil/salt)
- Estimated total prep and cooking time in minutes`

        const nextSortOrder =
          existingMeals.length > 0
            ? Math.max(...existingMeals.map((m) => m.sortOrder)) + 1
            : 0

        let lastError: unknown
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const result = streamText({
              model: openai('gpt-4o-mini'),
              prompt,
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let sortOrder = nextSortOrder
            for await (const meal of result.elementStream) {
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

            await convex.mutation(api.users.decrementCredits, {
              id: user._id,
            })

            await convex.mutation(api.generationLogs.create, {
              userId: user._id,
              type: 'meal-regeneration',
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

        console.error('Meal regeneration failed after retries:', lastError)

        await convex.mutation(api.mealPlans.updateStatus, {
          id: mealPlanId,
          status: 'reviewing',
        })

        await convex.mutation(api.generationLogs.create, {
          userId: user._id,
          type: 'meal-regeneration',
          provider: 'openai',
          creditsUsed: 0,
          status: 'failed',
        })

        return new Response(
          JSON.stringify({ error: 'Meal regeneration failed', mealPlanId }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
