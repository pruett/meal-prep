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
  imagePrompt: z
    .string()
    .describe(
      'Image generation prompt following this exact template: "Flat illustration of [MEAL NAME] in a white bowl on a light gray background. Top-down view, centered, simple clean style, soft even lighting, no shadows, no text, no garnish, no utensils. Show [2-3 KEY VISIBLE INGREDIENTS]."',
    ),
})

export type MealSuggestion = z.infer<typeof mealSuggestionSchema>

export const fullRecipeSchema = z.object({
  mealName: z
    .string()
    .describe('Exact name of the meal this recipe belongs to'),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe('Ingredient name'),
        quantity: z.string().describe('Numeric quantity as a string, e.g. "2", "0.5"'),
        unit: z
          .string()
          .describe('Unit of measurement, e.g. "cups", "tbsp", "lbs", "pieces"'),
      }),
    )
    .describe('Complete list of ingredients with exact quantities'),
  instructions: z
    .array(z.string())
    .describe('Step-by-step cooking instructions in order'),
  nutritionEstimate: z
    .object({
      calories: z.number().describe('Estimated calories per serving'),
      protein: z.number().describe('Estimated protein in grams per serving'),
      carbs: z.number().describe('Estimated carbohydrates in grams per serving'),
      fat: z.number().describe('Estimated fat in grams per serving'),
    })
    .describe('Rough per-serving nutrition estimate'),
})

export type FullRecipe = z.infer<typeof fullRecipeSchema>

export const shoppingListItemSchema = z.object({
  item: z.string().describe('Name of the grocery item'),
  quantity: z
    .string()
    .describe('Combined quantity needed across all recipes, e.g. "3", "1.5"'),
  unit: z
    .string()
    .describe('Unit of measurement, e.g. "cups", "lbs", "cans", "bunch"'),
  category: z
    .string()
    .describe(
      'Grocery aisle category: "Produce", "Meat & Seafood", "Dairy & Eggs", "Pantry", "Frozen", "Bakery", "Spices & Seasonings", or "Other"',
    ),
})

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>

export const batchPrepStepSchema = z.object({
  stepNumber: z.number().describe('Order of this step in the prep sequence'),
  instruction: z
    .string()
    .describe('Clear, actionable batch prep instruction'),
  estimatedMinutes: z
    .number()
    .describe('Estimated time for this step in minutes'),
  relatedMeals: z
    .array(z.string())
    .describe('Names of meals that benefit from this prep step'),
})

export type BatchPrepStep = z.infer<typeof batchPrepStepSchema>

export const prepGuideOutputSchema = z.object({
  recipes: z
    .array(fullRecipeSchema)
    .describe('Full recipe for each accepted meal'),
  shoppingList: z
    .array(shoppingListItemSchema)
    .describe(
      'Consolidated shopping list with quantities combined across all recipes',
    ),
  batchPrepSteps: z
    .array(batchPrepStepSchema)
    .describe(
      'Ordered batch prep steps that maximize efficiency by grouping shared prep work',
    ),
  totalEstimatedMinutes: z
    .number()
    .describe('Total estimated batch prep time in minutes'),
})

export type PrepGuideOutput = z.infer<typeof prepGuideOutputSchema>
