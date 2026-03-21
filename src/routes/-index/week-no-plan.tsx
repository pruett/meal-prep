import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import {
  UtensilsCrossed,
  Settings,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

export function WeekNoPlan({
  outOfCredits,
  isGenerating,
  onGenerate,
  preferencesSummary,
}: {
  outOfCredits: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  preferencesSummary: string | null;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Empty className="mx-auto max-w-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UtensilsCrossed />
          </EmptyMedia>
          <EmptyTitle>No meals this week</EmptyTitle>
          <EmptyDescription>
            {outOfCredits
              ? "You've used all your generation credits. Meal generation is currently unavailable."
              : (
                <>
                  You haven't created any meal plans for this week.
                  <br />
                  Get started by creating this week's meal plan.
                </>
              )}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={onGenerate}
            disabled={isGenerating || outOfCredits}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Spinner data-icon="inline-start" />
                Generating…
              </>
            ) : (
              <>
                Generate Meals
                <ArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
          <Separator />
          <Link to="/preferences" className={buttonVariants({ variant: "link" })}>
            <Settings data-icon="inline-start" />
            Update Preferences
            <ArrowUpRight data-icon="inline-end" />
          </Link>
          {preferencesSummary && (
            <p className="text-xs text-muted-foreground">{preferencesSummary}</p>
          )}
        </EmptyContent>
      </Empty>
    </div>
  );
}
