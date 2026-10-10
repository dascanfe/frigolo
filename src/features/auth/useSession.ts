import type { EmailOtpType, Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { it as t } from '@/i18n/it'
import { verifyAuthLink } from '@/lib/authConfirm'
import { clearLocalData } from '@/lib/localData'
import { AUTH_STORAGE_KEY, supabase } from '@/lib/supabase'
import {
  SESSION_STARTUP_TIMEOUT_MS,
  isNetworkAuthError,
  readStoredSession,
} from '@/lib/sessionFallback'
import { toast } from '@/lib/toast'

export type SessionState =
  | { status: 'loading' }
  | {
      status: 'signed-out'
      /** Link di un'email scaduto o già usato (null = nessun problema) */
      linkError: { type: EmailOtpType | null } | null
      clearLinkError: () => void
    }
  | {
      status: 'signed-in'
      session: Session
      user: User
      /** true se si è entrati da un link di recupero password: va chiesta la nuova */
      recovery: boolean
      endRecovery: () => void
    }

/**
 * Sessione Supabase corrente. "loading" finché il client non ha verificato
 * l'eventuale link di un'email (/auth/confirm) e letto lo storage locale.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)
  const [linkError, setLinkError] = useState<{ type: EmailOtpType | null } | null>(null)

  useEffect(() => {
    let active = true

    // prima l'eventuale link dell'email (/auth/confirm), poi la sessione salvata
    verifyAuthLink(({ tokenHash, type }) =>
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }),
    )
      .then((link) => {
        if (!active) return startupSession()
        if (link.kind === 'error') setLinkError({ type: link.type })
        if (link.kind === 'ok') {
          if (link.type === 'recovery') setRecovery(true)
          else if (link.type === 'email_change') toast(t.authLink.emailChanged, 'success')
          else toast(t.authLink.confirmed, 'success')
        }
        return startupSession()
      })
      .then((startup) => {
        if (active) setSession(startup)
      })
      .catch(() => {
        if (active) setSession(readStoredSession(window.localStorage, AUTH_STORAGE_KEY))
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      // la sessione iniziale la decide startupSession (che sa aspettare il server
      // o fare a meno di lui); gli eventi dopo, come il rinnovo del token tornata
      // la rete o l'uscita, valgono sempre
      if (event === 'INITIAL_SESSION') return
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') {
        setRecovery(false)
        // anche quando l'uscita arriva da un'altra scheda o da una sessione scaduta
        void clearLocalData()
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const endRecovery = useCallback(() => setRecovery(false), [])
  const clearLinkError = useCallback(() => setLinkError(null), [])

  if (session === undefined) return { status: 'loading' }
  if (session === null) return { status: 'signed-out', linkError, clearLinkError }
  return { status: 'signed-in', session, user: session.user, recovery, endRecovery }
}

/**
 * La sessione con cui aprire l'app. Chiede a supabase-js, ma senza aspettare
 * più di qualche secondo: se il server non risponde e c'è una sessione salvata
 * si usa quella (supabase-js continua a rinnovare il token in background e
 * avvisa con TOKEN_REFRESHED). null solo se non c'è nessuna sessione o se il
 * server la rifiuta davvero.
 */
async function startupSession(): Promise<Session | null> {
  const stored = () => readStoredSession(window.localStorage, AUTH_STORAGE_KEY)
  const fromServer = supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (data.session) return data.session
      return error && isNetworkAuthError(error) ? stored() : null
    })
    .catch(() => stored())
  // senza sessione salvata non c'è niente da rinnovare: si aspetta la risposta
  if (!stored()) return fromServer
  const timeout = new Promise<'timeout'>((resolve) =>
    window.setTimeout(() => resolve('timeout'), SESSION_STARTUP_TIMEOUT_MS),
  )
  const first = await Promise.race([fromServer, timeout])
  return first === 'timeout' ? stored() : first
}

/** Esce dall'account e cancella dal dispositivo i dati in cache */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } finally {
    await clearLocalData()
  }
}
