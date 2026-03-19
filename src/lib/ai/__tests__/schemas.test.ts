import { describe, it, expect } from 'vitest'
import {
  mealSuggestionSchema,
  fullRecipeSchema,
  shoppingListItemSchema,
  batchPrepStepSchema,
  prepGuideOutputSchema,
} from '~/lib/ai/schemas'

describe('mealSuggestionSchema', () => {
  const validMeal = {
    name: 'Chicken Stir Fry',
    description: 'A quick and easy weeknight stir fry with tender chicken.',
    keyIngredients: [
      'chicken breast',
      'broccoli',
      'soy sauce',
      'garlic',
      'ginger',
    ],
    estimatedPrepMinutes: 25,
    imagePrompt:
      'Flat illustration of chicken stir fry in a white bowl on a light gray background. Top-down view, centered, simple clean style, soft even lighting, no shadows, no text, no garnish, no utensils. Show chicken, broccoli, snap peas.',
  }

  it('accepts valid meal suggestion', () => {
    expect(mealSuggestionSchema.parse(validMeal)).toEqual(validMeal)
  })

  it('rejects missing name', () => {
    const { name: _, ...noName } = validMeal
    expect(() => mealSuggestionSchema.parse(noName)).toThrow()
  })

  it('rejects missing description', () => {
    const { description: _, ...noDesc } = validMeal
    expect(() => mealSuggestionSchema.parse(noDesc)).toThrow()
  })

  it('rejects missing keyIngredients', () => {
    const { keyIngredients: _, ...noIngredients } = validMeal
    expect(() => mealSuggestionSchema.parse(noIngredients)).toThrow()
  })

  it('rejects missing estimatedPrepMinutes', () => {
    const { estimatedPrepMinutes: _, ...noTime } = validMeal
    expect(() => mealSuggestionSchema.parse(noTime)).toThrow()
  })

  it('rejects non-string name', () => {
    expect(() =>
      mealSuggestionSchema.parse({ ...validMeal, name: 123 }),
    ).toThrow()
  })

  it('rejects missing imagePrompt', () => {
    const { imagePrompt: _, ...noImagePrompt } = validMeal
    expect(() => mealSuggestionSchema.parse(noImagePrompt)).toThrow()
  })

  it('rejects non-string imagePrompt', () => {
    expect(() =>
      mealSuggestionSchema.parse({ ...validMeal, imagePrompt: 123 }),
    ).toThrow()
  })

  it('rejects non-number estimatedPrepMinutes', () => {
    expect(() =>
      mealSuggestionSchema.parse({ ...validMeal, estimatedPrepMinutes: '25' }),
    ).toThrow()
  })

  it('rejects non-array keyIngredients', () => {
    expect(() =>
      mealSuggestionSchema.parse({
        ...validMeal,
        keyIngredients: 'chicken, broccoli',
      }),
    ).toThrow()
  })

  it('rejects keyIngredients with non-string elements', () => {
    expect(() =>
      mealSuggestionSchema.parse({
        ...validMeal,
        keyIngredients: ['chicken', 42],
      }),
    ).toThrow()
  })

  it('accepts empty keyIngredients array', () => {
    const meal = { ...validMeal, keyIngredients: [] }
    expect(mealSuggestionSchema.parse(meal)).toEqual(meal)
  })

  it('strips unknown properties', () => {
    const result = mealSuggestionSchema.parse({
      ...validMeal,
      extraField: 'should be stripped',
    })
    expect(result).not.toHaveProperty('extraField')
  })
})

