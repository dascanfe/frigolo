/**
 * Ricerca fuzzy client-side sul catalogo: niente dipendenze, pensata per
 * poche centinaia di nomi brevi. Il punteggio combina:
 * - prefisso (del nome o di una parola): il match più forte,
 * - sottostringa dentro una parola: medio (da 3 caratteri),
 * - distanza di Levenshtein limitata alla lunghezza della query: tollera i
 *   refusi, ma solo se i risultati esatti sono pochi.
 */

/** Minuscolo, senza accenti e apostrofi, spazi normalizzati */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Distanza di Levenshtein con uscita anticipata oltre `max` */
export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  let current = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    current[0] = i
    let rowMin = current[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
      current[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    ;[previous, current] = [current, previous]
  }
  return previous[b.length] ?? max + 1
}

export interface Scored<T> {
  item: T
  score: number
}

/** Sotto questa lunghezza la sottostringa fa solo rumore ("lat" in "gelato") */
const SUBSTRING_MIN = 4

const SCORE_EXACT = 100
const SCORE_PREFIX = 80
const SCORE_WORD_PREFIX = 70
const SCORE_SUBSTRING = 50
const SCORE_TYPO_1 = 40
const SCORE_TYPO_2 = 25

/**
 * Punteggio di un nome rispetto alla query (entrambi normalizzati).
 * 0 = nessun match. Scala: esatto, nome che inizia con la query, parola che
 * inizia con la query, sottostringa dentro una parola (solo da 4 caratteri).
 * Le corrispondenze approssimate non sono qui: le aggiunge `fuzzySearch` solo
 * quando i risultati esatti sono pochi (vedi `scoreTypo`).
 */
export function scoreMatch(query: string, name: string): number {
  if (!query) return 0
  if (name === query) return SCORE_EXACT
  if (name.startsWith(query)) return SCORE_PREFIX

  const words = name.split(' ')
  if (words.some((w) => w.startsWith(query))) return SCORE_WORD_PREFIX

  if (query.length < SUBSTRING_MIN) return 0
  if (name.includes(query)) return SCORE_SUBSTRING
  return 0
}

/**
 * Tolleranza ai refusi, limitata alla lunghezza della query: sotto i 5
 * caratteri niente (troppo rumore), 5-6 un errore, da 7 in su due.
 */
export function maxTypos(queryLength: number): number {
  if (queryLength < 5) return 0
  return queryLength <= 6 ? 1 : 2
}

/**
 * Punteggio per refusi: confronta la query con ogni parola del nome (e con il
 * nome intero) e con l'inizio delle parole più lunghe ("fragl" vs "fragole").
 * Un match sulla prima parola vale un po' di più: "lattee" -> "Latte fresco"
 * prima di "Cioccolato al latte". Rimane sempre sotto lo score sottostringa.
 */
export function scoreTypo(query: string, name: string): number {
  const allowed = maxTypos(query.length)
  if (allowed === 0) return 0
  const words = name.split(' ')
  let best = Infinity
  let bestAtStart = false
  const candidates = words.length > 1 ? [...words, name] : words
  candidates.forEach((candidate, index) => {
    const atStart = index === 0 || candidate === name
    let distance = levenshtein(query, candidate, allowed)
    if (candidate.length > query.length) {
      distance = Math.min(distance, levenshtein(query, candidate.slice(0, query.length), allowed))
    }
    if (distance < best || (distance === best && atStart && !bestAtStart)) {
      best = distance
      bestAtStart = atStart
    }
  })
  if (best === 0 || best > allowed) return 0
  const bonus = bestAtStart ? 5 : 0
  return (best === 1 ? SCORE_TYPO_1 : SCORE_TYPO_2) + bonus
}

/** Sotto questo numero di risultati esatti si aggiungono quelli approssimati */
const FEW_RESULTS = 5

export interface SearchOptions<T> {
  limit?: number
  /** Quante volte è stato comprato: a pari punteggio vince il più comprato */
  getFrequency?: (item: T) => number
}

/**
 * Cerca nei candidati e ritorna i migliori. Ordine: punteggio, poi frequenza
 * d'acquisto, poi alfabetico. Le corrispondenze approssimate (refusi) entrano
 * solo se quelle esatte sono meno di FEW_RESULTS e vanno sempre in coda.
 */
export function fuzzySearch<T>(
  query: string,
  candidates: readonly T[],
  getName: (item: T) => string,
  options: number | SearchOptions<T> = {},
): Scored<T>[] {
  const { limit = 30, getFrequency } = typeof options === 'number' ? { limit: options } : options
  const q = normalize(query)
  if (!q) return []
  const prepared = candidates.map((item) => ({ item, name: normalize(getName(item)) }))
  const compare = (a: Scored<T>, b: Scored<T>) =>
    b.score - a.score ||
    (getFrequency ? getFrequency(b.item) - getFrequency(a.item) : 0) ||
    getName(a.item).localeCompare(getName(b.item), 'it')

  const results: Scored<T>[] = []
  for (const { item, name } of prepared) {
    const score = scoreMatch(q, name)
    if (score > 0) results.push({ item, score })
  }
  if (results.length < FEW_RESULTS) {
    const typos: Scored<T>[] = []
    for (const { item, name } of prepared) {
      if (results.some((r) => r.item === item)) continue
      const score = scoreTypo(q, name)
      if (score > 0) typos.push({ item, score })
    }
    results.sort(compare)
    typos.sort(compare)
    return [...results, ...typos].slice(0, limit)
  }
  results.sort(compare)
  return results.slice(0, limit)
}

/** True se tra i candidati ce n'è uno con lo stesso nome normalizzato */
export function hasExactMatch<T>(
  query: string,
  candidates: readonly T[],
  getName: (item: T) => string,
): boolean {
  const q = normalize(query)
  if (!q) return false
  return candidates.some((item) => normalize(getName(item)) === q)
}
