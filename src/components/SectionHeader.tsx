import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  count?: number
  /** Se definito, l'intestazione diventa un bottone che apre e chiude la sezione */
  collapsible?: {
    open: boolean
    onToggle: () => void
    /** id del contenuto controllato, per aria-controls */
    controls: string
  }
  action?: ReactNode
  /** Una riga sotto il titolo (8px), prima del contenuto */
  description?: ReactNode
  /**
   * Aria sopra il titolo: 'section' (40px, default) tra sezioni, 'block' (24px)
   * dopo un campo o un blocco della stessa sezione, 'none' subito sotto la testata
   */
  lead?: 'section' | 'block' | 'none'
  as?: 'h1' | 'h2' | 'h3'
}

/** Titolo di sezione in Playfair Display con contatore opzionale */
export function SectionHeader({
  title,
  count,
  collapsible,
  action,
  description,
  lead = 'section',
  as: Tag = 'h2',
}: SectionHeaderProps) {
  const heading = (
    <Tag className="font-display text-xl font-bold leading-tight text-primary">{title}</Tag>
  )

  const counter =
    count !== undefined ? (
      <span
        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface px-2 text-xs font-black text-secondary ring-1 ring-subtle"
        aria-label={`${count} prodotti`}
      >
        {count}
      </span>
    ) : null

  const wrapper = [
    'px-4 pb-block',
    lead === 'section' ? 'pt-section' : lead === 'block' ? 'pt-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const descriptionNode = description ? (
    <p className="mt-title text-sm text-secondary">{description}</p>
  ) : null

  if (collapsible) {
    return (
      <div className={wrapper}>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="-ml-2 flex min-h-11 flex-1 items-center gap-2 rounded-xl px-2 text-left"
            aria-expanded={collapsible.open}
            aria-controls={collapsible.controls}
            onClick={collapsible.onToggle}
          >
            {heading}
            {counter}
            <ChevronDown
              size={20}
              className="ml-auto text-secondary transition-transform duration-200"
              style={{ transform: collapsible.open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            />
          </button>
          {action}
        </div>
        {descriptionNode}
      </div>
    )
  }

  return (
    <div className={wrapper}>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {heading}
          {counter}
        </div>
        {action}
      </div>
      {descriptionNode}
    </div>
  )
}
