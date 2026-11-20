import { describe, expect, it } from 'vitest'
import {
  RECEIPT_QR_URL,
  buildReceipt,
  receiptAltText,
  receiptFileName,
  receiptRange,
  receiptShareText,
} from './receiptModel'
import type { ReceiptInput, ReceiptPurchase, ReceiptTrip } from './receiptModel'

const NOW = new Date(2026, 10, 19, 12) // giovedì 19 novembre 2026
const GIULIA = 'u-giulia'
const LELE = 'u-lele'

function p(item: string, by: string | null = GIULIA): ReceiptPurchase {
  return { item_id: item.toLowerCase(), name: item, added_by: by }
}

function trip(day: number, purchases: ReceiptPurchase[], month = 10): ReceiptTrip {
  return { completed_at: new Date(2026, month, day, 18).toISOString(), purchases }
}

const SEASONS: Record<string, number[]> = {
  cachi: [10, 11, 12],
  fragole: [4, 5, 6],
  latte: [],
}

function input(overrides: Partial<ReceiptInput> = {}): ReceiptInput {
  return {
    listName: 'Casa',
    range: receiptRange('mese', NOW),
    trips: [],
    people: [
      { user_id: GIULIA, name: 'Giulia' },
      { user_id: LELE, name: 'Lele' },
    ],
    seasonMonths: (id) => SEASONS[id],
    showNames: true,
    ...overrides,
  }
}

describe('receiptRange', () => {
  it('questo mese va dal primo del mese al primo del mese dopo', () => {
    const r = receiptRange('mese', NOW)
    expect(r.from).toEqual(new Date(2026, 10, 1))
    expect(r.to).toEqual(new Date(2026, 11, 1))
    expect(r.stamp).toBe('NOVEMBRE 2026')
    expect(r.short).toBe('Novembre')
    expect(r.kind).toBe('mese')
  })

  it('il mese scorso di gennaio è dicembre dell anno prima', () => {
    const r = receiptRange('mese-scorso', new Date(2027, 0, 10))
    expect(r.from).toEqual(new Date(2026, 11, 1))
    expect(r.to).toEqual(new Date(2027, 0, 1))
    expect(r.stamp).toBe('DICEMBRE 2026')
  })

  it("l'anno in corso è tutto il 2026", () => {
    const r = receiptRange('anno', NOW)
    expect(r.from).toEqual(new Date(2026, 0, 1))
    expect(r.to).toEqual(new Date(2027, 0, 1))
    expect(r.stamp).toBe('2026')
    expect(r.short).toBe('Tutto il 2026')
    expect(r.kind).toBe('anno')
  })
})

