import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { Household, HouseholdMember } from '@/types/domain'

export interface HouseholdData {
  household: Household
  members: HouseholdMember[]
}

export const householdQueryKey = (userId: string) => ['household', userId] as const

/**
 * L'household dell'utente con tutti i membri. La RLS restituisce solo
 * l'household di cui si fa parte, quindi basta prendere il primo.
 * null = l'utente non ha ancora un household (onboarding).
 */
export function useHouseholdQuery(userId: string | undefined) {
  return useQuery({
    queryKey: householdQueryKey(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async (): Promise<HouseholdData | null> => {
      const { data, error } = await supabase
        .from('households')
        .select('*, household_members(*)')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const { household_members: members, ...household } = data
      return {
        household,
        members: [...members].sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
      }
    },
  })
}

export function useInvalidateHousehold() {
  const queryClient = useQueryClient()
  return (userId: string) => queryClient.invalidateQueries({ queryKey: householdQueryKey(userId) })
}

/* ---------------------------------------------------------------------------
 * Contesto: dentro AuthGate l'household esiste sempre, i componenti non devono
 * gestire il caso null.
 * ------------------------------------------------------------------------- */
export interface HouseholdContextValue extends HouseholdData {
  userId: string
  /** Email dell'account, se Supabase la conosce */
  email: string | undefined
  /** La riga membro dell'utente corrente */
  me: HouseholdMember
  /** Gli altri membri (in pratica: l'altra persona) */
  others: HouseholdMember[]
}

export const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export function useHousehold(): HouseholdContextValue {
  const value = useContext(HouseholdContext)
  if (!value) {
    throw new Error('useHousehold va usato dentro AuthGate')
  }
  return value
}

/** Nome da mostrare per un membro, con fallback */
export function memberName(member: HouseholdMember | undefined, fallback = 'Qualcuno'): string {
  return member?.display_name?.trim() || fallback
}
