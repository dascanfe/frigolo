import { Fragment } from 'react'
import { Outlet } from 'react-router'
import { useHousehold } from '@/features/auth/useHousehold'
import { useRealtimeSync } from '@/features/list/useRealtimeSync'
import { TipBubble } from '@/features/tips/TipBubble'
import { useSuppressTipsForExperienced } from '@/features/tips/useSuppressTipsForExperienced'
import { OfflineBanner } from './OfflineBanner'
import { UpdateBar } from './UpdateBar'

/** Layout comune: colonna centrata (max 1024px, è anche il container query "shell"). Niente barra in basso: si naviga dalla lista. */
export function AppShell() {
  useRealtimeSync()
  useSuppressTipsForExperienced()
  const { household } = useHousehold()
  return (
    <div className="mx-auto min-h-dvh max-w-5xl pb-safe pt-safe @container/shell">
      <UpdateBar />
      <OfflineBanner />
      {/* cambiando lista le schermate ripartono pulite (filtri, ricerca, pannelli) */}
      <Fragment key={household.id}>
        <Outlet />
      </Fragment>
      <TipBubble />
    </div>
  )
}
