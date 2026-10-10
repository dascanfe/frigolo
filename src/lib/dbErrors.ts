/**
 * Errori del database in parole di tutti i giorni. I limiti anti abuso
 * (migration 0020) rispondono con messaggi tecnici: qui diventano frasi che
 * dicono cosa fare. Funziona con PostgrestError, Error o qualunque oggetto
 * con un campo message.
 */

const QUOTA_MESSAGES: readonly [string, string][] = [
  [
    'Troppi prodotti personalizzati',
    'Questa lista ha già 500 prodotti creati a mano: archiviane qualcuno per crearne altri.',
  ],
  [
    'Troppe voci nella lista',
    'In lista ci sono già 300 prodotti: togline qualcuno per aggiungerne altri.',
  ],
  ['Troppe spese registrate oggi', 'Oggi questa lista ha già troppe spese. Riprova domani.'],
  [
    'Troppi articoli in questa spesa',
    'Il carrello è troppo pieno per una sola spesa: al massimo 300 prodotti.',
  ],
]

export const NETWORK_ERROR = 'Nessuna connessione. Controlla la rete e riprova.'

export function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return typeof error === 'string' ? error : ''
}

/** Testo per un limite superato, oppure null se l'errore non è un limite */
export function describeQuotaError(error: unknown): string | null {
  const message = errorMessage(error)
  return QUOTA_MESSAGES.find(([needle]) => message.includes(needle))?.[1] ?? null
}

/** Messaggio da mostrare: limite, rete, oppure il testo di riserva */
export function describeDbError(error: unknown, fallback: string): string {
  const quota = describeQuotaError(error)
  if (quota) return quota
  const lower = errorMessage(error).toLowerCase()
  if (lower.includes('fetch') || lower.includes('network')) return NETWORK_ERROR
  return fallback
}
