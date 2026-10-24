import { Component, useEffect } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useRouteError } from 'react-router'
import { CrashScreen } from '@/components/CrashScreen'
import { isChunkLoadError, reloadOnceForNewVersion } from '@/lib/pwa'
import { reportError } from '@/lib/telemetry'

interface ErrorBoundaryProps {
  children: ReactNode
}

/**
 * Rete di sicurezza di primo livello: un errore durante il render non smonta
 * più tutto lasciando lo schermo bianco, ma mostra la schermata di cortesia.
 * Riceve l'oggetto Error vero (anche quando window.onerror vede solo
 * "Script error.") e lo manda alle metriche con tipo "render".
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    reportError('render', error, { componentStack: info.componentStack })
  }

  render() {
    return this.state.failed ? <CrashScreen fullScreen /> : this.props.children
  }
}

/**
 * errorElement delle rotte: prende l'errore dal router (render, caricamento di
 * un pezzo lazy, ...). Se un pezzo dell'app non si è caricato perché è uscita
 * una versione nuova, ricarica una volta da solo.
 */
export function RouteError({ fullScreen = false }: { fullScreen?: boolean }) {
  const error = useRouteError()
  useEffect(() => {
    if (isChunkLoadError(error) && reloadOnceForNewVersion()) return
    reportError('render', error)
  }, [error])
  return <CrashScreen fullScreen={fullScreen} />
}
