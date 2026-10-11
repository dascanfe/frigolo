import { resizeImageToSquare } from '@/lib/imageResize'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

export class AvatarFileError extends Error {}

/**
 * URL pubblico di una foto a partire dal percorso nel bucket avatars. Nel
 * database c'è solo il percorso: l'host lo decide il client, così nessuno può
 * far caricare agli altri un'immagine da un server suo.
 */
export function avatarPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

/**
 * Carica una foto ridimensionata (256px, webp) nella cartella dell'utente del
 * bucket avatars e ritorna il percorso da salvare nel profilo.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  let blob: Blob
  try {
    blob = await resizeImageToSquare(file, 256)
  } catch {
    throw new AvatarFileError('immagine non leggibile')
  }
  const path = `${userId}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) throw error
  return path
}

/**
 * Toglie dal bucket una foto della propria cartella che non serve più (la
 * precedente dopo un cambio, o una caricata e poi scartata). Gli errori si
 * ignorano: al peggio resta un file orfano che il database ripulisce.
 */
export async function removeAvatarFile(userId: string, path: string | null): Promise<void> {
  if (!path || !path.startsWith(`${userId}/`)) return
  try {
    await supabase.storage.from('avatars').remove([path])
  } catch {
    // niente da fare
  }
}

export interface ProfileInput {
  displayName: string
  color: string
  /** Percorso nel bucket; null = togli la foto (torna la mascotte) */
  avatarPath: string | null
}

/** Salva il profilo (e lo segna come completo) */
export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('update_my_profile', {
    p_display_name: input.displayName.trim(),
    p_color: input.color,
    p_avatar_path: input.avatarPath ?? '',
  })
  if (error) throw error
  return data
}
