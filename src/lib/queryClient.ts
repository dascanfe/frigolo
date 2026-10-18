import {
  MutationCache,
  QueryCache,
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { registerOfflineMutations } from './offlineQueue'
import { reportError } from './telemetry'

/**
 * Client TanStack Query. La cache viene persistita su IndexedDB (vedi App e
 * offlineQueue): gcTime lungo, così catalogo e lista restano leggibili
 * offline anche dopo giorni.
 */
export const queryClient = new QueryClient({
  // errori di lettura e scrittura nelle metriche anonime (telemetry.ts)
  queryCache: new QueryCache({ onError: (e) => reportError('query', e) }),
  mutationCache: new MutationCache({ onError: (e) => reportError('modifica', e) }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      // offline: niente errori, si aspetta la rete mostrando la cache
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
      retry: 0,
    },
  },
})

registerOfflineMutations(queryClient)

// Debug in sviluppo: window.__frigoloQuery per simulare offline e focus
if (import.meta.env.DEV) {
  Object.assign(window, { __frigoloQuery: { queryClient, onlineManager, focusManager } })
}
