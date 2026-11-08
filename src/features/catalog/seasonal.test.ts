import { describe, expect, it } from 'vitest'
import type { Category, Item } from '@/types/domain'
import { currentMonth, seasonalItems } from './seasonal'

const categories = new Map<string, Category>([
  ['c1', { id: 'c1', slug: 'frutta' } as Category],
  ['c2', { id: 'c2', slug: 'verdura' } as Category],
  ['c3', { id: 'c3', slug: 'dispensa' } as Category],
])

function item(id: string, category: string, months: number[], archived = false): Item {
  return { id, category_id: category, season_months: months, is_archived: archived } as Item
}

describe('seasonalItems', () => {
  const items = [
    item('arance', 'c1', [11, 12, 1]),
    item('banane', 'c1', []),
    item('fragole', 'c1', [4, 5, 6]),
    item('zucca', 'c2', [9, 10, 11, 12]),
    item('castagnaccio', 'c3', [11]),
    item('vecchia', 'c2', [11], true),
  ]

  it("tiene frutta e verdura del mese, non i prodotti di tutto l'anno", () => {
    const ids = seasonalItems(items, categories, 11, ['frutta', 'verdura']).map((i) => i.id)
    expect(ids).toEqual(['arance', 'zucca'])
  })

  it('cambia con il mese', () => {
    const ids = seasonalItems(items, categories, 5, ['frutta', 'verdura']).map((i) => i.id)
    expect(ids).toEqual(['fragole'])
  })

  it('tollera categorie sconosciute e mesi mancanti', () => {
    const strani = [
      item('x', 'nessuna', [11]),
      { ...item('y', 'c1', []), season_months: undefined as never },
    ]
    expect(seasonalItems(strani, categories, 11, ['frutta'])).toEqual([])
  })
})

describe('currentMonth', () => {
  it('va da 1 a 12', () => {
    expect(currentMonth(new Date(2026, 0, 15))).toBe(1)
    expect(currentMonth(new Date(2026, 10, 8))).toBe(11)
    expect(currentMonth(new Date(2026, 11, 31))).toBe(12)
  })
})
