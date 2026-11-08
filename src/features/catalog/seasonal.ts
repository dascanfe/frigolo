import type { Category, Item } from '@/types/domain'

/** Mese corrente da 1 a 12 */
export function currentMonth(now = new Date()): number {
  return now.getMonth() + 1
}

/**
 * Prodotti di stagione nel mese dato, per le categorie indicate (slug).
 * Contano solo quelli con mesi indicati: chi ha `season_months` vuoto c'è
 * tutto l'anno e non è "di stagione". Mantiene l'ordine di `items`.
 */
export function seasonalItems(
  items: readonly Item[],
  categoryById: ReadonlyMap<string, Category>,
  month: number,
  categorySlugs: readonly string[],
): Item[] {
  return items.filter((item) => {
    if (item.is_archived) return false
    if (!Array.isArray(item.season_months) || !item.season_months.includes(month)) return false
    const slug = categoryById.get(item.category_id)?.slug
    return slug !== undefined && categorySlugs.includes(slug)
  })
}

/** Frutta e verdura di stagione, per la sezione "Di stagione" del catalogo */
export const SEASONAL_CATALOG_SLUGS = ['frutta', 'verdura'] as const
