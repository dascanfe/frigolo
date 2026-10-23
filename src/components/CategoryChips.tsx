import { useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import { categoryIconBgVar } from '@/lib/colors'

export interface ChipCategory {
  slug: string
  name: string
  icon: string
}

interface CategoryChipsProps {
  categories: ChipCategory[]
  /** slug selezionato, null = tutte */
  selected: string | null
  onSelect: (slug: string | null) => void
  /** Se presente, aggiunge in testa la chip "tutte" con questa etichetta */
  allLabel?: string
  /** Toccare la chip già attiva la deseleziona (default). Con false resta attiva: serve a navigare */
  toggle?: boolean
  /** Tiene in vista la chip attiva scorrendo la riga in orizzontale */
  followSelected?: boolean
}

/** Chip orizzontali scrollabili per filtrare per categoria */
export function CategoryChips({
  categories,
  selected,
  onSelect,
  allLabel,
  toggle = true,
  followSelected = false,
}: CategoryChipsProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!followSelected) return
    const row = rowRef.current
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !active) return
    // scorre solo la riga (scrollIntoView muoverebbe anche la pagina)
    const target = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    row.scrollTo({ left: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' })
  }, [selected, followSelected])

  return (
    <div
      ref={rowRef}
      className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-2"
      role="group"
      aria-label="Filtra per categoria"
    >
      {allLabel && (
        <button
          type="button"
          className="chip pl-3"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
        >
          {allLabel}
        </button>
      )}
      {categories.map((category) => {
        const pressed = selected === category.slug
        return (
          <button
            key={category.slug}
            type="button"
            className="chip"
            aria-pressed={pressed}
            onClick={() => onSelect(pressed && toggle ? null : category.slug)}
            style={{ '--chip-color': categoryIconBgVar(category.slug) } as React.CSSProperties}
          >
            <span className="chip__icon">
              <Icon name={category.icon} size={16} strokeWidth={2.25} aria-hidden="true" />
            </span>
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
