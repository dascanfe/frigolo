/**
 * Motore dei suggerimenti: funzione pura, nessun accesso a rete o DOM.
 * Riceve catalogo, storico acquisti e data corrente; restituisce al massimo
 * `limit` prodotti con punteggio e motivazione leggibile.
 *
 * Regole (i pesi sono quelli della specifica):
 * - stagionalità (1.0): season_months include il mese corrente; bonus se
 *   il prodotto è già stato comprato almeno una volta
 * - ricorrenza (1.5): con almeno 2 acquisti, se sono passati >= 80% dei
 *   giorni dell'intervallo medio; il punteggio cresce col rapporto
 * - frequenza recente (1.0): almeno 2 acquisti negli ultimi 60 giorni
 *
 * Esclusioni: prodotti già in lista o nel carrello, archiviati, e prodotti
 * comprati troppo di recente rispetto al loro ritmo (cooldown).
 * Diversificazione: al massimo `maxPerCategory` per categoria.
 */

export interface SuggestionItem {
  id: string
  category_id: string
  season_months: number[]
  is_archived: boolean
}

export interface PurchaseRecord {
  item_id: string
  /** ISO string o Date */
  purchased_at: string | Date
}

export type SuggestionKind = 'season' | 'habit'

export interface Suggestion {
  itemId: string
  categoryId: string
  score: number
  /** Badge sulla tile: Leaf per stagione, Sparkles per abitudine */
  kind: SuggestionKind
  /** Motivo leggibile mostrato nel bottom sheet */
  reason: string
}

export interface SuggestionInput {
  items: readonly SuggestionItem[]
  purchases: readonly PurchaseRecord[]
  now: Date
  /** Prodotti da non suggerire: in lista o nel carrello */
  excludeItemIds?: ReadonlySet<string>
  limit?: number
  maxPerCategory?: number
}

const WEIGHT_SEASON = 1.0
const WEIGHT_RECURRENCE = 1.5
const WEIGHT_FREQUENCY = 1.0
const SEASON_PURCHASED_BONUS = 0.5
const RECURRENCE_MIN_PURCHASES = 2
const RECURRENCE_READY_RATIO = 0.8
const RECURRENCE_MAX_RATIO = 2.0
const FREQUENCY_WINDOW_DAYS = 60
const FREQUENCY_MONTH_DAYS = 30
const FREQUENCY_MIN_PURCHASES = 2
const FREQUENCY_MAX_MULTIPLIER = 1.5
/** Senza intervallo noto, un prodotto comprato da meno di questi giorni non si suggerisce */
const DEFAULT_COOLDOWN_DAYS = 7

const DAY_MS = 86_400_000

