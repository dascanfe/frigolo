import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { listsQueryKey, profileQueryKey } from '@/features/lists/useLists'
import type { ListData } from '@/features/lists/useLists'
import { it as t } from '@/i18n/it'
import { itemsQueryKey } from '@/features/catalog/useCatalog'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import type { HouseholdMember, ListEntry } from '@/types/domain'
import { listQueryKey } from './useList'

/**
 * Sincronizzazione istantanea tra i telefoni via Supabase Realtime, per la
 * lista aperta (il canale cambia quando si cambia lista):
 * - list_entries: la cache viene aggiornata riga per riga (senza refetch)
 * - items, household_members e households: si invalida la query (cambiano di rado)
 * - profiles: nome, foto o colore cambiati da qualcuno (la RLS manda solo i
 *   profili di chi condivide una lista con te)
 * - household_members dell'utente: entrato o uscito da una lista da un altro telefono
 * Al (ri)collegamento del canale la lista viene ricaricata, per recuperare
 * eventuali eventi persi mentre si era offline.
 */
export function useRealtimeSync() {
  const { household, userId } = useHousehold()
  const queryClient = useQueryClient()

  useEffect(() => {
    const householdId = household.id
    const listKey = listQueryKey(householdId)
    const invalidateLists = () =>
      void queryClient.invalidateQueries({ queryKey: listsQueryKey(userId) })
    let purchasesTimer: number | null = null

    const invalidateHistory = () => {
      // un DELETE può essere una spesa finita da un'altra persona: storico e analitiche cambiano
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
        (payload: { eventType: string; new: Partial<HouseholdMember> }) => {
          const joined = payload.eventType === 'INSERT' ? payload.new.user_id : undefined
          if (!joined || joined === userId) {
            invalidateLists()
            return
          }
          // qualcuno è appena entrato con un invito: lo si dice a chi c'era già
          void queryClient.invalidateQueries({ queryKey: listsQueryKey(userId) }).then(() => {
            const lists = queryClient.getQueryData<ListData[]>(listsQueryKey(userId))
            const list = lists?.find((l) => l.household.id === householdId)
            const person = list?.members.find((m) => m.user_id === joined)
            if (list && person) {
              toast(t.join.memberJoined(memberName(person), list.household.name), 'success')
            }
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        invalidateLists,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `user_id=eq.${userId}`,
        },
        invalidateLists,
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        invalidateLists()
        void queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) })
      })
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
