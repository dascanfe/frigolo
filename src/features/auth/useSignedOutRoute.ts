import { useCallback, useEffect, useState } from 'react'
import { FORGOT_PASSWORD_PATH, FROM_LOGIN_STATE, routeFromPath } from './authRoute'
import type { SignedOutRoute } from './authRoute'

/**
 * Schermata corrente fuori dall'app (accesso o "Crea una nuova password"),
 * legata all'indirizzo: il tasto indietro del telefono e del browser funziona,
 * e /password-dimenticata si può aprire anche direttamente.
 */
export function useSignedOutRoute() {
  const [route, setRoute] = useState<SignedOutRoute>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openForgotPassword = useCallback(() => {
    if (routeFromPath(window.location.pathname) !== 'forgot-password') {
      window.history.pushState(FROM_LOGIN_STATE, '', FORGOT_PASSWORD_PATH)
    }
    setRoute('forgot-password')
  }, [])

  const openLogin = useCallback(() => {
    // aperta dall'accesso: si torna indietro nella cronologia, senza doppioni
    if (window.history.state === FROM_LOGIN_STATE) window.history.back()
    else window.history.replaceState(null, '', '/')
    setRoute('login')
  }, [])

  return { route, openForgotPassword, openLogin }
}
