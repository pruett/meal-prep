import { ConvexHttpClient } from 'convex/browser'

let httpClient: ConvexHttpClient | undefined

export function getConvexHttpClient(): ConvexHttpClient {
  if (!httpClient) {
    const url = process.env.VITE_CONVEX_URL
    if (!url) {
      throw new Error('Missing VITE_CONVEX_URL environment variable')
    }
    httpClient = new ConvexHttpClient(url)
  }
  return httpClient
}
