import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { MealCounts, GenerateMoreMutation } from "./types";
import {
  LOAD_MORE_THRESHOLD,
  LOAD_MORE_BATCH_SIZE,
  VISIBLE_PENDING_LIMIT,
} from "~/lib/meal-generation";
import {
  SwipeListProvider,
  SwipeListHeader,
  SwipeListTitle,
  SwipeList,
  SwipeListCard,
  SwipeListStage,
  SwipeListCardItem,
  SwipeListEmpty,
  useSwipeList,
} from "~/components/ui/swipe-list";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import {
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemActions,
  Item,
} from "~/components/ui/item";
import { useMealImage } from "~/hooks/use-meal-image";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

export function WeekReviewing({
  meals,
  mealPlanId,
  counts,
  totalSlots,
  generateMore,
  outOfCredits,
}: {
  meals: Doc<"meals">[];
  mealPlanId: Id<"mealPlans">;
  counts: MealCounts;
  totalSlots: number;
  generateMore: GenerateMoreMutation;
  outOfCredits: boolean;
}) {
  const updateStatus = useMutation(api.meals.updateStatus);

  const maxGeneratedMeals = totalSlots * 3;

  const allPendingMeals = useMemo(
    () =>
      meals.filter((m) => m.status !== "accepted" && m.status !== "rejected"),
    [meals],
  );

  const visibleMeals = useMemo(
    () => allPendingMeals.slice(0, VISIBLE_PENDING_LIMIT),
    [allPendingMeals],
  );

  const handleLoadMore = useCallback(() => {
    if (generateMore.isPending || outOfCredits) return;
    if (counts.accepted >= totalSlots) return;
    if (meals.length >= maxGeneratedMeals) return;
    if (allPendingMeals.length > LOAD_MORE_THRESHOLD) return;
    generateMore.mutate({ mealPlanId, count: LOAD_MORE_BATCH_SIZE });
  }, [
    generateMore,
    outOfCredits,
    counts.accepted,
    totalSlots,
    mealPlanId,
    meals.length,
    maxGeneratedMeals,
    allPendingMeals.length,
  ]);

  if (counts.total === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No meals generated yet</EmptyTitle>
          <EmptyDescription>
            Something may have gone wrong during generation. Try generating
            again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() => generateMore.mutate({ mealPlanId })}
            disabled={generateMore.isPending || outOfCredits}
            size="lg"
          >
            {generateMore.isPending ? (
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
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-semibold">Meal Suggestions</h2>
      <p>Swipe left to dismiss Swipe right to accept</p>
      <SwipeListProvider
        items={visibleMeals}
        loadMoreThreshold={LOAD_MORE_THRESHOLD}
        onLoadMore={handleLoadMore}
        onSwipeRight={async (meal) => {
          try {
            await updateStatus({ id: meal._id, status: "accepted" });
          } catch {
            toast.error("Failed to accept meal");
          }
        }}
        onSwipeLeft={async (meal) => {
          try {
            await updateStatus({ id: meal._id, status: "rejected" });
          } catch {
            toast.error("Failed to dismiss meal");
          }
        }}
        className="-mx-4"
      >
        {/*<Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await Promise.all(
              meals.map((m) => updateStatus({ id: m._id, status: "pending" })),
            );
          }}
        >
          Test: Reset meals back to pending
        </Button>*/}
        {/*<SwipeListHeader className="flex-col items-start">
          <SwipeListTitle>Meal Suggestions</SwipeListTitle>
          <div className="inline-flex gap-2">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600">&rarr;</span> Swipe right to
              keep
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              Swipe left to dismiss{" "}
              <span className="text-rose-500">&larr;</span>
            </span>
          </div>
        </SwipeListHeader>*/}
        <SwipeList>
          <PendingMealCards isGeneratingMore={generateMore.isPending} />
        </SwipeList>
        <SwipeListEmpty>
          <ReviewCompleteContent
            meals={meals}
            mealPlanId={mealPlanId}
            totalSlots={totalSlots}
            generateMore={generateMore}
            outOfCredits={outOfCredits}
          />
        </SwipeListEmpty>
      </SwipeListProvider>
      <AcceptedMealsDrawer meals={meals} totalSlots={totalSlots} />
    </>
  );
}

// ── Accepted meals drawer ────────────────────────────────────────────────────

function AcceptedMealsDrawer({
  meals,
  totalSlots,
}: {
  meals: Doc<"meals">[];
  totalSlots: number;
}) {
  const updateStatus = useMutation(api.meals.updateStatus);
  const acceptedMeals = useMemo(
    () => meals.filter((m) => m.status === "accepted"),
    [meals],
  );
  const thresholdMet = acceptedMeals.length >= totalSlots;

  return (
    <Drawer open={thresholdMet} dismissible={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Your Weekly Plan</DrawerTitle>
          <DrawerDescription>
            {acceptedMeals.length} meal
            {acceptedMeals.length !== 1 ? "s" : ""} you've chosen for the week
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {acceptedMeals.map((meal) => (
            <DrawerMealRow
              key={meal._id}
              meal={meal}
              onRemove={async () => {
                await updateStatus({ id: meal._id, status: "pending" });
              }}
            />
          ))}
        </div>
        <DrawerFooter>
          <Button size="lg">
            Finalize Plan
            <ArrowRight data-icon="inline-end" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ── Internal sub-components ──────────────────────────────────────────────────

function ReviewCompleteContent({
  meals,
  mealPlanId,
  totalSlots,
  generateMore,
  outOfCredits,
}: {
  meals: Doc<"meals">[];
  mealPlanId: Id<"mealPlans">;
  totalSlots: number;
  generateMore: GenerateMoreMutation;
  outOfCredits: boolean;
}) {
  const { swipedRight } = useSwipeList<Doc<"meals">>();
  const acceptedCount = meals.filter((m) => m.status === "accepted").length;
  const totalAccepted = Math.max(acceptedCount, swipedRight.length);
  const remaining = totalSlots - totalAccepted;
  const needsMore = remaining > 0;

  return (
    <>
      <span className="text-4xl">✨</span>
      <div>
        <h2 className="text-lg font-bold">All reviewed!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsMore
            ? `You still need ${remaining} more meal${remaining !== 1 ? "s" : ""} to fill your week.`
            : "You've reviewed all meal suggestions."}
        </p>
      </div>
      {needsMore && (
        <Button
          onClick={() => generateMore.mutate({ mealPlanId })}
          disabled={generateMore.isPending || outOfCredits}
          size="lg"
        >
          {generateMore.isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              Generating…
            </>
          ) : (
            <>
              <RefreshCw data-icon="inline-start" />
              Generate More
            </>
          )}
        </Button>
      )}
    </>
  );
}

function PendingMealCards({ isGeneratingMore }: { isGeneratingMore: boolean }) {
  const { remaining } = useSwipeList<Doc<"meals">>();
  return (
    <>
      <ItemGroup className="gap-1">
        {remaining.map((meal) => (
          <SwipeListCard key={meal._id} value={meal}>
            <SwipeListStage>
              <SwipeListCardItem>
                <div className="w-[25%] shrink-0 aspect-square overflow-hidden">
                  <MealCardImage meal={meal} />
                </div>
                <ItemContent className="p-3">
                  <ItemTitle>{meal.name}</ItemTitle>
                  <ItemDescription className="text-xs">
                    {meal.keyIngredients.join(", ")}
                  </ItemDescription>
                </ItemContent>
              </SwipeListCardItem>
            </SwipeListStage>
            <Separator className="my-0" />
          </SwipeListCard>
        ))}
        {isGeneratingMore && (
          <Item>
            <ItemContent className="items-center">
              <ItemTitle>
                <Spinner className="size-4" />
              </ItemTitle>
              <ItemDescription>Loading more...</ItemDescription>
            </ItemContent>
          </Item>
        )}
      </ItemGroup>
    </>
  );
}

function MealCardImage({ meal }: { meal: Doc<"meals"> }) {
  const { imageUrl } = useMealImage(meal);
  if (!imageUrl) return <Skeleton className="size-full rounded-none" />;
  return <img className="size-full" src={imageUrl} alt={meal.name} />;
}

function DrawerMealRow({
  meal,
  onRemove,
}: {
  meal: Doc<"meals">;
  onRemove: (meal: Doc<"meals">) => void;
}) {
  const { imageUrl } = useMealImage(meal);
  return (
    <Item variant="outline" size="sm">
      <ItemMedia variant="image">
        {imageUrl && <img src={imageUrl} alt={meal.name} />}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{meal.name}</ItemTitle>
        <ItemDescription className="text-xs">
          {meal.keyIngredients.join(", ")}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="icon" variant="secondary" onClick={() => onRemove(meal)}>
          <X className="size-4" />
        </Button>
      </ItemActions>
    </Item>
  );
}
