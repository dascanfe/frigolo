import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/types/domain'

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

export interface Catalog {
  categories: Category[]
  items: Item[]
  categoryById: Map<string, Category>
  categoryBySlug: Map<string, Category>
  itemById: Map<string, Item>
  /** Prodotti per categoria, già ordinati per nome */
  itemsByCategory: Map<string, Item[]>
  isPending: boolean
  error: Error | null
}

/** Categorie e prodotti con gli indici utili a lista, catalogo e ricerca */
export function useCatalog(): Catalog {
  const { household } = useHousehold()
  const categories = useCategoriesQuery()
  const items = useItemsQuery(household.id)

  return useMemo(() => {
    const categoryList = categories.data ?? []
    const itemList = items.data ?? []
    const itemsByCategory = new Map<string, Item[]>()
    for (const item of itemList) {
      const bucket = itemsByCategory.get(item.category_id)
      if (bucket) bucket.push(item)
      else itemsByCategory.set(item.category_id, [item])
    }
    return {
      categories: categoryList,
      items: itemList,
      categoryById: new Map(categoryList.map((c) => [c.id, c])),
      categoryBySlug: new Map(categoryList.map((c) => [c.slug, c])),
      itemById: new Map(itemList.map((i) => [i.id, i])),
      itemsByCategory,
      isPending: categories.isPending || items.isPending,
      error: categories.error ?? items.error ?? null,
    }
  }, [
    categories.data,
    items.data,
    categories.isPending,
    items.isPending,
    categories.error,
    items.error,
  ])
}