describe('fullRecipeSchema', () => {
  const validRecipe = {
    mealName: 'Chicken Stir Fry',
    ingredients: [
      { name: 'chicken breast', quantity: '1.5', unit: 'lbs' },
      { name: 'broccoli', quantity: '2', unit: 'cups' },
      { name: 'soy sauce', quantity: '3', unit: 'tbsp' },
    ],
    instructions: [
      'Cut chicken into bite-sized pieces.',
      'Heat oil in a wok over high heat.',
      'Cook chicken until golden, about 5 minutes.',
    ],
    nutritionEstimate: {
      calories: 450,
      protein: 38,
      carbs: 22,
      fat: 18,
    },
  }

  it('accepts valid full recipe', () => {
    expect(fullRecipeSchema.parse(validRecipe)).toEqual(validRecipe)
  })

  it('rejects missing mealName', () => {
    const { mealName: _, ...noName } = validRecipe
    expect(() => fullRecipeSchema.parse(noName)).toThrow()
  })

  it('rejects missing ingredients', () => {
    const { ingredients: _, ...noIngredients } = validRecipe
    expect(() => fullRecipeSchema.parse(noIngredients)).toThrow()
  })

  it('rejects ingredient missing name field', () => {
    expect(() =>
      fullRecipeSchema.parse({
        ...validRecipe,
        ingredients: [{ quantity: '1', unit: 'cups' }],
      }),
    ).toThrow()
  })

  it('rejects ingredient missing quantity field', () => {
    expect(() =>
      fullRecipeSchema.parse({
        ...validRecipe,
        ingredients: [{ name: 'chicken', unit: 'lbs' }],
      }),
    ).toThrow()
  })

  it('rejects ingredient missing unit field', () => {
    expect(() =>
      fullRecipeSchema.parse({
        ...validRecipe,
        ingredients: [{ name: 'chicken', quantity: '1' }],
      }),
    ).toThrow()
  })

  it('rejects missing instructions', () => {
    const { instructions: _, ...noInstructions } = validRecipe
    expect(() => fullRecipeSchema.parse(noInstructions)).toThrow()
  })

  it('rejects missing nutritionEstimate', () => {
    const { nutritionEstimate: _, ...noNutrition } = validRecipe
    expect(() => fullRecipeSchema.parse(noNutrition)).toThrow()
  })

  it('rejects incomplete nutritionEstimate', () => {
    expect(() =>
      fullRecipeSchema.parse({
        ...validRecipe,
        nutritionEstimate: { calories: 450, protein: 38 },
      }),
    ).toThrow()
  })

  it('rejects non-number nutrition values', () => {
    expect(() =>
      fullRecipeSchema.parse({
        ...validRecipe,
        nutritionEstimate: {
          calories: '450',
          protein: 38,
          carbs: 22,
          fat: 18,
        },
      }),
    ).toThrow()
  })

  it('accepts empty ingredients array', () => {
    const recipe = { ...validRecipe, ingredients: [] }
    expect(fullRecipeSchema.parse(recipe)).toEqual(recipe)
  })

  it('accepts empty instructions array', () => {
    const recipe = { ...validRecipe, instructions: [] }
    expect(fullRecipeSchema.parse(recipe)).toEqual(recipe)
  })
})

describe('shoppingListItemSchema', () => {
  const validItem = {
    item: 'Chicken Breast',
    quantity: '3',
    unit: 'lbs',
    category: 'Meat & Seafood',
  }

  it('accepts valid shopping list item', () => {
    expect(shoppingListItemSchema.parse(validItem)).toEqual(validItem)
  })

  it('rejects missing item', () => {
    const { item: _, ...noItem } = validItem
    expect(() => shoppingListItemSchema.parse(noItem)).toThrow()
  })

  it('rejects missing quantity', () => {
    const { quantity: _, ...noQty } = validItem
    expect(() => shoppingListItemSchema.parse(noQty)).toThrow()
  })

  it('rejects missing unit', () => {
    const { unit: _, ...noUnit } = validItem
    expect(() => shoppingListItemSchema.parse(noUnit)).toThrow()
  })

  it('rejects missing category', () => {
    const { category: _, ...noCat } = validItem
    expect(() => shoppingListItemSchema.parse(noCat)).toThrow()
  })

  it('rejects non-string quantity', () => {
    expect(() =>
      shoppingListItemSchema.parse({ ...validItem, quantity: 3 }),
    ).toThrow()
  })

  it('accepts any string as category (not enum-constrained)', () => {
    const item = { ...validItem, category: 'Custom Category' }
    expect(shoppingListItemSchema.parse(item)).toEqual(item)
  })
})

