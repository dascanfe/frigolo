/**
 * Coda offline per le modifiche alla lista.
 *
 * Con networkMode "online" TanStack Query mette in pausa le mutation quando il
 * dispositivo è offline: l'optimistic update resta visibile e la richiesta
 * parte al ritorno della rete. Perché sopravvivano anche a una chiusura
 * dell'app, la cache (mutation in pausa comprese) viene persistita su
 * IndexedDB e alla riapertura le mutation vengono riprese: serve quindi una
 * mutationFn registrata a livello globale, che sappia eseguire ogni tipo di
 * modifica a partire dalle sole variabili serializzate.
 */
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { onlineManager, useIsMutating } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'
import { useSyncExternalStore } from 'react'
import type { ListEntry } from '@/types/domain'
import { supabase } from './supabase'

export const LIST_MUTATION_KEY = ['list-mutation'] as const

export type ListMutationVariables =
  | { type: 'insert'; householdId: string; row: ListEntry }
  | { type: 'remove'; householdId: string; entryId: string }
  | { type: 'patch'; householdId: string; entryId: string; changes: Partial<ListEntry> }
  | { type: 'clear'; householdId: string }

/** Esegue una modifica alla lista contro Supabase */
export async function runListMutation(variables: ListMutationVariables): Promise<void> {
  switch (variables.type) {
    case 'insert': {
      const { error } = await supabase
        .from('list_entries')
        .upsert(variables.row, { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'remove': {
      const { error } = await supabase.from('list_entries').delete().eq('id', variables.entryId)
      if (error) throw error
      return
    }
    case 'patch': {
      const { error } = await supabase
        .from('list_entries')
        .update(variables.changes)
        .eq('id', variables.entryId)
      if (error) throw error
      return
    }
    case 'clear': {
      const { error } = await supabase
        .from('list_entries')
        .delete()
        .eq('household_id', variables.householdId)
      if (error) throw error
      return
    }
  }
}

/** Da chiamare una volta, prima del provider: rende riprendibili le mutation persistite */
export function registerOfflineMutations(queryClient: QueryClient) {
  queryClient.setMutationDefaults(LIST_MUTATION_KEY, {
    mutationFn: runListMutation,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
  })
}

/** Persister su IndexedDB (idb-keyval), una sola chiave per tutta la cache */
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: 'frigolo-query-cache',
  throttleTime: 1000,
})

/** Stato di rete come visto da TanStack Query (navigator.onLine + eventi) */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true,
  )
}

/** Quante modifiche alla lista sono in attesa di rete */
export function usePendingListMutations(): number {
  return useIsMutating({ mutationKey: LIST_MUTATION_KEY, predicate: (m) => m.state.isPaused })
}
