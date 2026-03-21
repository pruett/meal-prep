/**
 * Shared constants for meal generation across client and server.
 *
 * MEAL_SUGGESTION_BUFFER — extra meals generated beyond what the user needs,
 * so they can keep swiping without waiting for the next LLM call.
 *
 * LOAD_MORE_THRESHOLD — when the pending (un-swiped) list drops to this count,
 * the swipe list triggers a background generation.
 */

/** Extra meals to generate beyond totalSlots, capped at 7. */
export const MEAL_SUGGESTION_BUFFER = 7;

/** Trigger background generation when remaining count drops to this number. */
export const LOAD_MORE_THRESHOLD = 4;

/** Number of meals to generate per "load more" batch. */
export const LOAD_MORE_BATCH_SIZE = 6;

/** Max pending meals visible in the swipe list at once. */
export const VISIBLE_PENDING_LIMIT = 8;
