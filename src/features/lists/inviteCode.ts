/**
 * Codici e link d'invito. Ogni lista ne ha due, validi 7 giorni:
 * - il codice corto, 8 caratteri tra lettere maiuscole e numeri, da dettare o
 *   scrivere a mano (spazi, trattini e minuscole non contano);
 * - il token del link /invito/<token>, 22 caratteri base64url, che conta
 *   maiuscole e minuscole e quindi non va mai normalizzato.
 * Il database accetta l'uno o l'altro (find_household_by_invite).
 */

export const INVITE_CODE_LENGTH = 8

const INVITE_PATH = /^\/invito\/([^/?#]+)\/?$/i
const INVITE_TOKEN = /^[A-Za-z0-9_-]{22}$/

export function isInviteToken(value: string): boolean {
  return INVITE_TOKEN.test(value)
}

/** Codice corto scritto a mano: maiuscole, solo lettere e numeri, al massimo 8 */
export function normalizeInviteCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
}

/**
 * Da un testo incollato (link, token o codice) all'invito da mandare al
 * database: il token resta com'è, il codice si normalizza. Null se non c'è
 * niente di utilizzabile.
 */
export function parseInvite(raw: string): string | null {
  const text = raw.trim()
  const fromLink = /\/invito\/([^/?#\s]+)/i.exec(text)?.[1]
  const candidate = fromLink ? safeDecode(fromLink) : text
  if (isInviteToken(candidate)) return candidate
  const code = normalizeInviteCode(candidate)
  return code.length > 0 ? code : null
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function isCompleteInviteCode(code: string): boolean {
  return code.length === INVITE_CODE_LENGTH
}

/** L'invito di un percorso /invito/<token o codice>, oppure null */
export function inviteCodeFromPath(pathname: string): string | null {
  const match = INVITE_PATH.exec(pathname)
  if (!match?.[1]) return null
  return parseInvite(safeDecode(match[1]))
}

/** Link d'invito da mandare: https://<app>/invito/<token> */
export function inviteLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/invito/${token}`
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
    return value ? parseInvite(value) : null
  } catch {
    return null
  }
}

export function savePendingInvite(code: string): void {
  try {
    window.localStorage.setItem(PENDING_KEY, code)
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
