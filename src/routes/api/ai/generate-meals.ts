import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'
import { getToken } from '~/lib/auth-server'

const MAX_RETRIES = 2

export const Route = createFileRoute('/api/ai/generate-meals')({
  server: {
    handlers: {
      POST: async () => {
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

        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.getFullYear(), now.getMonth(), diff)
        const weekStartDate = monday.toISOString().split('T')[0]!
        const totalMeals = 7

        const mealPlanId = await convex.mutation(api.mealPlans.create, {
          userId: user._id,
          weekStartDate,
          totalMealsRequested: totalMeals,
        })

        let lastError: unknown
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const result = streamText({
              model: openai('gpt-4o-mini'),
              prompt: buildMealSuggestionsPrompt(totalMeals),
              output: Output.array({
                element: mealSuggestionSchema,
              }),
            })

            let sortOrder = 0
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
              type: 'meal-suggestions',
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

        console.error('Meal generation failed after retries:', lastError)

        await convex.mutation(api.generationLogs.create, {
          userId: user._id,
          type: 'meal-suggestions',
          provider: 'openai',
          creditsUsed: 0,
          status: 'failed',
        })

        return new Response(
          JSON.stringify({ error: 'Meal generation failed', mealPlanId }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
