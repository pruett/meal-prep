import { useState } from 'react'

type ShoppingItem = {
  item: string
  quantity: string
  unit: string
  category: string
}

interface ShoppingListProps {
  items: ShoppingItem[]
}

export function ShoppingList({ items }: ShoppingListProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No shopping items.
      </p>
    )
  }

  const categorized = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, ShoppingItem[]>,
  )

  const sortedCategories = Object.keys(categorized).sort()

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <ShoppingCategory
          key={category}
          category={category}
          items={categorized[category]}
        />
      ))}
    </div>
  )
}

function ShoppingCategory({
  category,
  items,
}: {
  category: string
  items: ShoppingItem[]
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {category}
      </h3>
      <div className="space-y-1">
        {items.map((item, i) => {
          const isChecked = checked.has(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                isChecked ? 'opacity-50' : ''
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isChecked
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span
                className={`flex-1 ${isChecked ? 'line-through' : 'text-foreground'}`}
              >
                {item.item}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.quantity} {item.unit}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
