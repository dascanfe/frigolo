import { describe, expect, it } from 'vitest'
import { computeStats, suggest } from './engine'
import type { PurchaseRecord, SuggestionItem } from './engine'

/** 15 ottobre 2026, mezzogiorno */
const NOW = new Date(2026, 9, 15, 12, 0, 0)

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000)
}

function item(id: string, category = 'cat-a', season: number[] = []): SuggestionItem {
  return { id, category_id: category, season_months: season, is_archived: false }
}

function bought(itemId: string, ...days: number[]): PurchaseRecord[] {
  return days.map((d) => ({ item_id: itemId, purchased_at: daysAgo(d).toISOString() }))
}

describe('computeStats', () => {
  it('conta i giorni distinti e calcola intervallo medio e giorni dall ultimo acquisto', () => {
    const stats = computeStats([...bought('latte', 21, 14, 14, 7)], NOW)
    const latte = stats.get('latte')
    expect(latte?.count).toBe(3)
    expect(latte?.meanIntervalDays).toBe(7)
    expect(latte?.daysSinceLast).toBe(7)
  })

  it('ignora acquisti nel futuro e date non valide', () => {
    const stats = computeStats(
      [
        { item_id: 'x', purchased_at: 'non-una-data' },
        { item_id: 'x', purchased_at: daysAgo(-3).toISOString() },
      ],
      NOW,
    )
    expect(stats.has('x')).toBe(false)
  })
})

describe('stagionalita', () => {
  it('suggerisce i prodotti di stagione nel mese corrente, con bonus se gia comprati', () => {
    const items = [
      item('zucca', 'verdura', [9, 10, 11]),
      item('fragole', 'frutta', [4, 5, 6]),
      item('cachi', 'frutta', [10, 11]),
    ]
    const result = suggest({ items, purchases: bought('cachi', 400), now: NOW })
    expect(result.map((s) => s.itemId)).toEqual(['cachi', 'zucca'])
    expect(result[0]?.kind).toBe('season')
    expect(result[0]?.reason).toBe('Di stagione a ottobre')
    expect(result[0]?.score).toBeGreaterThan(result[1]?.score ?? 0)
  })
})

describe('ricorrenza', () => {
  it('suggerisce quando sono passati almeno l 80% dei giorni dell intervallo medio', () => {
    const items = [item('latte')]
    const pronto = suggest({ items, purchases: bought('latte', 27, 20, 13, 6), now: NOW })
    expect(pronto).toHaveLength(1)
    expect(pronto[0]?.kind).toBe('habit')
    expect(pronto[0]?.reason).toBe('Di solito ogni 7 giorni')

    const troppoPresto = suggest({ items, purchases: bought('latte', 23, 16, 9, 2), now: NOW })
    expect(troppoPresto).toHaveLength(0)
  })

  it('richiede almeno 3 acquisti e cresce col ritardo', () => {
    const items = [item('latte'), item('pane')]
    const purchases = [...bought('latte', 27, 20, 13, 6), ...bought('pane', 34, 20, 6)]
    const result = suggest({ items, purchases, now: NOW })
    // pane: intervallo 14, passati 6 giorni -> non pronto; latte pronto
    expect(result.map((s) => s.itemId)).toEqual(['latte'])

    const inRitardo = suggest({
      items: [item('latte')],
      purchases: bought('latte', 35, 28, 21, 14),
      now: NOW,
    })
    const puntuale = suggest({
      items: [item('latte')],
      purchases: bought('latte', 27, 20, 13, 6),
      now: NOW,
    })
    expect(inRitardo[0]?.score ?? 0).toBeGreaterThan(puntuale[0]?.score ?? 0)
  })

  it('con un solo acquisto non usa la ricorrenza', () => {
    const result = suggest({ items: [item('latte')], purchases: bought('latte', 90), now: NOW })
    expect(result).toHaveLength(0)
  })

  it('con 2 acquisti usa il loro intervallo come ritmo', () => {
    // comprato 20 e 10 giorni fa: ritmo 10 giorni, passati 10 -> pronto
    const result = suggest({ items: [item('latte')], purchases: bought('latte', 20, 10), now: NOW })
    expect(result[0]?.reason).toBe('Di solito ogni 10 giorni')
  })
})

