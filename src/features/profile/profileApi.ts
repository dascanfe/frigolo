import { resizeImageToSquare } from '@/lib/imageResize'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

export class AvatarFileError extends Error {}

/**
 * Carica una foto ridimensionata (256px, webp) nella cartella dell'utente del
 * bucket avatars e ritorna l'URL pubblico. Il database accetta solo foto
 * della propria cartella (niente URL esterni).
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  let blob: Blob
  try {
    blob = await resizeImageToSquare(file, 256)
  } catch {
    throw new AvatarFileError('immagine non leggibile')
  }
  const path = `${userId}/avatar-${Date.now()}.webp`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export interface ProfileInput {
  displayName: string
  color: string
  /** null = togli la foto */
  avatarUrl: string | null
}

/** Salva il profilo (e lo segna come completo) */
export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('update_my_profile', {
    p_display_name: input.displayName.trim(),
    p_color: input.color,
    p_avatar_url: input.avatarUrl ?? '',
  })
  if (error) throw error
  return data
}
