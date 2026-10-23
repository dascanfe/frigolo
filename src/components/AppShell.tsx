import { Fragment } from 'react'
import { Outlet } from 'react-router'
import { useHousehold } from '@/features/auth/useHousehold'
import { useRealtimeSync } from '@/features/list/useRealtimeSync'
import { TipBubble } from '@/features/tips/TipBubble'
import { useSuppressTipsForExperienced } from '@/features/tips/useSuppressTipsForExperienced'
import { BottomNav } from './BottomNav'
import { InstallBanner } from './InstallBanner'
import { OfflineBanner } from './OfflineBanner'
import { UpdateBar } from './UpdateBar'

/** Layout comune: colonna centrata (max 1024px, è anche il container query "shell"), bottom nav flottante */
export function AppShell() {
  useRealtimeSync()
  useSuppressTipsForExperienced()
  const { household } = useHousehold()
  return (
    <div className="mx-auto min-h-dvh max-w-5xl pb-nav pt-safe @container/shell">
      <UpdateBar />
      <OfflineBanner />
      {/* cambiando lista le schermate ripartono pulite (filtri, ricerca, pannelli) */}
      <Fragment key={household.id}>
        <Outlet />
      </Fragment>
      <InstallBanner />
      <TipBubble />
      <BottomNav />
    </div>
  )
}
