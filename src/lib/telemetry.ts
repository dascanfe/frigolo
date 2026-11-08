/**
 * Metriche anonime d'uso (Pepe): durata delle sessioni ed errori.
 *
 * Cosa parte, e solo per chi ha fatto l'accesso:
 * - a fine sessione: durata in secondi, versione, modalità (app installata o
 *   browser), tipo di dispositivo (ios/android/desktop), tema, se si è stati
 *   offline. Nessun identificativo: il server somma tutto in contatori per giorno;
 * - per gli errori: tipo, messaggio tecnico ripulito (niente email, id, token,
 *   numeri lunghi), versione, pagina senza parametri. Al massimo 10 per
 *   apertura, senza doppioni. Gli errori di render (schermata di cortesia) hanno
 *   il prefisso "[render]" e, in coda, componente e file:riga.
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

type Rpc = 'metrics_record_session' | 'metrics_record_error' | 'metrics_record_event'

/** Eventi dell'app: elenco chiuso, lo stesso della RPC metrics_record_event. */
export type EventoApp =
  | 'ricerca_vuota'
  | 'install_scheda'
  | 'install_android_tocco'
  | 'install_prompt_accettato'
  | 'install_prompt_rifiutato'
  | 'install_guida_ios'
  | 'aggiorna_barra'
  | 'aggiorna_tocco'

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

/**
 * Conta un evento dell'app (solo il nome, da un elenco chiuso: mai testi
 * scritti dall'utente). Ognuno al massimo una volta per apertura.
 */
const eventiInviati = new Set<EventoApp>()
export function recordEvent(evento: EventoApp, ancheRipetuto = false) {
  if (!ancheRipetuto && eventiInviati.has(evento)) return
  eventiInviati.add(evento)
  void invia('metrics_record_event', { p_evento: evento })
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
    // ora di inizio (ora del telefono), per la mappa degli orari d'uso
    p_ora: new Date(da).getHours(),
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

export type TipoErrore = 'errore' | 'promessa' | 'query' | 'modifica' | 'render'

/**
 * Tipi ammessi dal server (metrics_record_error): gli altri finirebbero in "altro".
 * Gli errori di render partono come "errore" con il prefisso "[render]" nel
 * messaggio, finché il server non ammette "render" (migration 0028 da preparare).
 */
const TIPO_SERVER: Record<TipoErrore, 'errore' | 'promessa' | 'query' | 'modifica'> = {
  errore: 'errore',
  promessa: 'promessa',
  query: 'query',
  modifica: 'modifica',
  render: 'errore',
}

function descrivi(errore: unknown): string {
  if (errore instanceof Error) return `${errore.name}: ${errore.message}`
  if (typeof errore === 'object' && errore && 'message' in errore)
    return String((errore as { message: unknown }).message)
  return String(errore)
}

/**
 * Dove è successo un errore di render: nome del componente (prima voce utile
 * dello stack dei componenti di React; in produzione i nomi sono accorciati dal
 * minificatore) e file:riga della prima riga utile dello stack dell'errore.
 */
export function doveRender(errore: unknown, componentStack?: string | null): string {
  const parti: string[] = []
  // senza i parametri degli indirizzi (in sviluppo: ?t=...) la riga si legge meglio
  const stack = (errore instanceof Error ? (errore.stack ?? '') : '').replace(/\?[^\s:)]*/g, '')
  // lo stack dei componenti di React c'è solo per i confini di errore; per le rotte
  // si ripiega sul nome della funzione nella prima riga dello stack dell'errore
  const componente =
    componentStack?.match(/^\s*at\s+([A-Z][\w$.]*)/m)?.[1] ??
    stack.match(/^\s*at\s+(?:async\s+)?([A-Z][\w$.]*)\s+\(/m)?.[1]
  if (componente) parti.push(componente)
  const frame = stack.match(/([\w.-]+\.(?:m?js|[jt]sx?)):(\d+)(?::(\d+))?/)
  if (frame) parti.push(`${frame[1]}:${frame[2]}${frame[3] ? `:${frame[3]}` : ''}`)
  return parti.join(' ')
}

/** "[render] Nome: messaggio @ Componente file.js:12", ripulito e dentro i 200 caratteri */
export function messaggioRender(errore: unknown, componentStack?: string | null): string {
  const dove = ripulisci(doveRender(errore, componentStack), 60)
  const testa = ripulisci(`[render] ${descrivi(errore)}`, dove ? 200 - dove.length - 3 : 200)
  return dove ? `${testa} @ ${dove}` : testa
}

interface DettagliErrore {
  /** Stack dei componenti di React (solo errori di render) */
  componentStack?: string | null
  /** Pagina da riportare, se diversa da quella in cui ci si trova */
  pagina?: string
}

/** Errori: tipo, messaggio ripulito, versione e pagina, senza doppioni. */
export function reportError(tipo: TipoErrore, errore: unknown, dettagli: DettagliErrore = {}) {
  // offline gli errori di rete sono attesi: non dicono niente
  if (!navigator.onLine) return
  if (erroriInviati.size >= MAX_ERRORI) return
  const messaggio =
    tipo === 'render'
      ? messaggioRender(errore, dettagli.componentStack)
      : ripulisci(descrivi(errore))
  const chiave = `${tipo}|${messaggio}`
  if (erroriInviati.has(chiave)) return
  erroriInviati.add(chiave)
  void invia('metrics_record_error', {
    p_tipo: TIPO_SERVER[tipo],
    p_messaggio: messaggio,
    p_versione: VERSIONE,
    p_pagina: dettagli.pagina ?? location.pathname,
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
