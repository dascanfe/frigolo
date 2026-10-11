import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHousehold } from '@/features/auth/useHousehold'
import { purchasesQueryKey } from '@/features/suggestions/useSuggestions'
import { supabase } from '@/lib/supabase'

/**
 * Correzioni dello storico: togliere un prodotto comprato per sbaglio da una
 * spesa, o eliminare una spesa intera (gli acquisti vanno via in cascata).
 * Una spesa rimasta senza prodotti viene eliminata.
 */
export function useTripEdits() {
  const { household } = useHousehold()
  const queryClient = useQueryClient()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['analytics', household.id] }),
      queryClient.invalidateQueries({ queryKey: purchasesQueryKey(household.id) }),
    ])

  const removePurchase = useMutation({
    mutationFn: async ({
      purchaseId,
      tripId,
      last,
    }: {
      purchaseId: string
      tripId: string
      last: boolean
    }) => {
      const { error } = last
        ? await supabase.from('shopping_trips').delete().eq('id', tripId)
        : await supabase.from('purchases').delete().eq('id', purchaseId)
      if (error) throw error
    },
    onSettled: refresh,
  })

  const removeTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase.from('shopping_trips').delete().eq('id', tripId)
      if (error) throw error
    },
    onSettled: refresh,
  })

  return { removePurchase, removeTrip }
}
