import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHousehold } from '@/features/auth/useHousehold'
import { haptics } from '@/lib/haptics'
import { LIST_MUTATION_KEY } from '@/lib/offlineQueue'
import type { ListMutationVariables } from '@/lib/offlineQueue'
import { supabase } from '@/lib/supabase'
import type { Item, ListEntry, ListEntryStatus } from '@/types/domain'
import { listQueryKey } from './useList'

interface AddOptions {
  quantity?: number
  unit?: string | null
  note?: string | null
  store?: string | null
}

interface EntryPatch {
  quantity?: number
  unit?: string | null
  note?: string | null
  store?: string | null
}

interface MutationContext {
  previous: ListEntry[]
}

/** Come cambia la cache della lista per ogni tipo di modifica */
function applyChange(rows: ListEntry[], variables: ListMutationVariables): ListEntry[] {
  switch (variables.type) {
    case 'insert':
      return [...rows.filter((r) => r.item_id !== variables.row.item_id), variables.row]
    case 'remove':
      return rows.filter((r) => r.id !== variables.entryId)
    case 'patch':
      return rows.map((r) => (r.id === variables.entryId ? { ...r, ...variables.changes } : r))
    case 'clear':
      return []
  }
}

/**
 * Tutte le mutation sulla lista, con optimistic update e rollback.
 * La cache di ['list', householdId] viene aggiornata subito; se la richiesta
 * fallisce si ripristina lo snapshot. L'invalidazione finale parte solo quando
 * non ci sono altre mutation in volo, così tap rapidi in sequenza non si
 * sovrascrivono a vicenda con un refetch intermedio.
 *
 * La mutationFn vive in lib/offlineQueue (default globale della chiave), così
 * le modifiche fatte offline vengono riprese anche dopo aver chiuso l'app.
 */
export function useListMutations() {
  const { household, userId } = useHousehold()
  const queryClient = useQueryClient()
  const queryKey = listQueryKey(household.id)

  const mutation = useMutation<void, Error, ListMutationVariables, MutationContext>({
    mutationKey: LIST_MUTATION_KEY,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ListEntry[]>(queryKey) ?? []
      queryClient.setQueryData<ListEntry[]>(queryKey, applyChange(previous, variables))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: LIST_MUTATION_KEY }) <= 1) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  const householdId = household.id

  return {
    /** Aggiunge un prodotto alla lista (stato "da comprare") */
    add(item: Item, options: AddOptions = {}) {
      haptics.tap()
      const row: ListEntry = {
        id: crypto.randomUUID(),
        household_id: householdId,
        item_id: item.id,
        quantity: options.quantity ?? 1,
        unit: options.unit ?? item.default_unit,
        note: options.note?.trim() || null,
        store: options.store ?? null,
        status: 'todo',
        added_by: userId,
        added_at: new Date().toISOString(),
        checked_at: null,
      }
      mutation.mutate({ type: 'insert', householdId, row })
    },
    /** Toglie una riga dalla lista */
    remove(entryId: string) {
      haptics.tap()
      mutation.mutate({ type: 'remove', householdId, entryId })
    },
    /** Da comprare <-> nel carrello */
    setStatus(entryId: string, status: ListEntryStatus) {
      haptics.tap()
      mutation.mutate({
        type: 'patch',
        householdId,
        entryId,
        changes: { status, checked_at: status === 'cart' ? new Date().toISOString() : null },
      })
    },
    /** Quantità, unità, nota */
    update(entryId: string, changes: EntryPatch) {
      mutation.mutate({
        type: 'patch',
        householdId,
        entryId,
        changes: {
          ...changes,
          note: changes.note === undefined ? undefined : changes.note?.trim() || null,
        },
      })
    },
    /** Svuota tutta la lista */
    clear() {
      mutation.mutate({ type: 'clear', householdId })
    },
    lastError: mutation.error,
  }
}

/** Completa la spesa: carrello -> storico, via RPC */
export function useCompleteTrip() {
  const { household } = useHousehold()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (store: string | null) => {
      const { data, error } = await supabase.rpc('complete_shopping_trip', {
        p_household_id: household.id,
        p_store: store ?? undefined,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      haptics.success()
      void queryClient.invalidateQueries({ queryKey: listQueryKey(household.id) })
      void queryClient.invalidateQueries({ queryKey: ['purchases', household.id] })
      void queryClient.invalidateQueries({ queryKey: ['analytics', household.id] })
    },
  })
}