export const MONTH_NAMES = [
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

interface ItemStats {
  count: number
  /** Giorni dall'ultimo acquisto */
  daysSinceLast: number
  /** Media dei giorni tra acquisti consecutivi (undefined con < 2 acquisti) */
  meanIntervalDays: number | undefined
  count30: number
  count60: number
}

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/** Statistiche per prodotto: acquisti nello stesso giorno contano una volta sola */
export function computeStats(
  purchases: readonly PurchaseRecord[],
  now: Date,
): Map<string, ItemStats> {
  const nowMs = now.getTime()
  const daysByItem = new Map<string, Set<number>>()
  for (const purchase of purchases) {
    const time = toTime(purchase.purchased_at)
    if (!Number.isFinite(time) || time > nowMs) continue
    const day = Math.floor(time / DAY_MS)
    const days = daysByItem.get(purchase.item_id)
    if (days) days.add(day)
    else daysByItem.set(purchase.item_id, new Set([day]))
  }

  const stats = new Map<string, ItemStats>()
  const today = Math.floor(nowMs / DAY_MS)
  for (const [itemId, daySet] of daysByItem) {
    const days = [...daySet].sort((a, b) => a - b)
    const last = days[days.length - 1] ?? today
    let meanIntervalDays: number | undefined
    if (days.length >= 2) {
      let total = 0
      for (let i = 1; i < days.length; i++) total += (days[i] ?? 0) - (days[i - 1] ?? 0)
      meanIntervalDays = total / (days.length - 1)
    }
    stats.set(itemId, {
      count: days.length,
      daysSinceLast: today - last,
      meanIntervalDays,
      count30: days.filter((d) => today - d <= FREQUENCY_MONTH_DAYS).length,
      count60: days.filter((d) => today - d <= FREQUENCY_WINDOW_DAYS).length,
    })
  }
  return stats
}

interface RuleScore {
  /* score contribuisce al totale; kind e reason solo se la regola è la primaria */
  score: number
  kind: SuggestionKind
  reason: string
}

function seasonRule(
  item: SuggestionItem,
  stats: ItemStats | undefined,
  now: Date,
): RuleScore | null {
  const month = now.getMonth() + 1
  if (!item.season_months.includes(month)) return null
  const bonus = stats && stats.count > 0 ? SEASON_PURCHASED_BONUS : 0
  return {
    score: WEIGHT_SEASON + bonus,
    kind: 'season',
    reason: `Di stagione a ${MONTH_NAMES[month - 1]}`,
  }
}

function recurrenceRule(stats: ItemStats | undefined): RuleScore | null {
  if (!stats || stats.count < RECURRENCE_MIN_PURCHASES || !stats.meanIntervalDays) return null
  const ratio = stats.daysSinceLast / stats.meanIntervalDays
  if (ratio < RECURRENCE_READY_RATIO) return null
  const every = Math.max(1, Math.round(stats.meanIntervalDays))
  return {
    score: WEIGHT_RECURRENCE * Math.min(ratio, RECURRENCE_MAX_RATIO),
    kind: 'habit',
    reason: every === 1 ? 'Di solito ogni giorno' : `Di solito ogni ${every} giorni`,
  }
}

function frequencyRule(stats: ItemStats | undefined): RuleScore | null {
  if (!stats || stats.count60 < FREQUENCY_MIN_PURCHASES) return null
  const useMonth = stats.count30 >= FREQUENCY_MIN_PURCHASES
  const count = useMonth ? stats.count30 : stats.count60
  return {
    score:
      WEIGHT_FREQUENCY *
      Math.min(stats.count60 / FREQUENCY_MIN_PURCHASES, FREQUENCY_MAX_MULTIPLIER),
    kind: 'habit',
    reason: useMonth
      ? `Comprato ${count} volte questo mese`
      : `Comprato ${count} volte negli ultimi 2 mesi`,
  }
}

/** Comprato troppo di recente rispetto al proprio ritmo: non ha senso riproporlo */
function inCooldown(stats: ItemStats | undefined): boolean {
  if (!stats) return false
  const cooldown = stats.meanIntervalDays ? stats.meanIntervalDays * 0.5 : DEFAULT_COOLDOWN_DAYS
  return stats.daysSinceLast < cooldown
}

export function suggest({
  items,
  purchases,
  now,
  excludeItemIds = new Set(),
  limit = 15,
  maxPerCategory = 4,
}: SuggestionInput): Suggestion[] {
  const statsByItem = computeStats(purchases, now)
  const candidates: Suggestion[] = []

  for (const item of items) {
    if (item.is_archived || excludeItemIds.has(item.id)) continue
    const stats = statsByItem.get(item.id)
    if (inCooldown(stats)) continue

    // il punteggio somma tutte le regole; badge e motivo vengono dalla più
    // specifica che ha risposto: ricorrenza > frequenza > stagionalità
    const rules = [
      recurrenceRule(stats),
      frequencyRule(stats),
      seasonRule(item, stats, now),
    ].filter((r): r is RuleScore => r !== null)
    const primary = rules[0]
    if (!primary) continue

    candidates.push({
      itemId: item.id,
      categoryId: item.category_id,
      score: rules.reduce((sum, r) => sum + r.score, 0),
      kind: primary.kind,
      reason: primary.reason,
    })
  }

  // a parità di punteggio: più acquisti prima, poi l'ordine del catalogo
  // (che arriva già alfabetico), così il risultato è stabile e leggibile
  const orderByItem = new Map(items.map((item, index) => [item.id, index]))
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const countA = statsByItem.get(a.itemId)?.count ?? 0
    const countB = statsByItem.get(b.itemId)?.count ?? 0
    if (countB !== countA) return countB - countA
    return (orderByItem.get(a.itemId) ?? 0) - (orderByItem.get(b.itemId) ?? 0)
  })

  const perCategory = new Map<string, number>()
  const result: Suggestion[] = []
  for (const candidate of candidates) {
    if (result.length >= limit) break
    const used = perCategory.get(candidate.categoryId) ?? 0
    if (used >= maxPerCategory) continue
    perCategory.set(candidate.categoryId, used + 1)
    result.push(candidate)
  }
  return result
}
