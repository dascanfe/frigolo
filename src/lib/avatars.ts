/** Avatar predefiniti: le due memoji di casa. Le foto custom arrivano in Fase 9. */
export interface AvatarPreset {
  id: string
  label: string
  url: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'lele', label: 'Lele', url: '/avatars/lele.png' },
  { id: 'pipi', label: 'Pipi', url: '/avatars/pipi.png' },
]
