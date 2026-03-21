import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

export function useMealImage(meal: Doc<'meals'>) {
  const [isGenerating, setIsGenerating] = useState(false)
  const triggeredRef = useRef(false)

  const imageUrl = useQuery(
    api.meals.getImageUrl,
    meal.imageStorageId ? { storageId: meal.imageStorageId } : 'skip',
  )

  useEffect(() => {
    if (meal.imageStorageId || !meal.imagePrompt || triggeredRef.current) return
    triggeredRef.current = true
    setIsGenerating(true)

    fetch('/api/ai/generate-meal-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealId: meal._id }),
    })
      .catch(console.error)
      .finally(() => setIsGenerating(false))
  }, [meal._id, meal.imageStorageId, meal.imagePrompt])

  return {
    imageUrl: imageUrl ?? null,
    isGenerating,
  }
}
