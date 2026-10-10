/**
 * Lista aperta ora: si ricorda sul dispositivo, per utente. Se quella salvata
 * non c'è più (lasciata, eliminata, altro account) si apre la prima per data
 * di ingresso, cioè la più vecchia: per chi arriva dalla versione a lista
 * unica è quella di sempre.
 */

export interface ListRef {
  id: string
  /** Quando l'utente è entrato nella lista (ISO) */
  joinedAt: string
}

export function pickCurrentList(lists: readonly ListRef[], storedId: string | null): string | null {
  if (lists.length === 0) return null
  if (storedId && lists.some((list) => list.id === storedId)) return storedId
  const oldest = [...lists].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0]
  return oldest?.id ?? null
}

const storageKey = (userId: string) => `frigolo:current-list:${userId}`

export function readStoredList(userId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(userId))
  } catch {
    return null
  }
}

export function storeCurrentList(userId: string, listId: string): void {
  try {
    window.localStorage.setItem(storageKey(userId), listId)
  } catch {
    // storage non disponibile: la scelta vale finché l'app resta aperta
  }
}
