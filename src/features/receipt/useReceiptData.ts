import { useQuery } from '@tanstack/react-query'
import { useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'
import type { ReceiptRange, ReceiptTrip } from './receiptModel'

/**
 * Le spese chiuse del periodo con i prodotti e chi li ha messi in lista: la
 * stessa lettura della card "Le spese" delle analitiche, con l'inizio e la fine
 * del periodo. Sta sotto la chiave delle analitiche, così si aggiorna con loro.
 */
export function useReceiptTrips(range: ReceiptRange) {
  const { household } = useHousehold()
  return useQuery({
    queryKey: [
      'analytics',
      household.id,
      'receipt',
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    staleTime: 60_000,
    queryFn: async (): Promise<ReceiptTrip[]> => {
      const { data, error } = await supabase
        .from('shopping_trips')
        .select('completed_at, purchases(item_id, added_by, items(name))')
        .eq('household_id', household.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', range.from.toISOString())
        .lt('completed_at', range.to.toISOString())
        .order('completed_at', { ascending: true })
        .limit(1000)
      if (error) throw error
      return data.flatMap((trip) =>
        trip.completed_at && trip.purchases.length > 0
          ? [
              {
                completed_at: trip.completed_at,
                purchases: trip.purchases.map((p) => ({
                  item_id: p.item_id,
                  added_by: p.added_by,
                  name: p.items?.name ?? null,
                })),
              },
            ]
          : [],
      )
    },
  })
}
