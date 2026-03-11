export function buildMealSuggestionsPrompt(totalMeals: number = 7): string {
  return `You are a meal planning assistant. Generate exactly ${totalMeals} meal suggestions for a week of home cooking.

Dietary preferences (defaults):
- No dietary restrictions
- Preferred cuisines: Mediterranean, Asian, Mexican
- Household size: 2
- Max prep time: 45 minutes per meal
- Kitchen equipment: oven, stovetop, microwave, blender
- No foods to avoid

Requirements:
- Each meal should be practical for home cooking
- Vary the cuisines and protein sources across meals
- Include a mix of quick weeknight meals and slightly more involved options
- All meals should be nutritious and well-balanced
- Estimated prep time should include both preparation and cooking

For each meal, provide:
- A descriptive name
- A brief description (1-2 sentences)
- Key ingredients (5-8 main ingredients, not seasonings/oil/salt)
- Estimated total prep and cooking time in minutes`
}
