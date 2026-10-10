import { useMutation, useQueryClient } from '@tanstack/react-query'
import { householdQueryKey, useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'

const collator = new Intl.Collator('it', { sensitivity: 'base' })

function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 40)
}

/** Supermercati della casa: aggiunta, rinomina ed eliminazione condivise tra i membri */
export function useStores() {
  const { household, userId } = useHousehold()
  const queryClient = useQueryClient()
  const stores = household.stores
  const invalidate = () => queryClient.invalidateQueries({ queryKey: householdQueryKey(userId) })

  const addStore = useMutation({
    mutationFn: async (rawName: string): Promise<string> => {
      const name = cleanName(rawName)
      if (!name) throw new Error('Scrivi il nome del supermercato')
      const existing = stores.find((s) => collator.compare(s, name) === 0)
      if (existing) return existing
      const { error } = await supabase
        .from('households')
        .update({ stores: [...stores, name] })
        .eq('id', household.id)
      if (error) throw error
      return name
    },
    onSuccess: invalidate,
  })

  /** Rinomina un supermercato (anche negli articoli in lista) */
  const renameStore = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }): Promise<string> => {
      const name = cleanName(to)
      if (!name) throw new Error('Scrivi il nome del supermercato')
      if (name === from) return from
      const { error } = await supabase.rpc('rename_store', {
        p_household_id: household.id,
        p_old: from,
        p_new: name,
      })
      if (error) throw error
      return name
    },
    onSuccess: invalidate,
  })

  /** Toglie un supermercato dalla lista; gli articoli tornano "ovunque" */
  const removeStore = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.rpc('rename_store', {
        p_household_id: household.id,
        p_old: name,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { stores, addStore, renameStore, removeStore }
}
