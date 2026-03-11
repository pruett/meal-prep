/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server'
import type { ComponentApi } from '@convex-dev/better-auth/_generated/component.js'

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
import type * as auth from '../auth.ts'
import type * as generationLogs from '../generationLogs.ts'
import type * as mealPlans from '../mealPlans.ts'
import type * as meals from '../meals.ts'
import type * as preferences from '../preferences.ts'
import type * as prepGuides from '../prepGuides.ts'
import type * as users from '../users.ts'

declare const fullApi: ApiFromModules<{
  auth: typeof auth
  generationLogs: typeof generationLogs
  mealPlans: typeof mealPlans
  meals: typeof meals
  preferences: typeof preferences
  prepGuides: typeof prepGuides
  users: typeof users
}>
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>
export declare const components: {
  betterAuth: ComponentApi
}
