import { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import { useHousehold } from '@/features/auth/useHousehold'
import { useCatalog } from '@/features/catalog/useCatalog'
import { usePurchaseHistoryQuery } from '@/features/suggestions/useSuggestions'
import { formatShortDate } from '@/lib/format'

interface PurchaseFrequencyTableProps {
  /** Data di riferimento, passata dal genitore per tenere il render puro */
  now: Date
  /** Filtro categoria delle analitiche (null = tutte) */
  categoryId: string | null
  limit?: number
}

const MONTH_MS = 30 * 86_400_000

/**
 * I prodotti comprati negli ultimi 30 giorni: quante volte e l'ultimo giorno.
 * Indipendente dal periodo scelto in alto (è sempre "l'ultimo mese"), segue
 * solo il filtro per categoria.
 */
export function PurchaseFrequencyTable({
  now,
  categoryId,
  limit = 15,
}: PurchaseFrequencyTableProps) {
  const { household } = useHousehold()
  const catalog = useCatalog()
  const history = usePurchaseHistoryQuery(household.id)

  const rows = useMemo(() => {
    const since = now.getTime() - MONTH_MS
    const byItem = new Map<string, { count: number; last: number }>()
    for (const purchase of history.data ?? []) {
      const at = new Date(purchase.purchased_at).getTime()
      if (at < since) continue
      const row = byItem.get(purchase.item_id)
      if (row) {
        row.count += 1
        row.last = Math.max(row.last, at)
      } else {
        byItem.set(purchase.item_id, { count: 1, last: at })
      }
    }
    return [...byItem.entries()]
      .flatMap(([itemId, stats]) => {
        const item = catalog.itemById.get(itemId)
        if (!item || (categoryId && item.category_id !== categoryId)) return []
        return [{ item, ...stats }]
      })
      .sort(
        (a, b) => b.count - a.count || b.last - a.last || a.item.name.localeCompare(b.item.name),
      )
  }, [history.data, catalog.itemById, categoryId, now])

  if (rows.length === 0) {
    return <p className="py-2 text-sm text-secondary">Nessun acquisto nell&apos;ultimo mese.</p>
  }

  return (
    <div className="-mx-1 overflow-hidden rounded-2xl">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="text-[11px] font-bold tracking-[0.06em] text-secondary uppercase">
            <th scope="col" className="px-3 py-2 text-left">
              Prodotto
            </th>
            <th scope="col" className="w-24 px-1 py-2 text-right">
              Ultimo
            </th>
            <th scope="col" className="w-16 px-3 py-2 text-right">
              Volte
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {rows.slice(0, limit).map(({ item, count, last }) => (
            <tr key={item.id}>
              <td className="px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon
                    name={item.icon}
                    size={16}
                    className="shrink-0 text-secondary"
                    aria-hidden="true"
                  />
                  <span className="line-clamp-2 min-w-0 leading-tight font-bold break-words text-primary">
                    {item.name}
                  </span>
                </span>
              </td>
              <td className="px-1 py-2 text-right whitespace-nowrap text-secondary tabular-nums">
                {formatShortDate(new Date(last))}
              </td>
              <td
                className="px-3 py-2 text-right font-black whitespace-nowrap text-primary tabular-nums"
                aria-label={`${count} ${count === 1 ? 'volta' : 'volte'}`}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
