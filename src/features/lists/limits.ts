/**
 * Limiti decisi da Daniele (docs/DECISIONI.md): 2 liste per utente e 5
 * persone per lista. Il database li fa rispettare comunque
 * (max_households_per_user, max_members_per_household); qui servono a
 * spiegarli prima, invece di mostrare un errore dopo.
 */
export const MAX_LISTS_PER_USER = 2
export const MAX_PEOPLE_PER_LIST = 5

/** Si può creare una lista nuova o entrare in un'altra? */
export function canAddList(listCount: number): boolean {
  return listCount < MAX_LISTS_PER_USER
}

/** La lista ha ancora posto per qualcuno? */
export function hasRoomForPeople(peopleCount: number): boolean {
  return peopleCount < MAX_PEOPLE_PER_LIST
}
