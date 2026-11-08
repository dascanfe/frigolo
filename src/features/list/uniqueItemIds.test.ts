import { describe, expect, it } from 'vitest'
import { uniqueItemIds } from './uniqueItemIds'

describe('uniqueItemIds', () => {
  it("toglie le ripetizioni e tiene l'ordine di arrivo", () => {
    const rows = [
      { item_id: 'b' },
      { item_id: 'a' },
      { item_id: 'b' },
      { item_id: 'c' },
      { item_id: 'a' },
    ]
    expect(uniqueItemIds(rows)).toEqual(['b', 'a', 'c'])
  })

  it('con nessun acquisto non dà niente', () => {
    expect(uniqueItemIds([])).toEqual([])
  })
})
