import { z } from 'zod'

export const mealSuggestionSchema = z.object({
  name: z.string().describe('Name of the meal'),
  description: z
    .string()
    .describe('Brief 1-2 sentence description of the meal'),
  keyIngredients: z
    .array(z.string())
    .describe('List of 5-8 key ingredients'),
  estimatedPrepMinutes: z
    .number()
    .describe('Estimated total preparation and cooking time in minutes'),
})

export type MealSuggestion = z.infer<typeof mealSuggestionSchema>
