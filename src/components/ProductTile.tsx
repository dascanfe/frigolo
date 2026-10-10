import { Check, Leaf, Plus, Sparkles } from 'lucide-react'
import { formatQuantity } from '@/lib/format'
import { Icon } from '@/components/Icon'
import { useLongPress } from '@/lib/useLongPress'

export type TileState = 'idle' | 'active' | 'done'

/** Motivo del suggerimento, mostrato come badge sulle tile idle */
export type TileHint = 'habit' | 'season'

interface ProductTileProps {
  name: string
  /** Nome del componente lucide, come salvato in items.icon */
  icon: string
  state: TileState
  /** Se presente, la tile attiva mostra il badge quantità */
  quantity?: number
  unit?: string | null
  hint?: TileHint
  /** Supermercato scelto, mostrato come pill nella tile */
  store?: string | null
  /** Nota della riga in lista (es. "senza lattosio"), una riga sotto il nome */
  note?: string | null
  onTap?: () => void
  onLongPress?: () => void
  disabled?: boolean
}

const STATE_LABEL: Record<TileState, string> = {
  idle: 'non in lista, tocca per aggiungerlo',
  active: 'in lista, tocca per segnarlo come preso',
  done: 'nel carrello, tocca per rimetterlo in lista',
}

const HINT_LABEL: Record<TileHint, string> = {
  habit: 'suggerito dalle vostre abitudini',
  season: 'di stagione',
}

export function ProductTile({
  name,
  icon,
  state,
  quantity,
  unit,
  hint,
  store,
  note,
  onTap,
  onLongPress,
  disabled = false,
}: ProductTileProps) {
  const handlers = useLongPress({ onTap, onLongPress, disabled })

  const showQuantity = state === 'active' && quantity !== undefined
  const quantityText = showQuantity ? formatQuantity(quantity, unit) : null

  const ariaParts = [name]
  if (quantityText) ariaParts.push(quantityText)
  if (note) ariaParts.push(`nota: ${note}`)
  if (store) ariaParts.push(`da ${store}`)
  ariaParts.push(STATE_LABEL[state])
  if (state === 'idle' && hint) ariaParts.push(HINT_LABEL[hint])
  if (onLongPress) ariaParts.push('tieni premuto per le opzioni')

  return (
    <button
      type="button"
      className={`tile tile--${state}`}
      data-state={state}
      aria-label={ariaParts.join(', ')}
      disabled={disabled}
      {...handlers}
    >
      <Icon name={icon} className="tile__icon" size={28} strokeWidth={1.75} aria-hidden="true" />
      <span className="tile__name">{name}</span>
      {note && <span className="tile__note">{note}</span>}
      {store && <span className="tile__store">{store}</span>}

      {quantityText && <span className="tile__badge">{quantityText}</span>}

      {state === 'done' && (
        <span className="tile__badge">
          <Check size={13} strokeWidth={3} aria-hidden="true" />
        </span>
      )}

      {state === 'idle' && hint === 'habit' && (
        <span className="tile__badge">
          <Sparkles size={13} strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}

      {state === 'idle' && hint === 'season' && (
        <span className="tile__badge">
          <Leaf size={13} strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}
    </button>
  )
}

interface AddTileProps {
  label?: string
  onTap: () => void
}

/** Tile tratteggiata "Aggiungi prodotto", in fondo a ogni categoria del catalogo */
export function AddTile({ label = 'Aggiungi prodotto', onTap }: AddTileProps) {
  return (
    <button
      type="button"
      className="tile tile--idle tile--dashed"
      onClick={onTap}
      aria-label={label}
    >
      <Plus className="tile__icon" size={28} strokeWidth={2} aria-hidden="true" />
      <span className="tile__name">{label}</span>
    </button>
  )
}
