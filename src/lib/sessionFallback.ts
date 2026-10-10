/**
 * Avvio senza server: Frigolo deve aprirsi anche quando Supabase non risponde
 * (niente rete, server giù). supabase-js all'avvio prova a rinnovare il token
 * e, se la rete manca, riprova per circa 30 secondi prima di arrendersi: nel
 * frattempo l'app resterebbe ferma sullo splash.
 *
 * Qui le funzioni pure per decidere: se c'è una sessione salvata la si usa
 * subito (l'app mostra la cache persistita e supabase-js continua a riprovare
 * in background); il login compare solo se non c'è nessuna sessione.
 */
import type { Session } from '@supabase/supabase-js'

/** Dopo quanto smettere di aspettare il server all'avvio */
export const SESSION_STARTUP_TIMEOUT_MS = 3000

interface StorageLike {
  getItem: (key: string) => string | null
}

/** La sessione salvata da supabase-js, senza chiamare il server; null se non c'è */
export function readStoredSession(storage: StorageLike, key: string): Session | null {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session> | null
    if (
      !parsed ||
      typeof parsed.access_token !== 'string' ||
      typeof parsed.refresh_token !== 'string' ||
      typeof parsed.user?.id !== 'string'
    ) {
      return null
    }
    return parsed as Session
  } catch {
    return null
  }
}

/** L'errore è "il server non risponde" (e quindi la sessione salvata resta valida)? */
export function isNetworkAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const { name, status, message } = error as { name?: unknown; status?: unknown; message?: unknown }
  if (name === 'AuthRetryableFetchError') return true
  if (status === 0) return true
  const text = typeof message === 'string' ? message.toLowerCase() : ''
  return text.includes('fetch') || text.includes('network') || text.includes('load failed')
}
