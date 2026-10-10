import { memberColor } from '@/lib/colors'

/** Avatar predefinito: la mascotte su sfondo trasparente (scripts/generate-mascot-avatar.mjs) */
export const MASCOT_AVATAR_URL = '/mascot-avatar.webp'

interface AvatarProps {
  /** Nome della persona, per gli screen reader */
  name: string
  /** Token palette del profilo, es. c-teal: è lo sfondo del cerchio */
  color?: string | null
  /** Foto caricata dalla persona; senza foto si vede la mascotte sul suo colore */
  avatarUrl?: string | null
  /** Diametro in px */
  size?: number
  className?: string
}

/** Avatar rotondo: la foto se c'è, altrimenti la mascotte di Frigolo sul colore della persona */
export function Avatar({ name, color, avatarUrl, size = 36, className }: AvatarProps) {
  const background = memberColor(color)
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: size,
        height: size,
        backgroundColor: background,
        // anello nel colore della persona anche quando c'è la foto
        boxShadow: `0 0 0 2px ${background}`,
      }}
      role="img"
      aria-label={name}
    >
      <img
        src={avatarUrl || MASCOT_AVATAR_URL}
        alt=""
        className="size-full object-cover"
        draggable={false}
      />
    </span>
  )
}
