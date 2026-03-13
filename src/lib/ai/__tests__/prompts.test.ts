import { describe, it, expect } from 'vitest'
import {
  buildMealSuggestionsPrompt,
  buildPrepGuidePrompt,
  type MealPromptPreferences,
} from '~/lib/ai/prompts'

describe('buildMealSuggestionsPrompt', () => {
  describe('default behavior (no preferences)', () => {
    it('generates prompt with default meal count of 7', () => {
      const prompt = buildMealSuggestionsPrompt()
      expect(prompt).toContain('Generate exactly 7 meal suggestions')
    })

    it('includes default preferences when none provided', () => {
      const prompt = buildMealSuggestionsPrompt()
      expect(prompt).toContain('Dietary preferences (defaults)')
      expect(prompt).toContain('No dietary restrictions')
      expect(prompt).toContain('Mediterranean, Asian, Mexican')
      expect(prompt).toContain('Household size: 2')
      expect(prompt).toContain('Max prep time: 45 minutes')
      expect(prompt).toContain('oven, stovetop, microwave, blender')
      expect(prompt).toContain('No foods to avoid')
    })

    it('includes default preferences when null is passed', () => {
      const prompt = buildMealSuggestionsPrompt(7, null)
      expect(prompt).toContain('Dietary preferences (defaults)')
    })

    it('includes requirements section', () => {
      const prompt = buildMealSuggestionsPrompt()
      expect(prompt).toContain('Requirements:')
      expect(prompt).toContain('practical for home cooking')
      expect(prompt).toContain('Vary the cuisines')
      expect(prompt).toContain('nutritious and well-balanced')
    })

    it('includes output format instructions', () => {
      const prompt = buildMealSuggestionsPrompt()
      expect(prompt).toContain('A descriptive name')
      expect(prompt).toContain('A brief description')
      expect(prompt).toContain('Key ingredients')
      expect(prompt).toContain('Estimated total prep and cooking time')
    })
  })

  describe('custom meal count', () => {
    it('uses specified meal count', () => {
      const prompt = buildMealSuggestionsPrompt(5)
      expect(prompt).toContain('Generate exactly 5 meal suggestions')
    })

    it('handles large meal count', () => {
      const prompt = buildMealSuggestionsPrompt(14)
      expect(prompt).toContain('Generate exactly 14 meal suggestions')
    })

    it('handles minimum meal count', () => {
      const prompt = buildMealSuggestionsPrompt(3)
      expect(prompt).toContain('Generate exactly 3 meal suggestions')
    })
  })

  describe('with dietary restrictions', () => {
    it('includes dietary restrictions in prompt', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: ['Vegetarian', 'Gluten-Free'],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Dietary restrictions: Vegetarian, Gluten-Free')
    })

    it('shows no dietary restrictions when array is empty', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('No dietary restrictions')
    })

    it('includes single dietary restriction', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: ['Vegan'],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Dietary restrictions: Vegan')
    })
  })

  describe('with cuisine preferences', () => {
    it('includes liked cuisines', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [
          { cuisine: 'Italian', preference: 'like' },
          { cuisine: 'Thai', preference: 'like' },
        ],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Preferred cuisines: Italian, Thai')
    })

    it('includes disliked cuisines', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [
          { cuisine: 'Indian', preference: 'dislike' },
          { cuisine: 'Japanese', preference: 'dislike' },
        ],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Cuisines to avoid: Indian, Japanese')
    })

    it('includes both liked and disliked cuisines', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [
          { cuisine: 'Italian', preference: 'like' },
          { cuisine: 'Mexican', preference: 'like' },
          { cuisine: 'Indian', preference: 'dislike' },
          { cuisine: 'French', preference: 'neutral' },
        ],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Preferred cuisines: Italian, Mexican')
      expect(prompt).toContain('Cuisines to avoid: Indian')
      expect(prompt).not.toContain('French')
    })

    it('filters out neutral cuisines', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [
          { cuisine: 'Italian', preference: 'neutral' },
          { cuisine: 'Thai', preference: 'neutral' },
        ],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Open to all cuisines')
      expect(prompt).not.toContain('Preferred cuisines')
      expect(prompt).not.toContain('Cuisines to avoid')
    })

    it('shows open to all cuisines when preferences array is empty', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Open to all cuisines')
    })
  })

  describe('with household and cooking preferences', () => {
    it('includes household size', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 4,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Household size: 4')
    })

    it('includes max prep time', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 30,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Max prep time: 30 minutes per meal')
    })

    it('includes kitchen equipment lowercased', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: ['Oven', 'Stovetop', 'Air Fryer'],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Kitchen equipment: oven, stovetop, air fryer')
    })

    it('shows standard equipment when kitchen equipment is empty', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Standard kitchen equipment only')
    })
  })

  describe('with foods to avoid', () => {
    it('includes foods to avoid text', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: 'shellfish, peanuts, raw fish',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain(
        'Foods to avoid: shellfish, peanuts, raw fish',
      )
    })

    it('shows no foods to avoid when string is empty', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('No foods to avoid')
    })

    it('trims whitespace from foods to avoid', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '  mushrooms, olives  ',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('Foods to avoid: mushrooms, olives')
    })

    it('treats whitespace-only string as no foods to avoid', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: [],
        cuisinePreferences: [],
        householdSize: 2,
        maxPrepTimeMinutes: 45,
        kitchenEquipment: [],
        foodsToAvoid: '   ',
      }
      const prompt = buildMealSuggestionsPrompt(7, prefs)
      expect(prompt).toContain('No foods to avoid')
    })
  })

  describe('with full preferences', () => {
    it('includes all preference fields in a single prompt', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: ['Vegetarian', 'Dairy-Free'],
        cuisinePreferences: [
          { cuisine: 'Mediterranean', preference: 'like' },
          { cuisine: 'Japanese', preference: 'like' },
          { cuisine: 'German', preference: 'dislike' },
        ],
        householdSize: 3,
        maxPrepTimeMinutes: 60,
        kitchenEquipment: ['Oven', 'Stovetop', 'Instant Pot', 'Air Fryer'],
        foodsToAvoid: 'eggplant, bell peppers',
      }
      const prompt = buildMealSuggestionsPrompt(10, prefs)
      expect(prompt).toContain('Generate exactly 10 meal suggestions')
      expect(prompt).toContain(
        'Dietary restrictions: Vegetarian, Dairy-Free',
      )
      expect(prompt).toContain(
        'Preferred cuisines: Mediterranean, Japanese',
      )
      expect(prompt).toContain('Cuisines to avoid: German')
      expect(prompt).toContain('Household size: 3')
      expect(prompt).toContain('Max prep time: 60 minutes per meal')
      expect(prompt).toContain(
        'Kitchen equipment: oven, stovetop, instant pot, air fryer',
      )
      expect(prompt).toContain('Foods to avoid: eggplant, bell peppers')
      expect(prompt).not.toContain('Dietary preferences (defaults)')
    })
  })

  describe('with accepted meals context (regeneration)', () => {
    it('includes accepted meals in prompt', () => {
      const accepted = [
        { name: 'Chicken Stir Fry', description: 'Quick weeknight stir fry' },
        {
          name: 'Pasta Primavera',
          description: 'Vegetable pasta with garlic',
        },
      ]
      const prompt = buildMealSuggestionsPrompt(3, null, accepted)
      expect(prompt).toContain('already has these accepted meals')
      expect(prompt).toContain('- Chicken Stir Fry: Quick weeknight stir fry')
      expect(prompt).toContain(
        '- Pasta Primavera: Vegetable pasta with garlic',
      )
      expect(prompt).toContain(
        'Do NOT suggest any meals similar to the accepted meals',
      )
    })

    it('excludes accepted meals section when array is empty', () => {
      const prompt = buildMealSuggestionsPrompt(7, null, [])
      expect(prompt).not.toContain('already has these accepted meals')
      expect(prompt).not.toContain('Do NOT suggest')
    })

    it('excludes accepted meals section when undefined', () => {
      const prompt = buildMealSuggestionsPrompt(7, null)
      expect(prompt).not.toContain('already has these accepted meals')
    })

    it('combines preferences and accepted meals', () => {
      const prefs: MealPromptPreferences = {
        dietaryRestrictions: ['Vegan'],
        cuisinePreferences: [
          { cuisine: 'Thai', preference: 'like' },
        ],
        householdSize: 1,
        maxPrepTimeMinutes: 30,
        kitchenEquipment: ['Stovetop'],
        foodsToAvoid: 'nuts',
      }
      const accepted = [
        { name: 'Tofu Pad Thai', description: 'Classic Thai noodle dish' },
      ]
      const prompt = buildMealSuggestionsPrompt(4, prefs, accepted)
      expect(prompt).toContain('Generate exactly 4 meal suggestions')
      expect(prompt).toContain('Dietary restrictions: Vegan')
      expect(prompt).toContain('Preferred cuisines: Thai')
      expect(prompt).toContain('Household size: 1')
      expect(prompt).toContain('Max prep time: 30 minutes')
      expect(prompt).toContain('Kitchen equipment: stovetop')
      expect(prompt).toContain('Foods to avoid: nuts')
      expect(prompt).toContain('- Tofu Pad Thai: Classic Thai noodle dish')
      expect(prompt).toContain('Do NOT suggest any meals similar')
    })
  })

  describe('prompt structure', () => {
    it('separates sections with double newlines', () => {
      const prompt = buildMealSuggestionsPrompt()
      const sections = prompt.split('\n\n')
      expect(sections.length).toBeGreaterThanOrEqual(3)
    })

    it('starts with the meal planning assistant role', () => {
      const prompt = buildMealSuggestionsPrompt()
      expect(prompt).toMatch(/^You are a meal planning assistant/)
    })
  })
})

