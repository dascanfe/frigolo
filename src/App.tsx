import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from 'react-router/dom'
import { ToastHost } from '@/components/Toast'
import { AuthGate } from '@/features/auth/AuthGate'
import { queryPersister } from '@/lib/offlineQueue'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: ONE_WEEK,
        // cambia versione = cache vecchia scartata
        buster: __APP_VERSION__,
      }}
      // ripristinata la cache, le modifiche fatte offline riprendono
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
      <ToastHost />
    </PersistQueryClientProvider>
  )
}
