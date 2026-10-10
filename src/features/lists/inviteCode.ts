/**
 * Codici e link d'invito.
 *
 * Il codice ha 8 caratteri tra lettere maiuscole e numeri (senza 0, O, 1, I, L:
 * vedi generate_join_code). Chi lo scrive a mano può mettere spazi, trattini o
 * minuscole, oppure incollare il link intero: qui si riduce tutto al codice.
 * La stessa normalizzazione la fa anche il database (normalize_join_code).
 */

export const INVITE_CODE_LENGTH = 8

const INVITE_PATH = /^\/invito\/([^/?#]+)\/?$/i

/** Maiuscole, solo lettere e numeri; da un link prende la parte dopo /invito/ */
export function normalizeInviteCode(raw: string): string {
  const text = raw.trim()
  const fromLink = /\/invito\/([^/?#\s]+)/i.exec(text)
  const code = fromLink?.[1] ?? text
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
}

export function isCompleteInviteCode(code: string): boolean {
  return code.length === INVITE_CODE_LENGTH
}

/** Il codice di un percorso /invito/:code, oppure null */
export function inviteCodeFromPath(pathname: string): string | null {
  const match = INVITE_PATH.exec(pathname)
  if (!match?.[1]) return null
  const code = normalizeInviteCode(decodeURIComponent(match[1]))
  return code.length > 0 ? code : null
}

/** Link d'invito da mandare: https://<app>/invito/<codice> */
export function inviteLink(origin: string, code: string): string {
  return `${origin.replace(/\/$/, '')}/invito/${code}`
}

/* ---------------------------------------------------------------------------
 * Invito in sospeso: chi apre un link senza essere dentro l'app passa prima
 * da registrazione, conferma email e profilo. Il codice resta sul dispositivo
 * (localStorage, sopravvive al link di conferma aperto nello stesso browser)
 * finché non entra nella lista o rinuncia.
 * ------------------------------------------------------------------------- */

const PENDING_KEY = 'frigolo:pending-invite'

export function readPendingInvite(): string | null {
  try {
    const value = window.localStorage.getItem(PENDING_KEY)
    return value ? normalizeInviteCode(value) || null : null
  } catch {
    return null
  }
}

export function savePendingInvite(code: string): void {
  try {
    window.localStorage.setItem(PENDING_KEY, normalizeInviteCode(code))
  } catch {
    // storage non disponibile (navigazione privata): l'invito vale solo per questa visita
  }
}

export function clearPendingInvite(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY)
  } catch {
    // niente da fare
  }
}

/**
 * Da chiamare all'avvio, prima del router: se l'URL è un link d'invito il
 * codice viene messo da parte e l'indirizzo torna a "/".
 */
export function captureInviteFromUrl(): void {
  const code = inviteCodeFromPath(window.location.pathname)
  if (!code) return
  savePendingInvite(code)
  window.history.replaceState(null, '', '/')
}
