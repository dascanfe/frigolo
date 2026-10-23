/**
 * Metriche anonime d'uso (Pepe): durata delle sessioni ed errori.
 *
 * Cosa parte, e solo per chi ha fatto l'accesso:
 * - a fine sessione: durata in secondi, versione, modalità (app installata o
 *   browser), tipo di dispositivo (ios/android/desktop), tema, se si è stati
 *   offline. Nessun identificativo: il server somma tutto in contatori per giorno;
 * - per gli errori: tipo, messaggio tecnico ripulito (niente email, id, token,
 *   numeri lunghi), versione, pagina senza parametri. Al massimo 10 per
 *   apertura, senza doppioni.
 *
 * Sessione: parte all'apertura e quando la pagina torna visibile; finisce
 * quando la pagina resta nascosta per più di 30 secondi. Se l'app viene chiusa
 * mentre è nascosta, la sessione si manda alla prossima apertura (localStorage).
 */
import { isStandalone } from './pwa'
import { getTheme } from './theme'

const VERSIONE = __APP_VERSION__
const PAUSA_MS = 30_000
const MAX_ERRORI = 10
const CHIAVE_IN_SOSPESO = 'frigolo.sessione'

type Rpc = 'metrics_record_session' | 'metrics_record_error'

let inizio: number | null = null
let nascostaDa: number | null = null
let offline = false
let attivo = false
const erroriInviati = new Set<string>()

async function invia(fn: Rpc, args: Record<string, unknown>) {
  try {
    const { supabase } = await import('./supabase')
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    // le due RPC non sono nei tipi generati: chiamata senza tipi
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      f: string,
      a: Record<string, unknown>,
    ) => PromiseLike<unknown>
    await rpc(fn, args)
  } catch {
    // le metriche non devono mai disturbare l'app
  }
}

function dispositivo(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/** Toglie dal testo email, id, parametri degli indirizzi, token e numeri lunghi. */
export function ripulisci(testo: string, max = 200): string {
  return testo
    .replace(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi, '<email>')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/\?[^\s"']*/g, '')
    .replace(/[\w-]{20,}/g, '<token>')
    .replace(/\d{4,}/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function mandaSessione(da: number, a: number, eraOffline: boolean) {
  const secondi = Math.round((a - da) / 1000)
  if (secondi < 1) return
  void invia('metrics_record_session', {
    p_secondi: Math.min(secondi, 14_400),
    p_versione: VERSIONE,
    p_modalita: isStandalone() ? 'standalone' : 'browser',
    p_dispositivo: dispositivo(),
    p_tema: getTheme(),
    p_offline: eraOffline,
  })
}

function apri() {
  if (inizio !== null) return
  inizio = Date.now()
  offline = !navigator.onLine
}

function chiudi(fine: number) {
  if (inizio === null) return
  mandaSessione(inizio, fine, offline)
  inizio = null
  salvaInSospeso(null)
}

function salvaInSospeso(valore: { da: number; a: number; offline: boolean } | null) {
  try {
    if (valore) localStorage.setItem(CHIAVE_IN_SOSPESO, JSON.stringify(valore))
    else localStorage.removeItem(CHIAVE_IN_SOSPESO)
  } catch {
    // storage non disponibile: la sessione si perde, pazienza
  }
}

function recuperaInSospeso() {
  try {
    const grezzo = localStorage.getItem(CHIAVE_IN_SOSPESO)
    localStorage.removeItem(CHIAVE_IN_SOSPESO)
    if (!grezzo) return
    const s = JSON.parse(grezzo) as { da: number; a: number; offline: boolean }
    if (typeof s.da === 'number' && typeof s.a === 'number')
      mandaSessione(s.da, s.a, Boolean(s.offline))
  } catch {
    // dato rovinato: si ignora
  }
}

function alCambioVisibilita() {
  if (document.visibilityState === 'hidden') {
    nascostaDa = Date.now()
    if (inizio !== null) salvaInSospeso({ da: inizio, a: nascostaDa, offline })
    return
  }
  // di nuovo visibile: se è rimasta nascosta più di 30 secondi la sessione
  // di prima è finita quando è stata nascosta, e ne parte una nuova
  if (nascostaDa !== null && Date.now() - nascostaDa > PAUSA_MS) chiudi(nascostaDa)
  nascostaDa = null
  salvaInSospeso(null)
  apri()
}

/** Errori: tipo, messaggio ripulito, versione e pagina, senza doppioni. */
export function reportError(tipo: 'errore' | 'promessa' | 'query' | 'modifica', errore: unknown) {
  // offline gli errori di rete sono attesi: non dicono niente
  if (!navigator.onLine) return
  if (erroriInviati.size >= MAX_ERRORI) return
  const grezzo =
    errore instanceof Error
      ? `${errore.name}: ${errore.message}`
      : typeof errore === 'object' && errore && 'message' in errore
        ? String((errore as { message: unknown }).message)
        : String(errore)
  const messaggio = ripulisci(grezzo)
  const chiave = `${tipo}|${messaggio}`
  if (erroriInviati.has(chiave)) return
  erroriInviati.add(chiave)
  void invia('metrics_record_error', {
    p_tipo: tipo,
    p_messaggio: messaggio,
    p_versione: VERSIONE,
    p_pagina: location.pathname,
  })
}

/** Da chiamare una volta all'avvio. */
export function setupTelemetry() {
  if (attivo) return
  attivo = true
  recuperaInSospeso()
  if (document.visibilityState !== 'hidden') apri()
  document.addEventListener('visibilitychange', alCambioVisibilita)
  window.addEventListener('pagehide', () => {
    if (inizio !== null) salvaInSospeso({ da: inizio, a: nascostaDa ?? Date.now(), offline })
  })
  window.addEventListener('offline', () => {
    if (inizio !== null) offline = true
  })
  window.addEventListener('error', (e) => reportError('errore', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => reportError('promessa', e.reason))
}
