import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHousehold } from '@/features/auth/useHousehold'
import { useCatalog } from '@/features/catalog/useCatalog'
import { useList } from '@/features/list/useList'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/types/domain'
import { suggest } from './engine'
import type { PurchaseRecord, Suggestion } from './engine'

export const purchasesQueryKey = (householdId: string) => ['purchases', householdId] as const

/** Storico leggero (solo prodotto e data), al massimo gli ultimi 5000 acquisti */
export function usePurchaseHistoryQuery(householdId: string) {
  return useQuery({
    queryKey: purchasesQueryKey(householdId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PurchaseRecord[]> => {
      const { data, error } = await supabase
        .from('purchases')
        .select('item_id, purchased_at')
        .eq('household_id', householdId)
        .order('purchased_at', { ascending: false })
        .limit(5000)
      if (error) throw error
      return data
    },
  })
}

export interface SuggestionWithItem extends Suggestion {
  item: Item
  category: Category
}

/** Suggerimenti pronti per la home: engine puro + prodotti e categorie */
export function useSuggestions(): { suggestions: SuggestionWithItem[]; isPending: boolean } {
  const { household } = useHousehold()
  const catalog = useCatalog()
  const list = useList()
  const history = usePurchaseHistoryQuery(household.id)

  // la data cambia al massimo una volta al giorno: evita ricalcoli a ogni render
  const today = new Date().toDateString()

  const suggestions = useMemo(() => {
    if (!history.data || catalog.items.length === 0) return []
    const now = new Date(today)
    now.setHours(12, 0, 0, 0)
    const result = suggest({
      items: catalog.items,
      purchases: history.data,
      now,
      excludeItemIds: new Set(list.entryByItemId.keys()),
    })
    const withItems: SuggestionWithItem[] = []
    for (const suggestion of result) {
      const item = catalog.itemById.get(suggestion.itemId)
      const category = item ? catalog.categoryById.get(item.category_id) : undefined
      if (item && category) withItems.push({ ...suggestion, item, category })
    }
    return withItems
  }, [history.data, catalog, list.entryByItemId, today])

  return { suggestions, isPending: history.isPending || catalog.isPending || list.isPending }
}
