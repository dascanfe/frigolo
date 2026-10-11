import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY: copia .env.example in .env')
}

/**
 * Chiave della sessione in localStorage: è quella predefinita di supabase-js
 * (sb-<primo pezzo dell'host>-auth-token), scritta qui per poterla rileggere
 * quando il server non risponde (vedi sessionFallback.ts).
 */
export const AUTH_STORAGE_KEY = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`

export const supabase = createClient<Database>(url, key, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    // Accesso con email e password. Il PKCE serve solo al link di recupero
    // password, che quindi vale nel browser da cui è stato richiesto.
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Comodo per il debug in sviluppo: window.__frigolo.supabase nella console
if (import.meta.env.DEV) {
  Object.assign(window, { __frigolo: { supabase } })
}
