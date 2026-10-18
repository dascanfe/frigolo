/**
 * Link delle email di Supabase (conferma, recupero password, cambio email)
 * nel formato /auth/confirm?token_hash=...&type=... (template in
 * supabase/templates/). A differenza del flusso PKCE funzionano da qualunque
 * browser, anche quando l'app è installata come PWA su iPhone e il link si
 * apre in Safari.
 *
 * All'avvio, prima del router, il link viene messo da parte e l'indirizzo
 * torna a "/": la verifica la fa useSession con verifyOtp.
 */
import type { EmailOtpType } from '@supabase/supabase-js'

const CONFIRM_PATH = /^\/auth\/confirm\/?$/
const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'email',
  'recovery',
  'invite',
  'magiclink',
  'email_change',
]

export interface AuthConfirm {
  tokenHash: string
  type: EmailOtpType
}

/** Legge token_hash e type da un URL /auth/confirm; null se non è un link valido */
export function parseAuthConfirm(pathname: string, search: string): AuthConfirm | null {
  if (!CONFIRM_PATH.test(pathname)) return null
  const params = new URLSearchParams(search)
  const tokenHash = params.get('token_hash')?.trim()
  const type = params.get('type') as EmailOtpType | null
  if (!tokenHash || !type || !OTP_TYPES.includes(type)) return null
  return { tokenHash, type }
}

let pending: AuthConfirm | null = null
let wasConfirmPath = false

/** Da chiamare all'avvio: mette da parte il link e ripulisce l'indirizzo */
export function captureAuthConfirm(): void {
  const { pathname, search } = window.location
  if (!CONFIRM_PATH.test(pathname)) return
  wasConfirmPath = true
  pending = parseAuthConfirm(pathname, search)
  window.history.replaceState(null, '', '/')
}

/** Il link da verificare, una volta sola */
export function takeAuthConfirm(): { confirm: AuthConfirm | null; malformed: boolean } {
  const confirm = pending
  const malformed = wasConfirmPath && !pending
  pending = null
  wasConfirmPath = false
  return { confirm, malformed }
}

export type AuthLinkResult =
  | { kind: 'none' }
  | { kind: 'ok'; type: EmailOtpType }
  /** C'era già una sessione e non si è voluto cambiare account: link ignorato */
  | { kind: 'skipped' }
  /** Link scaduto, già usato o rovinato: type null se non si capisce di che link si tratta */
  | { kind: 'error'; type: EmailOtpType | null }

let verification: Promise<AuthLinkResult> | null = null

/**
 * Verifica il link messo da parte (una sola volta, anche se React monta due
 * volte i componenti in sviluppo) e apre la sessione.
 */
export function verifyAuthLink(
  verify: (confirm: AuthConfirm) => Promise<{ error: unknown } | 'skipped'>,
): Promise<AuthLinkResult> {
  if (verification) return verification
  const { confirm, malformed } = takeAuthConfirm()
  verification = (async (): Promise<AuthLinkResult> => {
    if (!confirm) return malformed ? { kind: 'error', type: null } : { kind: 'none' }
    try {
      const outcome = await verify(confirm)
      if (outcome === 'skipped') return { kind: 'skipped' }
      const { error } = outcome
      return error ? { kind: 'error', type: confirm.type } : { kind: 'ok', type: confirm.type }
    } catch {
      return { kind: 'error', type: confirm.type }
    }
  })()
  return verification
}
