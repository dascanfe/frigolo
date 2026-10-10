import { memberColor, onMemberColor } from '@/lib/colors'

interface AvatarProps {
  name: string
  /** Token palette del membro, es. c-teal */
  color?: string | null
  avatarUrl?: string | null
  /** Diametro in px */
  size?: number
  className?: string
}

/** Avatar rotondo: immagine se c'è, altrimenti iniziale sul colore del membro */
export function Avatar({ name, color, avatarUrl, size = 36, className }: AvatarProps) {
  const background = memberColor(color)
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black ring-2',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        backgroundColor: background,
        color: onMemberColor(color),
        // anello nel colore del membro anche quando c'è la foto
        boxShadow: `0 0 0 2px ${background}`,
      }}
      role="img"
      aria-label={name}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        initial
      )}
    </span>
  )
}