describe('buildPrepGuidePrompt', () => {
  const sampleMeals = [
    {
      name: 'Chicken Stir Fry',
      description: 'Quick weeknight stir fry with tender chicken',
      keyIngredients: ['chicken breast', 'broccoli', 'soy sauce', 'garlic'],
      estimatedPrepMinutes: 25,
    },
    {
      name: 'Pasta Primavera',
      description: 'Vegetable pasta with garlic and olive oil',
      keyIngredients: ['pasta', 'zucchini', 'bell pepper', 'garlic'],
      estimatedPrepMinutes: 30,
    },
  ]

  describe('basic prompt generation', () => {
    it('includes meal count and default household size', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('2 meals')
      expect(prompt).toContain('serving 2 people')
    })

    it('starts with prep assistant role', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toMatch(/^You are a meal prep assistant/)
    })

    it('lists all accepted meals with details', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain(
        '- Chicken Stir Fry: Quick weeknight stir fry with tender chicken',
      )
      expect(prompt).toContain(
        'Key ingredients: chicken breast, broccoli, soy sauce, garlic',
      )
      expect(prompt).toContain('~25 min')
      expect(prompt).toContain(
        '- Pasta Primavera: Vegetable pasta with garlic and olive oil',
      )
      expect(prompt).toContain('~30 min')
    })
  })

  describe('household size', () => {
    it('uses specified household size', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals, 4)
      expect(prompt).toContain('serving 4 people')
      expect(prompt).toContain('scaled for 4 servings')
    })

    it('uses singular person for household of 1', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals, 1)
      expect(prompt).toContain('serving 1 person')
      expect(prompt).toContain('scaled for 1 serving')
    })

    it('defaults to 2 when not specified', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('serving 2 people')
      expect(prompt).toContain('scaled for 2 servings')
    })

    it('handles large household size', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals, 10)
      expect(prompt).toContain('serving 10 people')
      expect(prompt).toContain('scaled for 10 servings')
    })
  })

  describe('recipe instructions section', () => {
    it('requires complete ingredient list with quantities', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Complete ingredient list with exact quantities')
    })

    it('requires step-by-step cooking instructions', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Step-by-step cooking instructions')
    })

    it('requires per-serving nutrition estimate', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Per-serving nutrition estimate')
      expect(prompt).toContain('calories, protein, carbs, fat')
    })

    it('requires exact mealName match', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain(
        '"mealName" field must exactly match the meal name',
      )
    })
  })

  describe('shopping list section', () => {
    it('instructs to combine duplicate ingredients', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Combine duplicate ingredients across all recipes')
    })

    it('requires quantity and unit', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('quantity and unit for each item')
    })

    it('includes grocery aisle categories', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Produce')
      expect(prompt).toContain('Meat & Seafood')
      expect(prompt).toContain('Dairy & Eggs')
      expect(prompt).toContain('Pantry')
      expect(prompt).toContain('Frozen')
      expect(prompt).toContain('Spices & Seasonings')
    })
  })

  describe('batch prep plan section', () => {
    it('instructs to group shared prep work', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Group shared prep work across meals')
    })

    it('requires sequential step numbering', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('Number each step sequentially')
    })

    it('requires time estimates per step', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('estimated time for each step')
    })

    it('requires related meals per step', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('which meals each step contributes to')
    })

    it('requires total batch prep time', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      expect(prompt).toContain('total estimated batch prep time in minutes')
    })
  })

  describe('with single meal', () => {
    it('generates prompt for a single meal', () => {
      const meals = [sampleMeals[0]]
      const prompt = buildPrepGuidePrompt(meals)
      expect(prompt).toContain('1 meal')
      expect(prompt).toContain('Chicken Stir Fry')
      expect(prompt).not.toContain('Pasta Primavera')
    })
  })

  describe('with many meals', () => {
    it('generates prompt for many meals', () => {
      const meals = Array.from({ length: 7 }, (_, i) => ({
        name: `Meal ${i + 1}`,
        description: `Description for meal ${i + 1}`,
        keyIngredients: ['ingredient1', 'ingredient2'],
        estimatedPrepMinutes: 20 + i * 5,
      }))
      const prompt = buildPrepGuidePrompt(meals, 4)
      expect(prompt).toContain('7 meals')
      expect(prompt).toContain('serving 4 people')
      for (let i = 0; i < 7; i++) {
        expect(prompt).toContain(`Meal ${i + 1}`)
        expect(prompt).toContain(`~${20 + i * 5} min`)
      }
    })
  })

  describe('prompt structure', () => {
    it('separates sections with double newlines', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      const sections = prompt.split('\n\n')
      expect(sections.length).toBe(5)
    })

    it('contains all required sections in order', () => {
      const prompt = buildPrepGuidePrompt(sampleMeals)
      const roleIdx = prompt.indexOf('You are a meal prep assistant')
      const mealsIdx = prompt.indexOf('Meals to prepare:')
      const recipeIdx = prompt.indexOf('For each meal, provide a full recipe')
      const shoppingIdx = prompt.indexOf('Generate a consolidated shopping list')
      const batchIdx = prompt.indexOf('Generate an efficient batch prep plan')
      expect(roleIdx).toBeLessThan(mealsIdx)
      expect(mealsIdx).toBeLessThan(recipeIdx)
      expect(recipeIdx).toBeLessThan(shoppingIdx)
      expect(shoppingIdx).toBeLessThan(batchIdx)
    })
  })
})
