import { createContext, useContext } from 'react'
import type { ListData, ListMember } from '@/features/lists/useLists'
import type { Household, Profile } from '@/types/domain'

/* ---------------------------------------------------------------------------
 * Contesto della lista aperta. Nel codice una lista è ancora un "household":
 * dentro AuthGate ce n'è sempre una, i componenti non gestiscono il caso null.
 * ------------------------------------------------------------------------- */
export interface HouseholdContextValue {
  /** La lista aperta ora */
  household: Household
  /** Le persone della lista aperta, in ordine di ingresso */
  members: ListMember[]
  userId: string
  /** Email dell'account, se Supabase la conosce */
  email: string | undefined
  /** Il profilo dell'utente (uguale in tutte le liste) */
  profile: Profile
  /** L'utente come persona della lista aperta */
  me: ListMember
  /** Le altre persone della lista aperta */
  others: ListMember[]
  /** Tutte le liste dell'utente */
  lists: ListData[]
  /** Apre un'altra lista (la scelta resta sul dispositivo) */
  selectList: (householdId: string) => void
}

export const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function useHousehold(): HouseholdContextValue {
  const value = useContext(HouseholdContext)
  if (!value) {
    throw new Error('useHousehold va usato dentro AuthGate')
  }
  return value
}

/** Nome da mostrare per una persona, con fallback */
export function memberName(
  member: Pick<ListMember, 'display_name'> | undefined,
  fallback = 'Qualcuno',
): string {
  return member?.display_name?.trim() || fallback
}
