import { Icon } from '@/components/Icon'
import { categoryColorVar } from '@/lib/colors'
import type { ItemTotals } from '@/types/domain'

interface TopItemsChartProps {
  items: ItemTotals[]
  limit?: number
}

/**
 * Top prodotti come barre orizzontali: icona del prodotto, nome, barra nel
 * colore della categoria e conteggio. L'identita' è portata da icona e
 * testo, il colore è un rinforzo.
 */
export function TopItemsChart({ items, limit = 10 }: TopItemsChartProps) {
  const top = items.slice(0, limit)
  const max = Math.max(1, ...top.map((i) => Number(i.purchase_count)))

  if (top.length === 0) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nel periodo.</p>
  }

  return (
    <ol className="flex flex-col gap-2.5" aria-label="Prodotti più acquistati">
      {top.map((item, index) => {
        const count = Number(item.purchase_count)
        return (
          <li key={item.item_id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
            <span
              className="flex size-7 items-center justify-center rounded-full bg-surface text-secondary ring-1 ring-subtle"
              aria-hidden="true"
            >
              <Icon name={item.item_icon} size={16} strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-bold text-primary">
                <span className="sr-only">{index + 1}. </span>
                {item.item_name}
              </span>
              <span
                className="h-2 w-full overflow-hidden rounded-full bg-surface"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.max(4, (count / max) * 100)}%`,
                    backgroundColor: categoryColorVar(item.category_slug),
                  }}
                />
              </span>
            </div>
            <span className="text-sm font-black tabular-nums text-primary">{count}</span>
          </li>
        )
      })}
    </ol>
  )
}
