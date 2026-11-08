import { describe, expect, it } from 'vitest'
import type { Category, Item } from '@/types/domain'
import { indexCatalog } from './catalogIndex'

const categoria = (id: string, slug: string) =>
  ({ id, slug, name: slug, icon: 'Apple' }) as Category
const prodotto = (id: string, categoryId: string, name = id) =>
  ({ id, category_id: categoryId, name, icon: 'Apple' }) as Item

describe('indexCatalog', () => {
  it('raggruppa i prodotti per categoria', () => {
    const c = indexCatalog(
      [categoria('c1', 'frutta')],
      [prodotto('i1', 'c1'), prodotto('i2', 'c1')],
    )
    expect(c.itemsByCategory.get('c1')?.map((i) => i.id)).toEqual(['i1', 'i2'])
    expect(c.categoryBySlug.get('frutta')?.id).toBe('c1')
  })

  it.each([undefined, null, {}, 'vecchio formato', 42, { pages: [] }])(
    'dati %j (cache di una versione vecchia) valgono "vuoto" senza lanciare',
    (dati) => {
      const c = indexCatalog(dati, dati)
      expect(c.categories).toEqual([])
      expect(c.items).toEqual([])
    },
  )

  it('salta le righe senza id, nome o categoria invece di lanciare', () => {
    const c = indexCatalog(
      [categoria('c1', 'frutta'), null, { id: 'c2' }],
      [prodotto('i1', 'c1'), null, { id: 'i2', category_id: 'c1', name: null }, { id: 'i3' }],
    )
    expect(c.categories.map((x) => x.id)).toEqual(['c1'])
    expect(c.items.map((x) => x.id)).toEqual(['i1'])
  })
})
