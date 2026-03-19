import { createFileRoute } from '@tanstack/react-router'
import OpenAI from 'openai'
import sharp from 'sharp'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { jsonResponse } from '~/lib/ai/generate'
import { fetchAuthQuery, fetchAuthMutation } from '~/lib/auth-server'

const openai = new OpenAI()

export const Route = createFileRoute('/api/ai/generate-meal-image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { mealId } = body as { mealId: Id<'meals'> }
        if (!mealId) {
          return jsonResponse({ error: 'mealId is required' }, 400)
        }

        const meal = await fetchAuthQuery(api.meals.getById, { id: mealId })
        if (!meal) {
          return jsonResponse({ error: 'Meal not found' }, 404)
        }

        if (meal.imageStorageId) {
          return jsonResponse({ alreadyExists: true })
        }

        if (!meal.imagePrompt) {
          return jsonResponse({ error: 'Meal has no image prompt' }, 400)
        }

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: meal.imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        })

        const imageUrl = response.data?.[0]?.url
        if (!imageUrl) {
          return jsonResponse({ error: 'No image returned from DALL-E' }, 500)
        }

        // Download image and resize to 400x400 webp
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        const resizedBuffer = await sharp(imageBuffer)
          .resize(400, 400)
          .webp({ quality: 80 })
          .toBuffer()

        // Upload to Convex storage
        const uploadUrl = await fetchAuthMutation(
          api.meals.generateUploadUrl,
          {},
        )
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/webp' },
          body: resizedBuffer,
        })
        const { storageId } = (await uploadResponse.json()) as {
          storageId: Id<'_storage'>
        }

        // Save storage ID on the meal
        await fetchAuthMutation(api.meals.storeImage, {
          id: mealId,
          storageId,
        })

        return jsonResponse({ storageId })
      },
    },
  },
})
