/**
 * Quando mostrare la scheda "Installala". Chiusa con la X ricompare dopo 3
 * giorni, per al massimo 3 volte (poi basta: restano le Impostazioni). Lo
 * stato sta in localStorage e si legge come store (useSyncExternalStore).
 * L'esito del prompt di Android/Chrome si salva qui, per sapere com'è andata.
 */

const KEY = 'frigolo:install-nudge'

/** Dopo quanto torna la scheda chiusa */
export const REAPPEAR_AFTER_MS = 3 * 24 * 60 * 60 * 1000
/** Quante volte può ricomparire dopo la prima chiusura */
export const MAX_REAPPEARANCES = 3

export type InstallOutcome = 'accepted' | 'dismissed'

export interface InstallNudgeState {
  /** Quante volte è stata chiusa */
  dismissals: number
  /** Quando è stata chiusa l'ultima volta (ms), 0 se mai */
  lastDismissedAt: number
  /** Ultimo esito del prompt nativo */
  outcome: InstallOutcome | null
  /** L'utente ha installato: non serve più */
  done: boolean
}

const INITIAL: InstallNudgeState = { dismissals: 0, lastDismissedAt: 0, outcome: null, done: false }

/** Funzione pura: la scheda è dovuta adesso? */
export function isInstallNudgeDue(state: InstallNudgeState, now: number): boolean {
  if (state.done) return false
  if (state.dismissals === 0) return true
  if (state.dismissals > MAX_REAPPEARANCES) return false
  return now - state.lastDismissedAt >= REAPPEAR_AFTER_MS
}

let cachedRaw: string | null | undefined
let cachedState: InstallNudgeState = INITIAL
const listeners = new Set<() => void>()

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function parse(raw: string | null): InstallNudgeState {
  if (!raw) return INITIAL
  try {
    const value = JSON.parse(raw) as Partial<InstallNudgeState>
    return {
      dismissals: Number.isFinite(value.dismissals) ? Math.max(0, Number(value.dismissals)) : 0,
      lastDismissedAt: Number.isFinite(value.lastDismissedAt) ? Number(value.lastDismissedAt) : 0,
      outcome: value.outcome === 'accepted' || value.outcome === 'dismissed' ? value.outcome : null,
      done: value.done === true,
    }
  } catch {
    return INITIAL
  }
}

/** Snapshot stabile (stesso oggetto finché lo storage non cambia) */
export function getInstallNudge(): InstallNudgeState {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedState = parse(raw)
  }
  return cachedState
}

export function subscribeInstallNudge(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function write(next: InstallNudgeState) {
  cachedState = next
  try {
    const raw = JSON.stringify(next)
    window.localStorage.setItem(KEY, raw)
    cachedRaw = raw
  } catch {
    // storage non disponibile: vale solo finché l'app resta aperta
    cachedRaw = undefined
  }
  for (const listener of listeners) listener()
}

/** Chiusa con la X (o prompt rifiutato): torna tra 3 giorni */
export function dismissInstallNudge(now = Date.now()) {
  const state = getInstallNudge()
  write({ ...state, dismissals: state.dismissals + 1, lastDismissedAt: now })
}

/** Esito del prompt nativo: se accettato non si chiede più */
export function recordInstallOutcome(outcome: InstallOutcome) {
  const state = getInstallNudge()
  write({ ...state, outcome, done: outcome === 'accepted' ? true : state.done })
}

/** App installata (evento appinstalled) */
export function markInstalled() {
  write({ ...getInstallNudge(), done: true })
}
