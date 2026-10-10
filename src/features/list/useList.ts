import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHousehold } from '@/features/auth/useHousehold'
import { useCatalog } from '@/features/catalog/useCatalog'
import { supabase } from '@/lib/supabase'
import type { ListEntry, ListEntryWithItem } from '@/types/domain'

export const listQueryKey = (householdId: string) => ['list', householdId] as const

const collator = new Intl.Collator('it', { sensitivity: 'base' })

/** Righe grezze della lista attiva dell'household */
export function useListQuery(householdId: string) {
  return useQuery({
    queryKey: listQueryKey(householdId),
    queryFn: async (): Promise<ListEntry[]> => {
      const { data, error } = await supabase
        .from('list_entries')
        .select('*')
        .eq('household_id', householdId)
      if (error) throw error
      return data
    },
  })
}

export interface ListData {
  /** Tutte le righe unite a prodotto e categoria */
  entries: ListEntryWithItem[]
  /**
   * Da comprare, in un'unica fila nell'ordine del percorso al supermercato:
   * prima per categoria (sort_order), poi per nome dentro la categoria
   */
  todo: ListEntryWithItem[]
  todoCount: number
  /** Nel carrello, per ordine di spunta (l'ultimo preso in fondo) */
  cart: ListEntryWithItem[]
  /** item_id -> riga, per sapere al volo se un prodotto è in lista */
  entryByItemId: Map<string, ListEntryWithItem>
  isPending: boolean
  error: Error | null
}

/** La lista attiva, già unita al catalogo e pronta per le sezioni della home */
export function useList(): ListData {
  const { household } = useHousehold()
  const catalog = useCatalog()
  const list = useListQuery(household.id)

  return useMemo(() => {
    const entries: ListEntryWithItem[] = []
    for (const row of list.data ?? []) {
      const item = catalog.itemById.get(row.item_id)
      const category = item ? catalog.categoryById.get(item.category_id) : undefined
      // un prodotto archiviato o non ancora in cache non si mostra
      if (item && category) entries.push({ ...row, item, category })
    }

    const todo = entries
      .filter((e) => e.status === 'todo')
      .sort(
        (a, b) =>
          a.category.sort_order - b.category.sort_order ||
          collator.compare(a.item.name, b.item.name),
      )

    const cart = entries
      .filter((e) => e.status === 'cart')
      .sort((a, b) => (a.checked_at ?? '').localeCompare(b.checked_at ?? ''))

    return {
      entries,
      todo,
      todoCount: todo.length,
      cart,
      entryByItemId: new Map(entries.map((e) => [e.item_id, e])),
      isPending: list.isPending || catalog.isPending,
      error: list.error ?? catalog.error,
    }
  }, [list.data, list.isPending, list.error, catalog])
}
