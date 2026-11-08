import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uniqueItemIds } from './uniqueItemIds'

/** Quante spese chiuse si guardano per "Gli ultimi acquisti" */
export const RECENT_TRIPS = 3

/**
 * Prodotti unici delle ultime 3 spese chiuse della lista, dal più recente.
 * La chiave sta sotto ['purchases', lista]: quando finisce una spesa (o ne
 * arriva una da un'altra persona) si ricarica insieme allo storico.
 */
export function useRecentTripItems(householdId: string) {
  return useQuery({
    queryKey: ['purchases', householdId, 'recent-trips'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data: trips, error: tripsError } = await supabase
        .from('shopping_trips')
        .select('id')
        .eq('household_id', householdId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(RECENT_TRIPS)
      if (tripsError) throw tripsError
      if (!trips || trips.length === 0) return []
      const { data, error } = await supabase
        .from('purchases')
        .select('item_id')
        .eq('household_id', householdId)
        .in(
          'trip_id',
          trips.map((trip) => trip.id),
        )
        .order('purchased_at', { ascending: false })
        .limit(1000)
      if (error) throw error
      return uniqueItemIds(data ?? [])
    },
  })
}
