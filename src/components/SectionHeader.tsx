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
  as?: 'h1' | 'h2' | 'h3'
}

/** Titolo di sezione in Playfair Display con contatore opzionale */
export function SectionHeader({
  title,
  count,
  collapsible,
  action,
  as: Tag = 'h2',
}: SectionHeaderProps) {
  const heading = (
    <Tag className="font-display text-xl font-bold leading-tight text-primary">{title}</Tag>
  )

  const counter =
    count !== undefined ? (
      <span
        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface px-2 text-xs font-black text-secondary ring-1 ring-subtle"
        aria-label={`${count} articoli`}
      >
        {count}
      </span>
    ) : null

  if (collapsible) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3">
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
    )
  }

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2">
        {heading}
        {counter}
      </div>
      {action}
    </div>
  )
}
