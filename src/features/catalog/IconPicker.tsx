import { Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { normalize } from '@/features/search/fuzzy'
import { CATEGORY_ICON_SUGGESTIONS, ICON_KEYWORDS, iconLabel } from '@/lib/iconKeywords'
import { ICON_NAMES } from '@/lib/icons'
import type { IconName } from '@/lib/icons'
import type { CategorySlug } from '@/types/domain'
import { CATEGORY_SLUGS } from '@/types/domain'

interface IconPickerProps {
  value: IconName
  onChange: (icon: IconName) => void
  /** Categoria scelta: le sue icone compaiono per prime */
  categorySlug: string | null
}

const MAX_SHOWN = 36

function isCategorySlug(slug: string | null): slug is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(slug ?? '')
}

/** Griglia di icone: suggerite per categoria, oppure cercate per parola chiave */
export function IconPicker({ value, onChange, categorySlug }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()

  const shown = useMemo<IconName[]>(() => {
    const q = normalize(query)
    if (q) {
      const matches = ICON_NAMES.filter((name) => {
        const haystack = normalize(`${name} ${ICON_KEYWORDS[name] ?? ''}`)
        return haystack.includes(q)
      })
      return matches.slice(0, MAX_SHOWN)
    }
    const suggested = isCategorySlug(categorySlug) ? CATEGORY_ICON_SUGGESTIONS[categorySlug] : []
    const rest = ICON_NAMES.filter((n) => !suggested.includes(n))
    return [...suggested, ...rest].slice(0, MAX_SHOWN)
  }, [query, categorySlug])

  // l'icona scelta resta sempre visibile, anche se la ricerca non la include
  const grid = shown.includes(value) ? shown : [value, ...shown]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={searchId} className="text-sm font-bold text-primary">
          Icona
        </label>
        <span className="text-xs text-secondary">{iconLabel(value)}</span>
      </div>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-secondary"
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="search"
          autoComplete="off"
          placeholder="Cerca un'icona (es. formaggio)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-2xl bg-elevated pr-4 pl-10 text-base text-primary ring-1 ring-subtle placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      {grid.length === 0 ? (
        <p className="py-4 text-center text-sm text-secondary">Nessuna icona per "{query}"</p>
      ) : (
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Icona">
          {grid.map((name) => {
            const selected = name === value
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={iconLabel(name)}
                onClick={() => onChange(name)}
                className={[
                  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold ring-1 transition-colors',
                  selected
                    ? 'bg-accent text-cream ring-accent'
                    : 'bg-surface text-secondary ring-subtle active:bg-sand/60',
                ].join(' ')}
              >
                <Icon name={name} size={24} strokeWidth={1.75} aria-hidden="true" />
                <span className="max-w-full truncate">{iconLabel(name)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
