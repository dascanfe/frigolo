/**
 * Suggerimenti al primo uso (testi-onboarding.md, punto 8): uno per volta,
 * solo la prima volta, chiusi con "Ok". Quelli già visti restano sul
 * dispositivo. Store minimale per useSyncExternalStore.
 */

export const TIP_IDS = ['added', 'create', 'cart', 'finish', 'firstTrip'] as const
export type TipId = (typeof TIP_IDS)[number]

const SEEN_KEY = 'frigolo:tips-seen'
/** Primo prodotto aggiunto: da lì in poi si può proporre l'installazione */
const FIRST_ADD_KEY = 'frigolo:first-add'

let queue: TipId[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function writeSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    // storage non disponibile: i suggerimenti valgono solo per questa visita
  }
}

/** Mette in coda un suggerimento, se non è mai stato visto */
export function triggerTip(id: TipId) {
  if (queue.includes(id) || readSeen().has(id)) return
  queue = [...queue, id]
  emit()
}

/** "Ok": il suggerimento non torna più e compare il prossimo in coda */
export function dismissTip(id: TipId) {
  const seen = readSeen()
  seen.add(id)
  writeSeen(seen)
  queue = queue.filter((tip) => tip !== id)
  emit()
}

export function getCurrentTip(): TipId | null {
  return queue[0] ?? null
}

export function subscribeTips(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function markFirstAdd() {
  try {
    if (window.localStorage.getItem(FIRST_ADD_KEY)) return
    window.localStorage.setItem(FIRST_ADD_KEY, '1')
  } catch {
    // niente da fare
  }
  emit()
}

export function hasAddedFirstProduct(): boolean {
  try {
    return window.localStorage.getItem(FIRST_ADD_KEY) === '1'
  } catch {
    return false
  }
}

/** Solo per i test */
export function resetTipsForTests() {
  queue = []
}