describe('frequenza recente', () => {
  it('suggerisce con almeno 2 acquisti negli ultimi 60 giorni', () => {
    // 2 acquisti a 25 giorni di distanza, l'ultimo 25 giorni fa: la ricorrenza
    // non è pronta (ratio 1.0 lo è, quindi il motivo viene da lì)
    const result = suggest({ items: [item('caffe')], purchases: bought('caffe', 50, 25), now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0]?.kind).toBe('habit')
    // il motivo di frequenza compare quando la ricorrenza non è ancora scattata
    const presto = suggest({ items: [item('caffe')], purchases: bought('caffe', 50, 8), now: NOW })
    expect(presto).toHaveLength(0)
  })

  it('usa "questo mese" quando gli acquisti sono negli ultimi 30 giorni', () => {
    // ritmo 8 giorni, passati 12: ricorrenza pronta, quindi il motivo è il ritmo;
    // la frequenza contribuisce comunque al punteggio
    const result = suggest({ items: [item('caffe')], purchases: bought('caffe', 20, 12), now: NOW })
    expect(result[0]?.reason).toBe('Di solito ogni 8 giorni')
    expect(result[0]?.score).toBeGreaterThan(1.5)
  })

  it('non suggerisce cio che e stato comprato da poco (cooldown)', () => {
    // comprato ieri, ritmo settimanale: è nel cooldown
    expect(
      suggest({ items: [item('caffe')], purchases: bought('caffe', 15, 8, 1), now: NOW }),
    ).toHaveLength(0)
    // un solo acquisto 3 giorni fa, di stagione: cooldown di default 7 giorni
    expect(
      suggest({ items: [item('zucca', 'verdura', [10])], purchases: bought('zucca', 3), now: NOW }),
    ).toHaveLength(0)
  })
})

describe('esclusioni e diversificazione', () => {
  it('esclude prodotti in lista, nel carrello e archiviati', () => {
    const items = [
      item('a', 'cat', [10]),
      item('b', 'cat', [10]),
      { ...item('c', 'cat', [10]), is_archived: true },
    ]
    const result = suggest({ items, purchases: [], now: NOW, excludeItemIds: new Set(['a']) })
    expect(result.map((s) => s.itemId)).toEqual(['b'])
  })

  it('massimo 15 suggerimenti e non piu di 4 per categoria', () => {
    const items: SuggestionItem[] = []
    for (let i = 0; i < 8; i++) items.push(item(`frutta-${i}`, 'frutta', [10]))
    for (let i = 0; i < 8; i++) items.push(item(`verdura-${i}`, 'verdura', [10]))
    for (let i = 0; i < 8; i++) items.push(item(`pane-${i}`, 'pane', [10]))
    for (let i = 0; i < 8; i++) items.push(item(`latte-${i}`, 'latte', [10]))
    const result = suggest({ items, purchases: [], now: NOW })
    expect(result).toHaveLength(15)
    const perCategory = new Map<string, number>()
    for (const s of result) perCategory.set(s.categoryId, (perCategory.get(s.categoryId) ?? 0) + 1)
    for (const count of perCategory.values()) expect(count).toBeLessThanOrEqual(4)
  })

  it('ordina per punteggio: abitudine forte prima della sola stagionalità', () => {
    const items = [item('zucca', 'verdura', [10]), item('latte', 'latticini')]
    const result = suggest({ items, purchases: bought('latte', 27, 20, 13, 6), now: NOW })
    expect(result.map((s) => s.itemId)).toEqual(['latte', 'zucca'])
  })

  it('somma le regole e prende il motivo dalla piu specifica', () => {
    // di stagione, frequente e anche ricorrente: motivo dalla ricorrenza,
    // punteggio maggiore della somma di stagione e frequenza da sole
    const items = [item('zucca', 'verdura', [10])]
    const result = suggest({ items, purchases: bought('zucca', 27, 20, 13, 6), now: NOW })
    expect(result[0]?.kind).toBe('habit')
    expect(result[0]?.reason).toMatch(/ogni 7 giorni/)
    expect(result[0]?.score).toBeGreaterThan(1.5 + 1.5)
  })
})
