import { clearPendingInvite } from '@/features/lists/inviteCode'
import { queryPersister } from './offlineQueue'
import { queryClient } from './queryClient'

/** Cache del service worker con le risposte REST di Supabase (vedi vite.config.ts) */
const SUPABASE_REST_CACHE = 'supabase-rest'

const CURRENT_LIST_PREFIX = 'frigolo:current-list:'

/** Toglie da localStorage tutte le chiavi che iniziano con il prefisso */
function clearStoredKeys(prefix: string) {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
    for (const key of keys) window.localStorage.removeItem(key)
  } catch {
    // storage non disponibile: niente da togliere
  }
}

/**
 * Cancella dal dispositivo i dati dell'account appena uscito (audit M6):
 * cache di TanStack Query in memoria e su IndexedDB, modifiche offline in
 * attesa (non devono partire con la sessione di un altro account), risposte
 * REST salvate dal service worker, invito in sospeso e lista aperta salvata.
 * Idempotente: si può chiamare più volte.
 */
export async function clearLocalData(): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.getMutationCache().clear()
  queryClient.clear()
  clearPendingInvite()
  clearStoredKeys(CURRENT_LIST_PREFIX)
  await Promise.allSettled([
    queryPersister.removeClient(),
    'caches' in window ? caches.delete(SUPABASE_REST_CACHE) : Promise.resolve(false),
  ])
}
