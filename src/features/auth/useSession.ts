import type { Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { clearLocalData } from '@/lib/localData'
import { supabase } from '@/lib/supabase'

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | {
      status: 'signed-in'
      session: Session
      user: User
      /** true se si è entrati da un link di recupero password: va chiesta la nuova */
      recovery: boolean
      endRecovery: () => void
    }

/**
 * Sessione Supabase corrente. "loading" finché il client non ha letto lo
 * storage locale (e scambiato l'eventuale codice PKCE nell'URL).
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
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

  if (session === undefined) return { status: 'loading' }
  if (session === null) return { status: 'signed-out' }
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
