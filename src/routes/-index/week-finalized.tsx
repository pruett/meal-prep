import type { Id } from "../../../convex/_generated/dataModel";
import { PrepGuideInline } from "~/components/prep/prep-guide-inline";

export function WeekFinalized({
  mealPlanId,
}: {
  mealPlanId: Id<"mealPlans">;
}) {
  return <PrepGuideInline mealPlanId={mealPlanId} />;
}
