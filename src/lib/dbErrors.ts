/**
 * Errori del database in parole di tutti i giorni. Le RPC e le quote mettono
 * in `hint` una chiave stabile (docs/SVILUPPO.md, "Errori"): si riconoscono da
 * quella, non dal testo, che può cambiare. Funziona con PostgrestError, Error
 * o qualunque oggetto con message e hint.
 */

export const NETWORK_ERROR = 'Nessuna connessione. Controlla la rete e riprova.'

/** Testi per le chiavi d'errore del database */
export const DB_ERROR_TEXTS: Readonly<Record<string, string>> = {
  lists_limit: "Hai già 2 liste, il massimo. Per crearne o raggiungerne un'altra, lasciane una.",
  members_limit: 'Questa lista è piena: ci sono già 5 persone, il massimo.',
  rate_limited: 'Troppi tentativi. Aspetta qualche minuto e riprova.',
  not_member: 'Non sei più in questa lista.',
  has_other_people: 'Nella lista ci sono altre persone: puoi solo lasciarla.',
  not_found: 'Questa lista non esiste più.',
  not_authenticated: 'La sessione è scaduta. Esci e rientra.',
  items_quota:
    'Questa lista ha già 500 prodotti creati a mano: archiviane qualcuno per crearne altri.',
  entries_quota: 'In lista ci sono già 300 prodotti: togline qualcuno per aggiungerne altri.',
  trips_quota: 'Oggi questa lista ha già 30 spese. Riprova domani.',
  purchases_quota: 'Il carrello è troppo pieno per una sola spesa: al massimo 300 prodotti.',
}

const QUOTA_HINTS = new Set(['items_quota', 'entries_quota', 'trips_quota', 'purchases_quota'])

function field(error: unknown, name: string): string {
  if (typeof error === 'object' && error !== null && name in error) {
    return String((error as Record<string, unknown>)[name] ?? '')
  }
  return ''
}

export function errorMessage(error: unknown): string {
  return field(error, 'message') || (typeof error === 'string' ? error : '')
}

/** La chiave stabile dell'errore (hint), oppure '' */
export function errorHint(error: unknown): string {
  const hint = field(error, 'hint')
  if (hint) return hint
  // PostgREST traduce PT429 in 429: a volte arriva solo il codice
  return field(error, 'code') === 'PT429' || field(error, 'status') === '429' ? 'rate_limited' : ''
}

/** Testo per un limite superato (quote della lista), oppure null */
export function describeQuotaError(error: unknown): string | null {
  const hint = errorHint(error)
  return QUOTA_HINTS.has(hint) ? (DB_ERROR_TEXTS[hint] ?? null) : null
}

/** Messaggio da mostrare: errore noto, rete, oppure il testo di riserva */
export function describeDbError(error: unknown, fallback: string): string {
  const known = DB_ERROR_TEXTS[errorHint(error)]
  if (known) return known
  const lower = errorMessage(error).toLowerCase()
  if (lower.includes('fetch') || lower.includes('network')) return NETWORK_ERROR
  return fallback
}
