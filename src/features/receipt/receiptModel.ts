/**
 * Lo scontrino di Frigolo: calcolo delle voci, separato dal disegno.
 *
 * Tutto succede sul telefono con i dati che le analitiche hanno già: spese
 * chiuse nel periodo, prodotti presi, chi li ha messi in lista. Le voci senza
 * dati veri si omettono (niente "Re del mese x1", niente record con una spesa).
 */

export type ReceiptPeriod = 'mese' | 'mese-scorso' | 'anno'

export const RECEIPT_PERIODS: readonly ReceiptPeriod[] = ['mese', 'mese-scorso', 'anno']

/** Indirizzo del codice QR: la landing, con i parametri per riconoscere chi arriva da qui */
export const RECEIPT_QR_URL =
  'https://www.dascanfe.com/sub/frigolo/?utm_source=scontrino&utm_medium=condivisione&utm_campaign=scontrino'

/** Indirizzo stampato sotto l'invito, corto da leggere */
export const RECEIPT_SITE = 'frigolo.dascanfe.com'

const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
] as const

export interface ReceiptRange {
  period: ReceiptPeriod
  /** Inizio incluso, ora locale */
  from: Date
  /** Fine esclusa, ora locale */
  to: Date
  /** "mese" o "anno": cambia qualche parola ("Re del mese", "Re dell'anno") */
  kind: 'mese' | 'anno'
  /** Per lo scontrino: "NOVEMBRE 2026" oppure "2026" */
  stamp: string
  /** Per i pulsanti: "Novembre", "Ottobre", "Tutto il 2026" */
  short: string
  /** Per i titoli e i testi: "novembre 2026", "il 2026" */
  long: string
  /** Per il nome del file: "novembre-2026", "2026" */
  slug: string
}

/** Periodo dello scontrino: mese in corso, mese scorso o anno in corso (ora locale) */
export function receiptRange(period: ReceiptPeriod, now = new Date()): ReceiptRange {
  const year = now.getFullYear()
  if (period === 'anno') {
    return {
      period,
      from: new Date(year, 0, 1),
      to: new Date(year + 1, 0, 1),
      kind: 'anno',
      stamp: String(year),
      short: `Tutto il ${year}`,
      long: `il ${year}`,
      slug: String(year),
    }
  }
  const offset = period === 'mese-scorso' ? -1 : 0
  const from = new Date(year, now.getMonth() + offset, 1)
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 1)
  const name = MESI[from.getMonth()] ?? ''
  return {
    period,
    from,
    to,
    kind: 'mese',
    stamp: `${name.toUpperCase()} ${from.getFullYear()}`,
    short: name.charAt(0).toUpperCase() + name.slice(1),
    long: `${name} ${from.getFullYear()}`,
    slug: `${name}-${from.getFullYear()}`,
  }
}

export interface ReceiptPurchase {
  item_id: string
  /** Nome del prodotto (null se non leggibile) */
  name: string | null
  /** Chi l'ha messo in lista (null = persona che ha lasciato la lista o dato vecchio) */
  added_by: string | null
}

export interface ReceiptTrip {
  completed_at: string
  purchases: readonly ReceiptPurchase[]
}

export interface ReceiptPerson {
  user_id: string
  name: string
}

export interface ReceiptInput {
  listName: string
  range: ReceiptRange
  /** Spese chiuse nel periodo */
  trips: readonly ReceiptTrip[]
  /** Persone della lista */
  people: readonly ReceiptPerson[]
  /** Mesi di stagione di un prodotto del catalogo (vuoto o assente = tutto l'anno) */
  seasonMonths: (itemId: string) => readonly number[] | undefined
  /** "Mostra i nomi": se spento, nessun nome di persona sullo scontrino */
  showNames: boolean
}

export interface ReceiptLine {
  /** Chiave stabile, utile ai test */
  id: 'spese' | 'prodotti' | 're' | 'persona' | 'record' | 'stagione'
  label: string
  value: string
}

export interface ReceiptModel {
  /** "FRIGOLO" è fisso: qui c'è la riga sotto, con il nome della lista */
  listLine: string
  stamp: string
  lines: ReceiptLine[]
  /** Periodo senza spese chiuse: lo scontrino diventa ironico */
  empty: boolean
  /** Righe di commento in fondo alle voci (solo nello scontrino vuoto) */
  note: string[]
}

const collator = new Intl.Collator('it', { sensitivity: 'base' })

function formatInt(n: number): string {
  return new Intl.NumberFormat('it-IT').format(n)
}

function dayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Il prodotto preso più volte (in più spese o più volte), a pari merito vince l'ordine alfabetico */
function topItem(trips: readonly ReceiptTrip[]): { name: string; count: number } | null {
  const counts = new Map<string, { name: string; count: number }>()
  for (const trip of trips) {
    for (const p of trip.purchases) {
      const name = p.name?.trim()
      if (!name) continue
      const entry = counts.get(p.item_id)
      if (entry) entry.count += 1
      else counts.set(p.item_id, { name, count: 1 })
    }
  }
  let best: { name: string; count: number } | null = null
  for (const entry of counts.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count && collator.compare(entry.name, best.name) < 0)
    ) {
      best = entry
    }
  }
  return best
}

