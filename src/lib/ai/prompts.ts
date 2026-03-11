interface CuisinePreference {
  cuisine: string
  preference: 'like' | 'neutral' | 'dislike'
}

interface AcceptedMeal {
  name: string
  description: string
}

export interface MealPromptPreferences {
  dietaryRestrictions: string[]
  cuisinePreferences: CuisinePreference[]
  householdSize: number
  maxPrepTimeMinutes: number
  kitchenEquipment: string[]
  foodsToAvoid: string
}

export function buildMealSuggestionsPrompt(
  totalMeals: number = 7,
  preferences?: MealPromptPreferences | null,
  acceptedMeals?: AcceptedMeal[],
): string {
  const sections: string[] = []

  sections.push(
    `You are a meal planning assistant. Generate exactly ${totalMeals} meal suggestions for a week of home cooking.`,
  )

  // Dietary preferences section
  sections.push(buildPreferencesSection(preferences))

  // Accepted meals context (for regeneration)
  if (acceptedMeals && acceptedMeals.length > 0) {
    const context = acceptedMeals
      .map((m) => `- ${m.name}: ${m.description}`)
      .join('\n')
    sections.push(
      `The user already has these accepted meals in their plan:\n${context}\n\nDo NOT suggest any meals similar to the accepted meals listed above.`,
    )
  }

  sections.push(`Requirements:
- Each meal should be practical for home cooking
- Vary the cuisines and protein sources across meals
- Include a mix of quick weeknight meals and slightly more involved options
- All meals should be nutritious and well-balanced
- Estimated prep time should include both preparation and cooking

For each meal, provide:
- A descriptive name
- A brief description (1-2 sentences)
- Key ingredients (5-8 main ingredients, not seasonings/oil/salt)
- Estimated total prep and cooking time in minutes`)

  return sections.join('\n\n')
}

function buildPreferencesSection(
  prefs?: MealPromptPreferences | null,
): string {
  if (!prefs) {
    return `Dietary preferences (defaults):
- No dietary restrictions
- Preferred cuisines: Mediterranean, Asian, Mexican
- Household size: 2
- Max prep time: 45 minutes per meal
- Kitchen equipment: oven, stovetop, microwave, blender
- No foods to avoid`
  }

  const lines: string[] = ['Dietary preferences:']

  // Dietary restrictions
  if (prefs.dietaryRestrictions.length > 0) {
    lines.push(
      `- Dietary restrictions: ${prefs.dietaryRestrictions.join(', ')}`,
    )
  } else {
    lines.push('- No dietary restrictions')
  }

  // Cuisine preferences
  const liked = prefs.cuisinePreferences
    .filter((c) => c.preference === 'like')
    .map((c) => c.cuisine)
  const disliked = prefs.cuisinePreferences
    .filter((c) => c.preference === 'dislike')
    .map((c) => c.cuisine)

  if (liked.length > 0) {
    lines.push(`- Preferred cuisines: ${liked.join(', ')}`)
  }
  if (disliked.length > 0) {
    lines.push(`- Cuisines to avoid: ${disliked.join(', ')}`)
  }
  if (liked.length === 0 && disliked.length === 0) {
    lines.push('- Open to all cuisines')
  }

  // Household size
  lines.push(`- Household size: ${prefs.householdSize}`)

  // Max prep time
  lines.push(`- Max prep time: ${prefs.maxPrepTimeMinutes} minutes per meal`)

  // Kitchen equipment
  if (prefs.kitchenEquipment.length > 0) {
    lines.push(
      `- Kitchen equipment: ${prefs.kitchenEquipment.map((e) => e.toLowerCase()).join(', ')}`,
    )
  } else {
    lines.push('- Standard kitchen equipment only')
  }

  // Foods to avoid
  if (prefs.foodsToAvoid.trim()) {
    lines.push(`- Foods to avoid: ${prefs.foodsToAvoid.trim()}`)
  } else {
    lines.push('- No foods to avoid')
  }

  return lines.join('\n')
}
