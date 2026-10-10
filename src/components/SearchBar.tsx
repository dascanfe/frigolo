import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import type { FormEvent } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  /** Invio da tastiera */
  onSubmit?: () => void
  placeholder?: string
}

/** Input di ricerca sticky con icona, pulsante per svuotare e invio */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Cerca o aggiungi un prodotto',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="sticky z-10 bg-app/95 px-4 py-2 backdrop-blur-sm"
      style={{ top: 'var(--safe-top)' }}
    >
      <div className="relative">
        <Search
          size={20}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-secondary"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-full bg-elevated pr-12 pl-12 text-base text-primary ring-1 ring-subtle placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            aria-label="Svuota la ricerca"
            className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-secondary"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  )
}
