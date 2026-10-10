import { describe, expect, it } from 'vitest'
import { buildSeries } from './trendSeries'

const NOW = new Date(2026, 8, 19, 12) // sabato 19 settembre 2026

describe('buildSeries', () => {
  it('riempie le settimane senza acquisti con zero, dal lunedi del periodo a oggi', () => {
    const rows = [
      { bucket_start: '2026-08-31', purchase_count: 3, trips: 1 },
      { bucket_start: '2026-09-14', purchase_count: 5, trips: 2 },
    ]
    const series = buildSeries(rows, 'week', new Date(2026, 7, 30), NOW)
    expect(series.map((p) => p.key)).toEqual([
      '2026-08-24',
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
    ])
    expect(series.map((p) => p.count)).toEqual([0, 3, 0, 5])
  })

  it('con periodo "sempre" parte dal primo dato', () => {
    const rows = [{ bucket_start: '2026-07-01', purchase_count: 2, trips: 1 }]
    const series = buildSeries(rows, 'month', null, NOW)
    expect(series.map((p) => p.key)).toEqual(['2026-07-01', '2026-08-01', '2026-09-01'])
    expect(series.map((p) => p.count)).toEqual([2, 0, 0])
  })

  it('senza dati e senza periodo restituisce una serie vuota', () => {
    expect(buildSeries([], 'week', null, NOW)).toEqual([])
  })
})
