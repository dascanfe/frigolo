import type { Category, Item } from '@/types/domain'

export interface Catalog {
  categories: Category[]
  items: Item[]
  categoryById: Map<string, Category>
  categoryBySlug: Map<string, Category>
  itemById: Map<string, Item>
  /** Prodotti per categoria, già ordinati per nome */
  itemsByCategory: Map<string, Item[]>
  isPending: boolean
  error: Error | null
}

/**
 * Indici di categorie e prodotti. Tollera dati non previsti (cache persistita
 * di una versione vecchia, risposte parziali): ciò che non è un elenco vale
 * "vuoto", le righe senza id, nome o categoria si saltano, invece di far
 * lanciare il render e lasciare lo schermo bianco.
 */
export function indexCatalog(
  categoryData: unknown,
  itemData: unknown,
): Pick<
  Catalog,
  'categories' | 'items' | 'categoryById' | 'categoryBySlug' | 'itemById' | 'itemsByCategory'
> {
  const categories = (Array.isArray(categoryData) ? categoryData : []).filter(
    (c): c is Category => Boolean(c) && typeof c.id === 'string' && typeof c.slug === 'string',
  )
  const items = (Array.isArray(itemData) ? itemData : []).filter(
    (i): i is Item =>
      Boolean(i) &&
      typeof i.id === 'string' &&
      typeof i.name === 'string' &&
      typeof i.category_id === 'string',
  )
  const itemsByCategory = new Map<string, Item[]>()
  for (const item of items) {
    const bucket = itemsByCategory.get(item.category_id)
    if (bucket) bucket.push(item)
    else itemsByCategory.set(item.category_id, [item])
  }
  return {
    categories,
    items,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    categoryBySlug: new Map(categories.map((c) => [c.slug, c])),
    itemById: new Map(items.map((i) => [i.id, i])),
    itemsByCategory,
  }
}
