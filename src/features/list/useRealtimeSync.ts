import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useHousehold, householdQueryKey } from '@/features/auth/useHousehold'
import { itemsQueryKey } from '@/features/catalog/useCatalog'
import { supabase } from '@/lib/supabase'
import type { ListEntry } from '@/types/domain'
import { listQueryKey } from './useList'

/**
 * Sincronizzazione istantanea tra i due telefoni via Supabase Realtime:
 * - list_entries: la cache viene aggiornata riga per riga (senza refetch)
 * - items, household_members e households: si invalida la query (cambiano di rado)
 * Al (ri)collegamento del canale la lista viene ricaricata, per recuperare
 * eventuali eventi persi mentre si era offline.
 */
export function useRealtimeSync() {
  const { household, userId } = useHousehold()
  const queryClient = useQueryClient()

  useEffect(() => {
    const householdId = household.id
    const listKey = listQueryKey(householdId)
    let purchasesTimer: number | null = null

    const invalidateHistory = () => {
      // un DELETE può essere una spesa completata dal partner: storico e analitiche cambiano
      if (purchasesTimer !== null) window.clearTimeout(purchasesTimer)
      purchasesTimer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['purchases', householdId] })
        void queryClient.invalidateQueries({ queryKey: ['analytics', householdId] })
      }, 1500)
    }

    const channel = supabase
      .channel(`household:${householdId}`)
      .on<ListEntry>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_entries',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          queryClient.setQueryData<ListEntry[]>(listKey, (rows) => {
            if (!rows) return rows
            switch (payload.eventType) {
              case 'INSERT': {
                const row = payload.new
                return rows.some((r) => r.id === row.id)
                  ? rows.map((r) => (r.id === row.id ? row : r))
                  : [...rows, row]
              }
              case 'UPDATE':
                return rows.map((r) => (r.id === payload.new.id ? payload.new : r))
              case 'DELETE': {
                const id = payload.old.id
                return id ? rows.filter((r) => r.id !== id) : rows
              }
              default:
                return rows
            }
          })
          if (payload.eventType === 'DELETE') invalidateHistory()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${householdId}` },
        () => void queryClient.invalidateQueries({ queryKey: itemsQueryKey(householdId) }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: householdQueryKey(userId) }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        () => void queryClient.invalidateQueries({ queryKey: householdQueryKey(userId) }),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey: listKey })
        }
      })

    return () => {
      if (purchasesTimer !== null) window.clearTimeout(purchasesTimer)
      void supabase.removeChannel(channel)
    }
  }, [household.id, userId, queryClient])
}
