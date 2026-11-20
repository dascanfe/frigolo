/**
 * Indirizzi delle schermate di chi non ha ancora fatto l'accesso. Il router
 * dell'app vive dentro AuthGate e serve solo a chi è dentro: qui bastano
 * l'indirizzo della pagina e la cronologia del browser.
 */

/** Schermata "Crea una nuova password" (richiesta del link via email) */
export const FORGOT_PASSWORD_PATH = '/password-dimenticata'

/** Segno nella cronologia: la pagina è stata aperta dall'accesso, "indietro" ci torna */
export const FROM_LOGIN_STATE = 'frigolo:from-login'

export type SignedOutRoute = 'login' | 'forgot-password'

/** Quale schermata mostrare per un indirizzo (barra finale e maiuscole ammesse) */
export function routeFromPath(pathname: string): SignedOutRoute {
  const clean = pathname.replace(/\/+$/, '').toLowerCase()
  return clean === FORGOT_PASSWORD_PATH ? 'forgot-password' : 'login'
}
