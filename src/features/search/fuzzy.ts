/**
 * Ricerca fuzzy client-side sul catalogo: niente dipendenze, pensata per
 * poche centinaia di nomi brevi. Il punteggio combina:
 * - prefisso (del nome o di una parola): il match più forte,
 * - sottostringa: medio,
 * - distanza di Levenshtein <= 2 su una parola: tollera i refusi.
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

const SCORE_EXACT = 100
const SCORE_PREFIX = 80
const SCORE_WORD_PREFIX = 70
const SCORE_SUBSTRING = 50
const SCORE_TYPO_1 = 40
const SCORE_TYPO_2 = 25

/**
 * Punteggio di un nome rispetto alla query (entrambi normalizzati).
 * 0 = nessun match. Query di 1-2 caratteri: solo prefissi, per non
 * inondare di risultati mentre si inizia a digitare.
 */
export function scoreMatch(query: string, name: string): number {
  if (!query) return 0
  if (name === query) return SCORE_EXACT
  if (name.startsWith(query)) return SCORE_PREFIX

  const words = name.split(' ')
  if (words.some((w) => w.startsWith(query))) return SCORE_WORD_PREFIX

  if (query.length < 3) return 0
  if (name.includes(query)) return SCORE_SUBSTRING

  // refusi: confronto con ogni parola del nome (e con il nome intero se corto).
  // Un match sulla prima parola vale un po' di più: "lattee" -> "Latte fresco"
  // prima di "Cioccolato al latte".
  const maxDistance = query.length <= 4 ? 1 : 2
  let best = Infinity
  let bestAtStart = false
  const candidates = words.length > 1 ? [...words, name] : words
  candidates.forEach((candidate, index) => {
    const atStart = index === 0 || candidate === name
    let distance = levenshtein(query, candidate, maxDistance)
    // prefisso con refuso: "fragl" vs "fragole"
    if (candidate.length > query.length) {
      distance = Math.min(
        distance,
        levenshtein(query, candidate.slice(0, query.length), maxDistance),
      )
    }
    if (distance < best || (distance === best && atStart && !bestAtStart)) {
      best = distance
      bestAtStart = atStart
    }
  })
  const bonus = bestAtStart ? 5 : 0
  if (best === 1) return SCORE_TYPO_1 + bonus
  if (best === 2 && maxDistance >= 2) return SCORE_TYPO_2 + bonus
  return 0
}

/**
 * Cerca nei candidati e ritorna i migliori, ordinati per punteggio e poi per
 * nome. `getName` estrae il testo da confrontare.
 */
export function fuzzySearch<T>(
  query: string,
  candidates: readonly T[],
  getName: (item: T) => string,
  limit = 30,
): Scored<T>[] {
  const q = normalize(query)
  if (!q) return []
  const results: Scored<T>[] = []
  for (const item of candidates) {
    const score = scoreMatch(q, normalize(getName(item)))
    if (score > 0) results.push({ item, score })
  }
  results.sort((a, b) => b.score - a.score || getName(a.item).localeCompare(getName(b.item), 'it'))
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
