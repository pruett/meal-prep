import type { MealCounts } from "./types";
import type { Id } from "../../../convex/_generated/dataModel";
import { Spinner } from "~/components/ui/spinner";

export function WeekGenerating({
  counts,
}: {
  mealPlanId: Id<"mealPlans">;
  counts: MealCounts;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Spinner className="size-8" />
      <div>
        <h2 className="text-lg font-semibold">Generating your meals…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {counts.total === 0
            ? "This may take a moment."
            : `${counts.total} meal${counts.total !== 1 ? "s" : ""} generated so far…`}
        </p>
      </div>
    </div>
  );
}