/** Chi ha messo più cose in lista: nome, o due nomi a pari merito; null se non ha senso */
function topPerson(trips: readonly ReceiptTrip[], people: readonly ReceiptPerson[]): string | null {
  if (people.length < 2) return null
  const counts = new Map<string, number>()
  for (const trip of trips) {
    for (const p of trip.purchases) {
      if (p.added_by) counts.set(p.added_by, (counts.get(p.added_by) ?? 0) + 1)
    }
  }
  const ranked = people
    .map((person) => ({ name: person.name.trim(), count: counts.get(person.user_id) ?? 0 }))
    .filter((r) => r.name && r.count > 0)
    .sort((a, b) => b.count - a.count || collator.compare(a.name, b.name))
  const first = ranked[0]
  if (!first) return null
  const tied = ranked.filter((r) => r.count === first.count)
  if (tied.length === 1) return first.name
  // pari merito: due nomi si scrivono, di più diventano una festa
  if (tied.length === 2) return `${tied[0]?.name} e ${tied[1]?.name}`
  return 'Pari merito'
}

/** La spesa con più prodotti; a pari merito la più recente */
function recordTrip(trips: readonly ReceiptTrip[]): { count: number; date: Date } | null {
  let best: { count: number; date: Date } | null = null
  for (const trip of trips) {
    const date = new Date(trip.completed_at)
    if (Number.isNaN(date.getTime())) continue
    const count = trip.purchases.length
    if (!best || count > best.count || (count === best.count && date > best.date)) {
      best = { count, date }
    }
  }
  return best
}

/**
 * Un prodotto di stagione preso nel suo mese: il più preso, a pari merito
 * l'ordine alfabetico. Se è già il re, meglio un altro (se c'è): più voci diverse.
 */
function seasonalPick(
  trips: readonly ReceiptTrip[],
  seasonMonths: ReceiptInput['seasonMonths'],
  avoid: string | null,
): string | null {
  const counts = new Map<string, { name: string; count: number }>()
  for (const trip of trips) {
    const month = new Date(trip.completed_at).getMonth() + 1
    for (const p of trip.purchases) {
      const name = p.name?.trim()
      if (!name) continue
      const months = seasonMonths(p.item_id)
      if (!months || months.length === 0 || months.length >= 12 || !months.includes(month)) {
        continue
      }
      const entry = counts.get(p.item_id)
      if (entry) entry.count += 1
      else counts.set(p.item_id, { name, count: 1 })
    }
  }
  const ranked = [...counts.values()].sort(
    (a, b) => b.count - a.count || collator.compare(a.name, b.name),
  )
  return (ranked.find((r) => r.name !== avoid) ?? ranked[0])?.name ?? null
}

/** Le voci dello scontrino, solo quelle vere */
export function buildReceipt(input: ReceiptInput): ReceiptModel {
  const { range, trips } = input
  const listName = input.listName.trim()
  const base = {
    listLine: listName ? `Spesa di "${listName}"` : 'La nostra spesa',
    stamp: range.stamp,
  }
  const productCount = trips.reduce((sum, t) => sum + t.purchases.length, 0)

  if (trips.length === 0) {
    const first =
      range.period === 'mese'
        ? 'Ancora nessuna spesa chiusa questo mese.'
        : range.period === 'anno'
          ? "Ancora nessuna spesa chiusa quest'anno."
          : `Nessuna spesa chiusa a ${range.short.toLowerCase()}.`
    return {
      ...base,
      lines: [
        { id: 'spese', label: 'Spese chiuse', value: '0' },
        { id: 'prodotti', label: 'Prodotti presi', value: '0' },
      ],
      empty: true,
      note: [first, 'Il frigo aspetta fiducioso.'],
    }
  }

  const lines: ReceiptLine[] = [
    { id: 'spese', label: 'Spese chiuse', value: formatInt(trips.length) },
    { id: 'prodotti', label: 'Prodotti presi', value: formatInt(productCount) },
  ]

  const king = topItem(trips)
  const hasKing = king !== null && king.count >= 2
  if (king && hasKing) {
    lines.push({
      id: 're',
      label: range.kind === 'anno' ? "Re dell'anno" : 'Re del mese',
      value: `${king.name} x${king.count}`,
    })
  }

  if (input.showNames) {
    const person = topPerson(trips, input.people)
    if (person) lines.push({ id: 'persona', label: 'Chi ha messo più cose', value: person })
  }

  if (trips.length >= 2) {
    const record = recordTrip(trips)
    if (record && record.count >= 2) {
      lines.push({
        id: 'record',
        label: 'Record',
        value: `${formatInt(record.count)} prodotti, ${dayMonth(record.date)}`,
      })
    }
  }

  const seasonal = seasonalPick(trips, input.seasonMonths, hasKing ? (king?.name ?? null) : null)
  if (seasonal) lines.push({ id: 'stagione', label: 'Di stagione preso', value: seasonal })

  return { ...base, lines, empty: false, note: [] }
}

/** Testo alternativo dell'immagine: lo scontrino letto ad alta voce */
export function receiptAltText(model: ReceiptModel): string {
  const parts = [`Scontrino di Frigolo. ${model.listLine}, ${model.stamp.toLowerCase()}.`]
  for (const line of model.lines) parts.push(`${line.label}: ${line.value}.`)
  parts.push(...model.note)
  parts.push(`Totale app 0,00. Fai anche tu la tua lista della spesa, gratis: ${RECEIPT_SITE}, con un codice QR.`)
  return parts.join(' ')
}

/** Nome del file PNG: "scontrino-frigolo-novembre-2026.png" */
export function receiptFileName(range: ReceiptRange): string {
  return `scontrino-frigolo-${range.slug}.png`
}

/** Testo che accompagna l'immagine quando si condivide */
export function receiptShareText(range: ReceiptRange): string {
  const what = range.kind === 'anno' ? `del ${range.stamp}` : `di ${range.long.split(' ')[0]}`
  return `Lo scontrino ${what} della nostra spesa, fatto con Frigolo. Fai anche tu la tua lista della spesa, gratis: ${RECEIPT_QR_URL}`
}
