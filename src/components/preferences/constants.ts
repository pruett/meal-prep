export type PreferenceOption = { id: string; label: string; icon: string }

export const DIETARY_RESTRICTIONS: PreferenceOption[] = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "pescatarian", label: "Pescatarian", icon: "🐟" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
  { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
  { id: "nut-free", label: "Nut-Free", icon: "🥜" },
  { id: "keto", label: "Keto", icon: "🥑" },
  { id: "paleo", label: "Paleo", icon: "🍖" },
  { id: "low-carb", label: "Low-Carb", icon: "🍞" },
  { id: "low-sodium", label: "Low-Sodium", icon: "🧂" },
  { id: "halal", label: "Halal", icon: "☪️" },
  { id: "kosher", label: "Kosher", icon: "✡️" },
]

export const CUISINES: PreferenceOption[] = [
  { id: "italian", label: "Italian", icon: "🍝" },
  { id: "mexican", label: "Mexican", icon: "🌮" },
  { id: "chinese", label: "Chinese", icon: "🥡" },
  { id: "japanese", label: "Japanese", icon: "🍣" },
  { id: "indian", label: "Indian", icon: "🍛" },
  { id: "thai", label: "Thai", icon: "🍜" },
  { id: "mediterranean", label: "Mediterranean", icon: "🫒" },
  { id: "korean", label: "Korean", icon: "🥘" },
  { id: "french", label: "French", icon: "🥐" },
  { id: "american", label: "American", icon: "🍔" },
  { id: "greek", label: "Greek", icon: "🥙" },
  { id: "middle-eastern", label: "Middle Eastern", icon: "🧆" },
  { id: "vietnamese", label: "Vietnamese", icon: "🍲" },
  { id: "spanish", label: "Spanish", icon: "🥘" },
  { id: "ethiopian", label: "Ethiopian", icon: "🫓" },
  { id: "caribbean", label: "Caribbean", icon: "🥥" },
]

export const EQUIPMENT: PreferenceOption[] = [
  { id: "oven", label: "Oven", icon: "🔥" },
  { id: "stovetop", label: "Stovetop", icon: "🍳" },
  { id: "microwave", label: "Microwave", icon: "📡" },
  { id: "slow-cooker", label: "Slow Cooker", icon: "🥘" },
  { id: "instant-pot", label: "Instant Pot", icon: "♨️" },
  { id: "air-fryer", label: "Air Fryer", icon: "🌀" },
  { id: "blender", label: "Blender", icon: "🫗" },
  { id: "food-processor", label: "Food Processor", icon: "⚙️" },
  { id: "grill", label: "Grill", icon: "🔥" },
  { id: "wok", label: "Wok", icon: "🥡" },
  { id: "cast-iron", label: "Cast Iron", icon: "🫕" },
  { id: "sheet-pan", label: "Sheet Pan", icon: "🍽️" },
]

export function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60)
    const rem = minutes % 60
    return `${hrs} hr${hrs > 1 ? "s" : ""}${rem > 0 ? ` ${rem} min` : ""}`
  }
  return `${minutes} min`
}

export function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const item of a) {
    if (!b.has(item)) return false
  }
  return true
}
