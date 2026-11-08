import { Icon } from '@/components/Icon'
import type { ItemTotals } from '@/types/domain'

interface TopItemsChartProps {
  items: ItemTotals[]
  limit?: number
}

/**
 * Top prodotti come barre orizzontali: icona del prodotto, nome, barra e
 * conteggio. Un solo colore, l'accento del tema scelto: il primo è il più
 * pieno, gli altri sfumano con l'opacità. L'identità è portata da icona e testo.
 */
export function TopItemsChart({ items, limit = 10 }: TopItemsChartProps) {
  const top = items.slice(0, limit)
  const max = Math.max(1, ...top.map((i) => Number(i.purchase_count)))
  /** Accento del tema con una certa opacità (100 = pieno) */
  const accent = (percent: number) => `color-mix(in srgb, var(--accent) ${percent}%, transparent)`

  if (top.length === 0) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nel periodo.</p>
  }

  return (
    <ol className="flex flex-col gap-2.5" aria-label="Prodotti più acquistati">
      {top.map((item, index) => {
        const count = Number(item.purchase_count)
        // dal 100% del primo al 45% dell'ultimo, così la barra resta leggibile
        const strength = top.length > 1 ? 100 - (index / (top.length - 1)) * 55 : 100
        return (
          <li key={item.item_id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
            <span
              className="flex size-7 items-center justify-center rounded-full text-accent"
              style={{ backgroundColor: accent(14) }}
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
                    backgroundColor: accent(strength),
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
