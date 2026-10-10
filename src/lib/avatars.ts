/** Avatar predefiniti: le due memoji di casa. Le foto custom arrivano in Fase 9. */
export interface AvatarPreset {
  id: string
  label: string
  url: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'a', label: 'Avatar A', url: '/avatars/avatar-a.png' },
  { id: 'b', label: 'Avatar B', url: '/avatars/avatar-b.png' },
]
