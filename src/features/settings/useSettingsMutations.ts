import { useMutation, useQueryClient } from '@tanstack/react-query'
import { householdQueryKey, useHousehold } from '@/features/auth/useHousehold'
import { itemsQueryKey } from '@/features/catalog/useCatalog'
import { resizeImageToSquare } from '@/lib/imageResize'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/types/domain'

interface ProfilePatch {
  display_name?: string
  color?: string
  avatar_url?: string | null
}

export function useSettingsMutations() {
  const { household, userId } = useHousehold()
  const queryClient = useQueryClient()
  const invalidateHousehold = () =>
    queryClient.invalidateQueries({ queryKey: householdQueryKey(userId) })
  // ['items', hid] e ['items', hid, 'custom-all'] condividono il prefisso
  const invalidateItems = () =>
    queryClient.invalidateQueries({ queryKey: itemsQueryKey(household.id) })

  const renameHousehold = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('households')
        .update({ name: name.trim() })
        .eq('id', household.id)
      if (error) throw error
    },
    onSuccess: invalidateHousehold,
  })

  const updateProfile = useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      const { error } = await supabase
        .from('household_members')
        .update(patch)
        .eq('household_id', household.id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: invalidateHousehold,
  })

  /** Carica una foto ridimensionata su Storage e ritorna l'URL pubblico */
  const uploadAvatar = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const blob = await resizeImageToSquare(file, 256)
      const path = `${userId}/avatar-${Date.now()}.webp`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/webp', upsert: true })
      if (error) throw error
      return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Item> & { id: string }) => {
      const { error } = await supabase.from('items').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateItems,
  })

  return { renameHousehold, updateProfile, uploadAvatar, updateItem }
}
