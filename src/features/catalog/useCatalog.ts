import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/types/domain'
import { indexCatalog } from './catalogIndex'
import type { Catalog } from './catalogIndex'

export type { Catalog }

export const categoriesQueryKey = ['categories'] as const
export const itemsQueryKey = (householdId: string) => ['items', householdId] as const

const collator = new Intl.Collator('it', { sensitivity: 'base' })

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKey,
    // cambiano quasi mai (ordine del percorso, nomi): basta ricontrollarle ogni ora
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order')
      if (error) throw error
      return data
    },
  })
}

/** Catalogo base + prodotti custom dell'household (la RLS filtra), non archiviati */
export function useItemsQuery(householdId: string) {
  return useQuery({
    queryKey: itemsQueryKey(householdId),
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase.from('items').select('*').eq('is_archived', false)
      if (error) throw error
      return [...data].sort((a, b) => collator.compare(a.name, b.name))
    },
  })
}

/** Categorie e prodotti con gli indici utili a lista, catalogo e ricerca */
export function useCatalog(): Catalog {
  const { household } = useHousehold()
  const categories = useCategoriesQuery()
  const items = useItemsQuery(household.id)

  return useMemo(
    () => ({
      ...indexCatalog(categories.data, items.data),
      isPending: categories.isPending || items.isPending,
      error: categories.error ?? items.error ?? null,
    }),
    [
      categories.data,
      items.data,
      categories.isPending,
      items.isPending,
      categories.error,
      items.error,
    ],
  )
}
