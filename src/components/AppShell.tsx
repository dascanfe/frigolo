import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useHousehold } from '@/features/auth/useHousehold'
import { useRealtimeSync } from '@/features/list/useRealtimeSync'
import { TipBubble } from '@/features/tips/TipBubble'
import { recordVisit, sezioneDelPercorso } from '@/lib/telemetry'
import { useSuppressTipsForExperienced } from '@/features/tips/useSuppressTipsForExperienced'
import { OfflineBanner } from './OfflineBanner'
import { UpdateBar } from './UpdateBar'

/** Layout comune: colonna centrata (max 1024px, è anche il container query "shell"). Niente barra in basso: si naviga dalla lista. */
export function AppShell() {
  useRealtimeSync()
  useSuppressTipsForExperienced()
  const { household } = useHousehold()
  const { pathname } = useLocation()
  // ogni cambio di pagina riparte dall'alto (prima che la pagina venga disegnata)
  useLayoutEffect(() => {
    // anche con il tasto indietro: il browser non deve riportare la vecchia posizione
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [pathname])
  // metriche anonime: un ingresso per ogni cambio di sezione (unico punto per
  // tutte le rotte). Il ref evita il doppio conteggio di StrictMode in sviluppo.
  const ultimaSezione = useRef<string | null>(null)
  useEffect(() => {
    if (ultimaSezione.current === pathname) return
    ultimaSezione.current = pathname
    const sezione = sezioneDelPercorso(pathname)
    if (sezione) recordVisit(sezione)
  }, [pathname])
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
