import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  SwipeListProvider,
  SwipeListHeader,
  SwipeListTitle,
  SwipeListProgress,
  SwipeListProgressSkeleton,
  SwipeListHint,
  SwipeList,
  SwipeListCard,
  SwipeListCardSkeleton,
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
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "~/components/ui/item";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import {
  ChevronUp,
  CircleCheck,
  ArrowRight,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "~/components/ui/empty";
import { AppShell } from "~/components/layout/app-shell";

// ────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────

type MockMeal = {
  _id: string;
  name: string;
  description: string;
  keyIngredients: string[];
  estimatedPrepMinutes: number;
  status: "pending" | "accepted" | "rejected";
  imageUrl: string;
};

const MEAL_POOL: Omit<MockMeal, "_id" | "status">[] = [
  {
    name: "Lemon Herb Chicken Thighs",
    description:
      "Crispy-skinned chicken thighs with fresh herbs and bright lemon.",
    keyIngredients: ["chicken thighs", "lemon", "rosemary", "garlic"],
    estimatedPrepMinutes: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop",
  },
  {
    name: "Spicy Black Bean Tacos",
    description: "Quick weeknight tacos loaded with seasoned black beans.",
    keyIngredients: ["black beans", "tortillas", "avocado", "lime", "cilantro"],
    estimatedPrepMinutes: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=400&fit=crop",
  },
  {
    name: "Garlic Butter Salmon",
    description: "Pan-seared salmon finished with garlic butter and dill.",
    keyIngredients: ["salmon", "butter", "garlic", "dill", "lemon"],
    estimatedPrepMinutes: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop",
  },
  {
    name: "Thai Basil Stir-Fry",
    description: "Aromatic stir-fry with ground pork and fresh Thai basil.",
    keyIngredients: [
      "ground pork",
      "Thai basil",
      "soy sauce",
      "chili",
      "rice",
    ],
    estimatedPrepMinutes: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop",
  },
  {
    name: "Mushroom Risotto",
    description:
      "Creamy Arborio rice with mixed mushrooms and Parmesan cheese.",
    keyIngredients: [
      "Arborio rice",
      "mushrooms",
      "Parmesan",
      "white wine",
      "broth",
    ],
    estimatedPrepMinutes: 40,
    imageUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=400&fit=crop",
  },
  {
    name: "Mediterranean Bowl",
    description:
      "Grain bowl with hummus, roasted veggies, feta, and za'atar dressing.",
    keyIngredients: ["quinoa", "chickpeas", "feta", "cucumber", "hummus"],
    estimatedPrepMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
  },
  {
    name: "Beef & Broccoli",
    description:
      "Classic takeout-style beef and broccoli in a savory brown sauce.",
    keyIngredients: [
      "flank steak",
      "broccoli",
      "soy sauce",
      "ginger",
      "garlic",
    ],
    estimatedPrepMinutes: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop",
  },
  {
    name: "Shakshuka",
    description: "Eggs poached in spiced tomato sauce with crusty bread.",
    keyIngredients: [
      "eggs",
      "canned tomatoes",
      "cumin",
      "paprika",
      "feta",
      "bread",
    ],
    estimatedPrepMinutes: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&h=400&fit=crop",
  },
  {
    name: "Pesto Pasta with Cherry Tomatoes",
    description: "Simple pasta tossed with fresh basil pesto and tomatoes.",
    keyIngredients: [
      "pasta",
      "basil pesto",
      "cherry tomatoes",
      "Parmesan",
      "pine nuts",
    ],
    estimatedPrepMinutes: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=400&fit=crop",
  },
  {
    name: "Korean BBQ Bowls",
    description: "Sweet and savory bulgogi-style beef over steamed rice.",
    keyIngredients: [
      "beef sirloin",
      "gochujang",
      "rice",
      "sesame",
      "pickled radish",
    ],
    estimatedPrepMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&h=400&fit=crop",
  },
  {
    name: "Caprese Chicken",
    description:
      "Baked chicken breast topped with mozzarella, tomato, and basil.",
    keyIngredients: [
      "chicken breast",
      "mozzarella",
      "tomato",
      "basil",
      "balsamic",
    ],
    estimatedPrepMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=400&fit=crop",
  },
  {
    name: "Coconut Curry Lentils",
    description: "Creamy red lentil curry with coconut milk and warm spices.",
    keyIngredients: [
      "red lentils",
      "coconut milk",
      "curry powder",
      "ginger",
      "spinach",
    ],
    estimatedPrepMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=400&fit=crop",
  },
  {
    name: "Fish Tacos with Slaw",
    description: "Crispy fish tacos with tangy cabbage slaw and crema.",
    keyIngredients: ["white fish", "cabbage", "lime", "tortillas", "crema"],
    estimatedPrepMinutes: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?w=400&h=400&fit=crop",
  },
  {
    name: "Honey Garlic Pork Chops",
    description:
      "Pan-seared pork chops glazed with honey, garlic, and soy sauce.",
    keyIngredients: ["pork chops", "honey", "garlic", "soy sauce", "butter"],
    estimatedPrepMinutes: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=400&h=400&fit=crop",
  },
  {
    name: "Spinach & Feta Stuffed Peppers",
    description: "Bell peppers filled with rice, spinach, and crumbled feta.",
    keyIngredients: ["bell peppers", "rice", "spinach", "feta", "tomato sauce"],
    estimatedPrepMinutes: 40,
    imageUrl:
      "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=400&fit=crop",
  },
  {
    name: "Shrimp Scampi",
    description:
      "Garlicky butter shrimp over linguine with white wine and parsley.",
    keyIngredients: [
      "shrimp",
      "linguine",
      "garlic",
      "white wine",
      "parsley",
    ],
    estimatedPrepMinutes: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=400&fit=crop",
  },
  {
    name: "Chicken Tikka Masala",
    description:
      "Tender chicken in a rich, spiced tomato-cream sauce with naan.",
    keyIngredients: [
      "chicken thighs",
      "yogurt",
      "tomato sauce",
      "garam masala",
      "cream",
    ],
    estimatedPrepMinutes: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop",
  },
  {
    name: "Crispy Tofu Bowl",
    description:
      "Baked crispy tofu with edamame, avocado, and sesame-ginger dressing.",
    keyIngredients: [
      "firm tofu",
      "edamame",
      "avocado",
      "rice",
      "sesame oil",
    ],
    estimatedPrepMinutes: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
  },
  {
    name: "BBQ Pulled Chicken Sandwiches",
    description:
      "Slow-cooked shredded chicken with tangy BBQ sauce on brioche buns.",
    keyIngredients: [
      "chicken breast",
      "BBQ sauce",
      "brioche buns",
      "coleslaw",
      "pickles",
    ],
    estimatedPrepMinutes: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop",
  },
  {
    name: "One-Pot Pasta Primavera",
    description:
      "Pasta cooked with seasonal vegetables in a light garlic-herb broth.",
    keyIngredients: ["pasta", "zucchini", "bell pepper", "garlic", "Parmesan"],
    estimatedPrepMinutes: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
  },
];

let nextMealId = 1;

function createMockMeal(poolIndex: number): MockMeal {
  const template = MEAL_POOL[poolIndex % MEAL_POOL.length]!;
  return {
    ...template,
    _id: `mock_meal_${nextMealId++}`,
    status: "pending",
  };
}

function generateBatch(count: number, startPoolIndex: number): MockMeal[] {
  return Array.from({ length: count }, (_, i) =>
    createMockMeal(startPoolIndex + i),
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────
// Route
// ────────────────────────────────────────────────

export const Route = createFileRoute("/playground/swipe-list")({
  component: PlaygroundSwipeList,
});

// ────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────

// Playground-specific tunables
const TOTAL_SLOTS = 7;
const PG_VISIBLE_LIMIT = 4;
const PG_LOAD_MORE_THRESHOLD = 2;
const PG_LOAD_MORE_BATCH = 3;
const PG_INITIAL_COUNT = 6;
const PG_MAX_GENERATED = TOTAL_SLOTS * 3;

function PlaygroundSwipeList() {
  const [meals, setMeals] = useState<MockMeal[]>([]);
  const [poolCursor, setPoolCursor] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [weekStatus, setWeekStatus] = useState<"empty" | "reviewing">("empty");
  const [loadMoreCount, setLoadMoreCount] = useState(0);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    await delay(2000);
    const batch = generateBatch(PG_INITIAL_COUNT, 0);
    setMeals(batch);
    setPoolCursor(PG_INITIAL_COUNT);
    setLoadMoreCount(0);
    setWeekStatus("reviewing");
    setIsGenerating(false);
  }, []);

  const handleGenerateMore = useCallback(async () => {
    if (isGeneratingMore) return;
    setIsGeneratingMore(true);
    await delay(1500);
    const batch = generateBatch(PG_LOAD_MORE_BATCH, poolCursor);
    setMeals((prev) => [...prev, ...batch]);
    setPoolCursor((prev) => prev + PG_LOAD_MORE_BATCH);
    setLoadMoreCount((prev) => prev + 1);
    setIsGeneratingMore(false);
  }, [isGeneratingMore, poolCursor]);

  const handleUpdateStatus = useCallback(
    async (id: string, status: "accepted" | "rejected") => {
      // Simulate a small network delay
      await delay(150);
      setMeals((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status } : m)),
      );
    },
    [],
  );

  const handleResetAll = useCallback(() => {
    setMeals((prev) => prev.map((m) => ({ ...m, status: "pending" })));
  }, []);

  const handleStartOver = useCallback(() => {
    nextMealId = 1;
    setMeals([]);
    setPoolCursor(0);
    setWeekStatus("empty");
  }, []);

  return (
    <AppShell className="bg-muted">
      <section className="mb-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Swipe List Playground
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All data is mocked. Network requests are simulated with delays.
            </p>
          </div>
          {weekStatus === "reviewing" && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetAll}>
                Reset Statuses
              </Button>
              <Button variant="outline" size="sm" onClick={handleStartOver}>
                Start Over
              </Button>
            </div>
          )}
        </div>
      </section>

      {weekStatus === "reviewing" && (
        <DebugMonitor
          meals={meals}
          isGeneratingMore={isGeneratingMore}
          loadMoreCount={loadMoreCount}
        />
      )}

      <section className="pt-4">
        {weekStatus === "empty" && !isGenerating && (
          <Empty className="mx-auto max-w-lg border border-dashed">
            <EmptyHeader>
              <UtensilsCrossed className="mx-auto size-10 text-muted-foreground/40" />
              <EmptyTitle>No meals this week</EmptyTitle>
              <EmptyDescription>
                Get started by generating meal suggestions.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                Generate Meals
                <ArrowRight data-icon="inline-end" />
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {weekStatus === "empty" && isGenerating && (
          <PlaygroundGeneratingSkeleton />
        )}
        {weekStatus === "reviewing" && (
          <PlaygroundReviewingView
            meals={meals}
            isGeneratingMore={isGeneratingMore}
            onGenerateMore={handleGenerateMore}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </section>
    </AppShell>
  );
}

// ────────────────────────────────────────────────
// Generating Skeleton
// ────────────────────────────────────────────────

function PlaygroundMealCardSkeleton() {
  return (
    <>
      <SwipeListCardSkeleton>
        <div className="w-[25%] shrink-0 aspect-square">
          <Skeleton className="size-full rounded-none" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <Skeleton className="h-4 w-3/5 rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
        </div>
      </SwipeListCardSkeleton>
      <Separator className="my-0" />
    </>
  );
}

function PlaygroundGeneratingSkeleton() {
  return (
    <div className="-mx-4 flex flex-col">
      <SwipeListHeader>
        <Skeleton className="h-6 w-40 rounded-lg" />
      </SwipeListHeader>
      <SwipeListProgressSkeleton />
      <div className="flex flex-col pb-4">
        {Array.from({ length: PG_VISIBLE_LIMIT }).map((_, i) => (
          <PlaygroundMealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Reviewing View
// ────────────────────────────────────────────────

function PlaygroundReviewingView({
  meals,
  isGeneratingMore,
  onGenerateMore,
  onUpdateStatus,
}: {
  meals: MockMeal[];
  isGeneratingMore: boolean;
  onGenerateMore: () => void;
  onUpdateStatus: (id: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const allPending = useMemo(
    () =>
      meals.filter((m) => m.status !== "accepted" && m.status !== "rejected"),
    [meals],
  );

  const visibleMeals = useMemo(
    () => allPending.slice(0, PG_VISIBLE_LIMIT),
    [allPending],
  );

  const handleLoadMore = useCallback(() => {
    if (isGeneratingMore) return;
    if (meals.length >= PG_MAX_GENERATED) return;
    if (allPending.length > PG_LOAD_MORE_THRESHOLD) return;
    onGenerateMore();
  }, [isGeneratingMore, meals.length, allPending.length, onGenerateMore]);

  return (
    <SwipeListProvider
      items={visibleMeals}
      loadMoreThreshold={PG_LOAD_MORE_THRESHOLD}
      onLoadMore={handleLoadMore}
      onSwipeRight={async (meal) => {
        try {
          await onUpdateStatus(meal._id, "accepted");
        } catch {
          toast.error("Failed to accept meal");
        }
      }}
      onSwipeLeft={async (meal) => {
        try {
          await onUpdateStatus(meal._id, "rejected");
        } catch {
          toast.error("Failed to dismiss meal");
        }
      }}
      className="-mx-4"
    >
      <SwipeListHeader>
        <SwipeListTitle>Meal Suggestions</SwipeListTitle>
        {isGeneratingMore && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Loading more…
          </span>
        )}
      </SwipeListHeader>
      <SwipeListProgress />
      <SwipeListHint />
      <SwipeList>
        <PlaygroundPendingCards />
      </SwipeList>
      <Drawer>
        <DrawerTrigger asChild>
          <PlaygroundSelectedTrigger />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Your Weekly Plan</DrawerTitle>
            <PlaygroundSelectedDescription />
          </DrawerHeader>
          <PlaygroundDrawerMealList />
          <DrawerFooter>
            <Button size="lg">
              Finalize Plan
              <ArrowRight data-icon="inline-end" />
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <SwipeListEmpty>
        <PlaygroundReviewComplete
          meals={meals}
          isGeneratingMore={isGeneratingMore}
          onGenerateMore={onGenerateMore}
        />
      </SwipeListEmpty>
    </SwipeListProvider>
  );
}

// ────────────────────────────────────────────────
// Pending Cards
// ────────────────────────────────────────────────

// ────────────────────────────────────────────────
// Debug Monitor
// ────────────────────────────────────────────────

function DebugMonitor({
  meals,
  isGeneratingMore,
  loadMoreCount,
}: {
  meals: MockMeal[];
  isGeneratingMore: boolean;
  loadMoreCount: number;
}) {
  const accepted = meals.filter((m) => m.status === "accepted").length;
  const rejected = meals.filter((m) => m.status === "rejected").length;
  const pending = meals.filter(
    (m) => m.status !== "accepted" && m.status !== "rejected",
  ).length;
  const visible = Math.min(pending, PG_VISIBLE_LIMIT);
  const backlog = pending - visible;

  const entries = [
    { label: "Total meals", value: meals.length },
    { label: "Pending", value: pending },
    { label: "Visible", value: `${visible} / ${PG_VISIBLE_LIMIT}` },
    { label: "Backlog", value: backlog },
    { label: "Accepted", value: accepted, color: "text-emerald-600" },
    { label: "Rejected", value: rejected, color: "text-rose-500" },
    { label: "Load-more fires", value: loadMoreCount },
    {
      label: "Generating more",
      value: isGeneratingMore ? "yes" : "no",
      color: isGeneratingMore ? "text-amber-500" : undefined,
    },
    {
      label: "Load-more threshold",
      value: `pending <= ${PG_LOAD_MORE_THRESHOLD}`,
    },
    { label: "Max generated", value: `${meals.length} / ${PG_MAX_GENERATED}` },
  ];

  return (
    <section className="mb-4 rounded-xl border border-border bg-background p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Debug Monitor
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3 md:grid-cols-5">
        {entries.map((e) => (
          <div key={e.label} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{e.label}</span>
            <span className={`font-mono font-medium ${"color" in e && e.color ? e.color : "text-foreground"}`}>
              {e.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────
// Pending Cards
// ────────────────────────────────────────────────

function PlaygroundPendingCards() {
  const { remaining } = useSwipeList<MockMeal>();
  return (
    <ItemGroup className="gap-1">
      {remaining.map((meal) => (
        <SwipeListCard key={meal._id} value={meal}>
          <SwipeListStage>
            <SwipeListCardItem>
              <div className="w-[25%] shrink-0 aspect-square overflow-hidden">
                <MockMealImage meal={meal} />
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
    </ItemGroup>
  );
}

function MockMealImage({ meal }: { meal: MockMeal }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton className="size-full rounded-none" />}
      <img
        className={`size-full object-cover ${loaded ? "" : "hidden"}`}
        src={meal.imageUrl}
        alt={meal.name}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

// ────────────────────────────────────────────────
// Selected Meals Trigger (Drawer)
// ────────────────────────────────────────────────

function PlaygroundSelectedTrigger() {
  const { swipedRight } = useSwipeList<MockMeal>();
  return (
    <>
      <div className="flex -space-x-1.5">
        {swipedRight.slice(0, 4).map((meal) => (
          <div
            key={meal._id}
            className="size-8 shrink-0 overflow-hidden rounded-full border-2 border-card bg-muted"
          >
            <img
              src={meal.imageUrl}
              alt={meal.name}
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {swipedRight.length} meal{swipedRight.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
        <p className="text-xs text-muted-foreground">
          Tap to review your picks
        </p>
      </div>
      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
}

function PlaygroundSelectedDescription() {
  const { swipedRight } = useSwipeList<MockMeal>();
  return (
    <DrawerDescription>
      {swipedRight.length} meal{swipedRight.length !== 1 ? "s" : ""} you've
      chosen for the week
    </DrawerDescription>
  );
}

// ────────────────────────────────────────────────
// Drawer Meal List
// ────────────────────────────────────────────────

function PlaygroundDrawerMealList() {
  const { swipedRight } = useSwipeList<MockMeal>();
  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4">
      {swipedRight.map((meal) => (
        <div
          key={meal._id}
          className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
        >
          <img
            src={meal.imageUrl}
            alt={meal.name}
            className="size-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{meal.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {meal.keyIngredients.join(", ")}
            </p>
          </div>
          <CircleCheck className="size-4 shrink-0 text-emerald-500" />
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// Review Complete
// ────────────────────────────────────────────────

function PlaygroundReviewComplete({
  meals,
  isGeneratingMore,
  onGenerateMore,
}: {
  meals: MockMeal[];
  isGeneratingMore: boolean;
  onGenerateMore: () => void;
}) {
  const { swipedRight } = useSwipeList<MockMeal>();
  const acceptedCount = meals.filter((m) => m.status === "accepted").length;
  const totalAccepted = Math.max(acceptedCount, swipedRight.length);
  const remaining = TOTAL_SLOTS - totalAccepted;
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
          onClick={onGenerateMore}
          disabled={isGeneratingMore}
          size="lg"
        >
          {isGeneratingMore ? (
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
