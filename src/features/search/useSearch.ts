import { useMemo } from 'react'
import type { Item } from '@/types/domain'
import { fuzzySearch, hasExactMatch, normalize } from './fuzzy'

export interface SearchState {
  /** Query normalizzata (vuota = nessuna ricerca attiva) */
  query: string
  results: Item[]
  /** True se nessun prodotto ha esattamente quel nome: si offre "Crea" */
  canCreate: boolean
}

const MAX_RESULTS = 30

/** Ricerca fuzzy sui prodotti in cache, ricalcolata mentre si digita */
export function useSearch(rawQuery: string, items: readonly Item[]): SearchState {
  return useMemo(() => {
    const query = normalize(rawQuery)
    if (!query) return { query, results: [], canCreate: false }
    const results = fuzzySearch(rawQuery, items, (i) => i.name, MAX_RESULTS).map((r) => r.item)
    return {
      query,
      results,
      canCreate: rawQuery.trim().length >= 2 && !hasExactMatch(rawQuery, items, (i) => i.name),
    }
  }, [rawQuery, items])
}
