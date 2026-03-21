import type { UseMutationResult } from "@tanstack/react-query";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type MealCounts = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

export type CurrentWeek =
  | { phase: "no-plan" }
  | {
      phase: "generating";
      mealPlanId: Id<"mealPlans">;
      meals: Doc<"meals">[];
      counts: MealCounts;
    }
  | {
      phase: "reviewing";
      mealPlanId: Id<"mealPlans">;
      meals: Doc<"meals">[];
      counts: MealCounts;
    }
  | { phase: "finalized"; mealPlanId: Id<"mealPlans"> };

export type GenerateMoreMutation = UseMutationResult<
  unknown,
  Error,
  { mealPlanId: string; count?: number }
>;

export function deriveCurrentWeek(
  plan: Doc<"mealPlans"> | null | undefined,
  meals: Doc<"meals">[] | undefined,
): CurrentWeek {
  if (!plan) return { phase: "no-plan" };

  if (plan.status === "finalized") {
    return { phase: "finalized", mealPlanId: plan._id };
  }

  const mealList = meals ?? [];
  const counts: MealCounts = {
    total: mealList.length,
    pending: mealList.filter((m) => m.status === "pending").length,
    accepted: mealList.filter((m) => m.status === "accepted").length,
    rejected: mealList.filter((m) => m.status === "rejected").length,
  };

  if (plan.status === "generating") {
    return { phase: "generating", mealPlanId: plan._id, meals: mealList, counts };
  }

  return { phase: "reviewing", mealPlanId: plan._id, meals: mealList, counts };
}
