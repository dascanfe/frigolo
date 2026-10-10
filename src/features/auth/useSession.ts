import type { EmailOtpType, Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { it as t } from '@/i18n/it'
import { verifyAuthLink } from '@/lib/authConfirm'
import { clearLocalData } from '@/lib/localData'
import { supabase } from '@/lib/supabase'
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
        if (!active) return supabase.auth.getSession()
        if (link.kind === 'error') setLinkError({ type: link.type })
        if (link.kind === 'ok') {
          if (link.type === 'recovery') setRecovery(true)
          else if (link.type === 'email_change') toast(t.authLink.emailChanged, 'success')
          else toast(t.authLink.confirmed, 'success')
        }
        return supabase.auth.getSession()
      })
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .catch(() => {
        if (active) setSession(null)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
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

/** Esce dall'account e cancella dal dispositivo i dati in cache */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } finally {
    await clearLocalData()
  }
}