describe('buildReceipt', () => {
  const trips = [
    trip(3, [p('Latte'), p('Pane', LELE), p('Cachi')]),
    trip(10, [p('Latte'), p('Uova', LELE), p('Pane', LELE), p('Mele'), p('Cachi', LELE)]),
    trip(17, [p('Latte', LELE), p('Fragole', LELE)]),
  ]

  it('mette tutte le voci vere, nell ordine dello scontrino', () => {
    const model = buildReceipt(input({ trips }))
    expect(model.empty).toBe(false)
    expect(model.listLine).toBe('Spesa di "Casa"')
    expect(model.stamp).toBe('NOVEMBRE 2026')
    expect(model.lines).toEqual([
      { id: 'spese', label: 'Spese chiuse', value: '3' },
      { id: 'prodotti', label: 'Prodotti presi', value: '10' },
      { id: 're', label: 'Re del mese', value: 'Latte x3' },
      { id: 'persona', label: 'Chi ha messo più cose', value: 'Lele' },
      { id: 'record', label: 'Record', value: '5 prodotti, 10/11' },
      { id: 'stagione', label: 'Di stagione preso', value: 'Cachi' },
    ])
  })

  it('senza "Mostra i nomi" non scrive nessuna persona', () => {
    const model = buildReceipt(input({ trips, showNames: false }))
    expect(model.lines.map((l) => l.id)).not.toContain('persona')
    expect(receiptAltText(model)).not.toContain('Lele')
    expect(model.listLine).toBe('La nostra spesa')
    expect(receiptAltText(model)).not.toContain('Casa')
  })

  it('in una lista da sola niente "Chi ha messo più cose"', () => {
    const model = buildReceipt(input({ trips, people: [{ user_id: GIULIA, name: 'Giulia' }] }))
    expect(model.lines.map((l) => l.id)).not.toContain('persona')
  })

  it('a pari merito due nomi, di più "Pari merito"', () => {
    const two = [trip(3, [p('Latte', GIULIA), p('Pane', LELE)])]
    expect(buildReceipt(input({ trips: two })).lines.find((l) => l.id === 'persona')?.value).toBe(
      'Giulia e Lele',
    )
    const three = [trip(3, [p('Latte', GIULIA), p('Pane', LELE), p('Uova', 'u-marta')])]
    const people = [...input().people, { user_id: 'u-marta', name: 'Marta' }]
    expect(
      buildReceipt(input({ trips: three, people })).lines.find((l) => l.id === 'persona')?.value,
    ).toBe('Pari merito')
  })

  it('il re serve almeno due volte, il record almeno due spese', () => {
    const one = [trip(5, [p('Latte'), p('Pane')])]
    const ids = buildReceipt(input({ trips: one })).lines.map((l) => l.id)
    expect(ids).not.toContain('re')
    expect(ids).not.toContain('record')
  })

  it('il record a pari prodotti è la spesa più recente', () => {
    const even = [trip(3, [p('Latte'), p('Pane')]), trip(12, [p('Uova'), p('Mele')])]
    expect(buildReceipt(input({ trips: even })).lines.find((l) => l.id === 'record')?.value).toBe(
      '2 prodotti, 12/11',
    )
  })

  it('di stagione conta solo nel mese giusto, e mai i prodotti di tutto l anno', () => {
    const offSeason = [trip(3, [p('Fragole'), p('Latte')]), trip(4, [p('Latte')])]
    expect(buildReceipt(input({ trips: offSeason })).lines.map((l) => l.id)).not.toContain(
      'stagione',
    )
  })

  it('di stagione preferisce un prodotto diverso dal re', () => {
    const cachiKing = [trip(3, [p('Cachi'), p('Mele')]), trip(4, [p('Cachi')])]
    const seasons = (id: string) => (id === 'mele' || id === 'cachi' ? [11] : undefined)
    const model = buildReceipt(input({ trips: cachiKing, seasonMonths: seasons }))
    expect(model.lines.find((l) => l.id === 're')?.value).toBe('Cachi x2')
    expect(model.lines.find((l) => l.id === 'stagione')?.value).toBe('Mele')
    // se il re è l'unico di stagione, resta lui
    const onlyCachi = buildReceipt(input({ trips: cachiKing }))
    expect(onlyCachi.lines.find((l) => l.id === 'stagione')?.value).toBe('Cachi')
  })

  it("nell'anno il re si chiama Re dell'anno", () => {
    const model = buildReceipt(input({ trips, range: receiptRange('anno', NOW) }))
    expect(model.lines.find((l) => l.id === 're')?.label).toBe("Re dell'anno")
    expect(model.stamp).toBe('2026')
  })

  it('senza spese chiuse lo scontrino è ironico ma c è', () => {
    const model = buildReceipt(input())
    expect(model.empty).toBe(true)
    expect(model.lines.map((l) => l.value)).toEqual(['0', '0'])
    expect(model.note[0]).toBe('Ancora nessuna spesa chiusa questo mese.')
    const last = buildReceipt(input({ range: receiptRange('mese-scorso', NOW) }))
    expect(last.note[0]).toBe('Nessuna spesa chiusa a ottobre.')
  })

  it('ignora prodotti senza nome', () => {
    const odd = [
      trip(3, [{ item_id: 'x', name: null, added_by: null }, p('Pane')]),
      trip(4, [{ item_id: 'x', name: '  ', added_by: null }, p('Pane')]),
    ]
    expect(buildReceipt(input({ trips: odd })).lines.find((l) => l.id === 're')?.value).toBe(
      'Pane x2',
    )
  })
})

describe('testi di contorno', () => {
  it('nome del file e testo da condividere', () => {
    expect(receiptFileName(receiptRange('mese', NOW))).toBe('scontrino-frigolo-novembre-2026.png')
    expect(receiptFileName(receiptRange('anno', NOW))).toBe('scontrino-frigolo-2026.png')
    expect(receiptShareText(receiptRange('mese', NOW))).toContain('Lo scontrino di novembre')
    expect(receiptShareText(receiptRange('anno', NOW))).toContain('Lo scontrino del 2026')
    expect(receiptShareText(receiptRange('anno', NOW))).toContain(RECEIPT_QR_URL)
  })

  it('niente trattini lunghi o medi nei testi', () => {
    const model = buildReceipt(input())
    const all = [receiptAltText(model), receiptShareText(receiptRange('mese', NOW))].join(' ')
    expect(all).not.toMatch(/[\u2013\u2014]/)
  })
})
