import { useEffect, useSyncExternalStore } from 'react'
import { Outlet } from 'react-router'
import { useRealtimeSync } from '@/features/list/useRealtimeSync'
import { getServiceWorkerState, subscribeServiceWorker } from '@/lib/pwa'
import { toast } from '@/lib/toast'
import { BottomNav } from './BottomNav'
import { InstallBanner } from './InstallBanner'
import { OfflineBanner } from './OfflineBanner'

/** Layout comune: colonna centrata (max 1024px, è anche il container query "shell"), bottom nav flottante */
export function AppShell() {
  useRealtimeSync()
  const sw = useSyncExternalStore(
    subscribeServiceWorker,
    getServiceWorkerState,
    getServiceWorkerState,
  )
  useEffect(() => {
    if (sw.needRefresh)
      toast('Nuova versione disponibile: aggiorna dalle Impostazioni', 'info', 5000)
  }, [sw.needRefresh])
  return (
    <div className="mx-auto min-h-dvh max-w-5xl pb-nav pt-safe @container/shell">
      <OfflineBanner />
      <Outlet />
      <InstallBanner />
      <BottomNav />
    </div>
  )
}
