import { useQuery, useQueryClient } from '@tanstack/react-query'
import { it as t } from '@/i18n/it'
import { avatarPublicUrl } from '@/features/profile/profileApi'
import { describeDbError } from '@/lib/dbErrors'
import { supabase } from '@/lib/supabase'
import type { Household, Profile } from '@/types/domain'

/**
 * Una persona della lista: riga di household_members unita al profilo
 * (nome, colore e foto sono unici per utente, uguali in tutte le liste).
 */
export interface ListMember {
  user_id: string
  joined_at: string
  display_name: string
  color: string | null
  avatar_url: string | null
}

export interface ListData {
  household: Household
  /** Persone della lista, in ordine di ingresso */
  members: ListMember[]
}

export const listsQueryKey = (userId: string) => ['lists', userId] as const
export const profileQueryKey = (userId: string) => ['profile', userId] as const

/** Il profilo dell'utente (completed_at null = da completare nell'onboarding) */
export function useProfileQuery(userId: string) {
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return data
    },
  })
}

/** Tutte le liste di cui l'utente fa parte, con le persone e i loro profili */
export function useListsQuery(userId: string) {
  return useQuery({
    queryKey: listsQueryKey(userId),
    queryFn: async (): Promise<ListData[]> => {
      const { data, error } = await supabase
        .from('households')
        .select(
          '*, household_members(user_id, joined_at, profiles(display_name, color, avatar_path))',
        )
      if (error) throw error
      return data.map(({ household_members: rows, ...household }) => ({
        household,
        members: rows
          .map((row) => ({
            user_id: row.user_id,
            joined_at: row.joined_at,
            display_name: row.profiles?.display_name ?? '',
            color: row.profiles?.color ?? null,
            avatar_url: avatarPublicUrl(row.profiles?.avatar_path),
          }))
          .sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
      }))
    },
  })
}

/** Invalida liste e profilo dopo una modifica */
export function useInvalidateLists() {
  const queryClient = useQueryClient()
  return async (userId: string): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: listsQueryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) }),
    ])
  }
}

/** Quando l'utente è entrato in una lista */
export function joinedAt(list: ListData, userId: string): string {
  return list.members.find((m) => m.user_id === userId)?.joined_at ?? list.household.created_at
}

/* ---------------------------------------------------------------------------
 * Chiamate al database. Funzioni semplici (non hook) così le usano sia
 * l'onboarding, che vive fuori dal contesto della lista, sia l'app.
 * ------------------------------------------------------------------------- */

/** Crea una lista con i supermercati generici e ritorna l'id */
export async function createList(rawName: string): Promise<string> {
  const name = rawName.trim() || t.lists.nameDefault
  const { data: id, error } = await supabase.rpc('create_household', { p_name: name })
  if (error) throw error
  // i supermercati di partenza li mette il database (default di stores, 0021)
  return id
}

/** Entra con il codice corto o il token del link; null = codice sbagliato o scaduto */
export async function joinList(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('join_household', { p_code: code })
  if (error) throw error
  return data ?? null
}

export interface InvitePreview {
  name: string
  memberCount: number
  isMember: boolean
}

/** Anteprima di un invito; null = codice che non funziona */
export async function getInvite(code: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc('get_household_invite', { p_code: code })
  if (error) throw error
  const row = data[0]
  if (!row) return null
  return {
    name: row.name,
    memberCount: row.member_count,
    isMember: row.is_member,
  }
}

export async function renameList(householdId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('rename_household', {
    p_household_id: householdId,
    p_name: name.trim(),
  })
  if (error) throw error
}

export async function rotateInviteCode(householdId: string): Promise<void> {
  const { error } = await supabase.rpc('rotate_join_code', { p_household_id: householdId })
  if (error) throw error
}

/** Lascia la lista; true se eri l'ultima persona e la lista è stata eliminata */
export async function leaveList(householdId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('leave_household', { p_household_id: householdId })
  if (error) throw error
  return data
}

export async function deleteList(householdId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_household', { p_household_id: householdId })
  if (error) throw error
}

/** Errori delle RPC di liste e inviti in parole di tutti i giorni */
export function describeListError(error: unknown): string {
  return describeDbError(error, t.lists.actionFailed)
}
