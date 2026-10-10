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
}

/** Chip orizzontali scrollabili per filtrare per categoria */
export function CategoryChips({ categories, selected, onSelect, allLabel }: CategoryChipsProps) {
  return (
    <div
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
            onClick={() => onSelect(pressed ? null : category.slug)}
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
