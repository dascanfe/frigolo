/**
 * Invito discreto a condividere la lista, una volta sola: nasce al primo
 * prodotto di chi parte da zero (lista vuota, nessuna spesa) e sparisce
 * appena viene chiuso o aperto. Store minimale per useSyncExternalStore.
 */

const KEY = 'frigolo:share-nudge'
type NudgeState = 'pending' | 'done'

const listeners = new Set<() => void>()

function read(): NudgeState | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'pending' || value === 'done' ? value : null
  } catch {
    return null
  }
}

function write(value: NudgeState) {
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // storage non disponibile: l'invito vale solo finché non lo si chiude
  }
  for (const listener of listeners) listener()
}

/** Al primo prodotto di chi parte da zero: da ora l'invito può comparire */
export function armShareNudge() {
  if (read() === null) write('pending')
}

/** Chiuso o usato: non torna più */
export function dismissShareNudge() {
  if (read() !== 'done') write('done')
}

export function isShareNudgePending(): boolean {
  return read() === 'pending'
}

export function subscribeShareNudge(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
