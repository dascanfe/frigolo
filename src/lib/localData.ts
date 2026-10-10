import { queryPersister } from './offlineQueue'
import { queryClient } from './queryClient'

/** Cache del service worker con le risposte REST di Supabase (vedi vite.config.ts) */
const SUPABASE_REST_CACHE = 'supabase-rest'

/**
 * Cancella dal dispositivo i dati dell'account appena uscito (audit M6):
 * cache di TanStack Query in memoria e su IndexedDB, modifiche offline in
 * attesa (non devono partire con la sessione di un altro account) e risposte
 * REST salvate dal service worker. Idempotente: si può chiamare più volte.
 */
export async function clearLocalData(): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.getMutationCache().clear()
  queryClient.clear()
  await Promise.allSettled([
    queryPersister.removeClient(),
    'caches' in window ? caches.delete(SUPABASE_REST_CACHE) : Promise.resolve(false),
  ])
}
