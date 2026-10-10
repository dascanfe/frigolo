import type { Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
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
      if (event === 'SIGNED_OUT') setRecovery(false)
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

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
