import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHousehold } from '@/features/auth/useHousehold'
import { itemsQueryKey } from '@/features/catalog/useCatalog'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/types/domain'

export function useSettingsMutations() {
  const { household } = useHousehold()
  const queryClient = useQueryClient()
  // ['items', hid] e ['items', hid, 'custom-all'] condividono il prefisso
  const invalidateItems = () =>
    queryClient.invalidateQueries({ queryKey: itemsQueryKey(household.id) })

  const updateItem = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Item> & { id: string }) => {
      const { error } = await supabase.from('items').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateItems,
  })

  return { updateItem }
}
