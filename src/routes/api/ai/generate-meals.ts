import { createFileRoute } from '@tanstack/react-router'
import { Output, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { Id } from '../../../../convex/_generated/dataModel'
import { api } from '../../../../convex/_generated/api'
import { getConvexHttpClient } from '~/lib/convex'
import { mealSuggestionSchema } from '~/lib/ai/schemas'
import { buildMealSuggestionsPrompt } from '~/lib/ai/prompts'

const MAX_RETRIES = 2

export const Route = createFileRoute('/api/ai/generate-meals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          userId: string
          weekStartDate: string
          totalMeals?: number
        }

        const { userId, weekStartDate, totalMeals = 7 } = body

        if (!userId || !weekStartDate) {
          return new Response(
            JSON.stringify({ error: 'userId and weekStartDate are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const convex = getConvexHttpClient()

        const mealPlanId = await convex.mutation(api.mealPlans.create, {
          userId: userId as Id<'users'>,
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
                userId: userId as Id<'users'>,
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

        return new Response(
          JSON.stringify({ error: 'Meal generation failed', mealPlanId }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