describe('batchPrepStepSchema', () => {
  const validStep = {
    stepNumber: 1,
    instruction: 'Dice all vegetables for the week.',
    estimatedMinutes: 15,
    relatedMeals: ['Chicken Stir Fry', 'Veggie Curry'],
  }

  it('accepts valid batch prep step', () => {
    expect(batchPrepStepSchema.parse(validStep)).toEqual(validStep)
  })

  it('rejects missing stepNumber', () => {
    const { stepNumber: _, ...noStep } = validStep
    expect(() => batchPrepStepSchema.parse(noStep)).toThrow()
  })

  it('rejects missing instruction', () => {
    const { instruction: _, ...noInstruction } = validStep
    expect(() => batchPrepStepSchema.parse(noInstruction)).toThrow()
  })

  it('rejects missing estimatedMinutes', () => {
    const { estimatedMinutes: _, ...noTime } = validStep
    expect(() => batchPrepStepSchema.parse(noTime)).toThrow()
  })

  it('rejects missing relatedMeals', () => {
    const { relatedMeals: _, ...noMeals } = validStep
    expect(() => batchPrepStepSchema.parse(noMeals)).toThrow()
  })

  it('rejects non-number stepNumber', () => {
    expect(() =>
      batchPrepStepSchema.parse({ ...validStep, stepNumber: '1' }),
    ).toThrow()
  })

  it('rejects non-number estimatedMinutes', () => {
    expect(() =>
      batchPrepStepSchema.parse({ ...validStep, estimatedMinutes: '15' }),
    ).toThrow()
  })

  it('accepts empty relatedMeals array', () => {
    const step = { ...validStep, relatedMeals: [] }
    expect(batchPrepStepSchema.parse(step)).toEqual(step)
  })
})

describe('prepGuideOutputSchema', () => {
  const validPrepGuide = {
    recipes: [
      {
        mealName: 'Chicken Stir Fry',
        ingredients: [
          { name: 'chicken breast', quantity: '1.5', unit: 'lbs' },
        ],
        instructions: ['Cook chicken.', 'Add vegetables.'],
        nutritionEstimate: { calories: 450, protein: 38, carbs: 22, fat: 18 },
      },
    ],
    shoppingList: [
      {
        item: 'Chicken Breast',
        quantity: '1.5',
        unit: 'lbs',
        category: 'Meat & Seafood',
      },
    ],
    batchPrepSteps: [
      {
        stepNumber: 1,
        instruction: 'Marinate chicken.',
        estimatedMinutes: 10,
        relatedMeals: ['Chicken Stir Fry'],
      },
    ],
    totalEstimatedMinutes: 60,
  }

  it('accepts valid prep guide output', () => {
    expect(prepGuideOutputSchema.parse(validPrepGuide)).toEqual(validPrepGuide)
  })

  it('rejects missing recipes', () => {
    const { recipes: _, ...noRecipes } = validPrepGuide
    expect(() => prepGuideOutputSchema.parse(noRecipes)).toThrow()
  })

  it('rejects missing shoppingList', () => {
    const { shoppingList: _, ...noList } = validPrepGuide
    expect(() => prepGuideOutputSchema.parse(noList)).toThrow()
  })

  it('rejects missing batchPrepSteps', () => {
    const { batchPrepSteps: _, ...noSteps } = validPrepGuide
    expect(() => prepGuideOutputSchema.parse(noSteps)).toThrow()
  })

  it('rejects missing totalEstimatedMinutes', () => {
    const { totalEstimatedMinutes: _, ...noTotal } = validPrepGuide
    expect(() => prepGuideOutputSchema.parse(noTotal)).toThrow()
  })

  it('rejects invalid nested recipe', () => {
    expect(() =>
      prepGuideOutputSchema.parse({
        ...validPrepGuide,
        recipes: [{ mealName: 'Bad Recipe' }],
      }),
    ).toThrow()
  })

  it('rejects invalid nested shopping list item', () => {
    expect(() =>
      prepGuideOutputSchema.parse({
        ...validPrepGuide,
        shoppingList: [{ item: 'Missing fields' }],
      }),
    ).toThrow()
  })

  it('rejects invalid nested batch prep step', () => {
    expect(() =>
      prepGuideOutputSchema.parse({
        ...validPrepGuide,
        batchPrepSteps: [{ instruction: 'Missing fields' }],
      }),
    ).toThrow()
  })

  it('accepts all empty arrays with totalEstimatedMinutes', () => {
    const emptyGuide = {
      recipes: [],
      shoppingList: [],
      batchPrepSteps: [],
      totalEstimatedMinutes: 0,
    }
    expect(prepGuideOutputSchema.parse(emptyGuide)).toEqual(emptyGuide)
  })

  it('rejects non-number totalEstimatedMinutes', () => {
    expect(() =>
      prepGuideOutputSchema.parse({
        ...validPrepGuide,
        totalEstimatedMinutes: '60',
      }),
    ).toThrow()
  })
})
