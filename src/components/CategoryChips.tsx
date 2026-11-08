import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  /** Classi in più per la riga che scorre (di default i margini laterali sono px-4) */
  rowClassName?: string
}

/** Chip orizzontali scrollabili per filtrare per categoria */
export function CategoryChips({
  categories,
  selected,
  onSelect,
  allLabel,
  toggle = true,
  followSelected = false,
  rowClassName = 'px-4',
}: CategoryChipsProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  /** Pill scura che scivola sotto la chip attiva (null = nessuna attiva) */
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  /** La prima volta la pill compare già al suo posto, senza scivolare da sinistra */
  const [pillReady, setPillReady] = useState(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      const active = row.querySelector<HTMLElement>('[aria-pressed="true"]')
      const next = active ? { x: active.offsetLeft, w: active.offsetWidth } : null
      // aggiorna solo se cambia davvero (evita giri di render inutili)
      setPill((prev) => (prev?.x === next?.x && prev?.w === next?.w ? prev : next))
    }
    measure()
    // le larghezze cambiano quando arriva il font o cambia la finestra
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const chip of row.children) observer.observe(chip)
    return () => observer.disconnect()
  }, [selected, categories, allLabel])

  useEffect(() => {
    if (!pill || pillReady) return
    const frame = window.requestAnimationFrame(() => setPillReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [pill, pillReady])

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
      className={`chips-pill scrollbar-none relative flex gap-2 overflow-x-auto py-2 transition-[padding] duration-300 ease-(--ease-organic) ${rowClassName}`}
      role="group"
      aria-label="Filtra per categoria"
    >
      <span
        aria-hidden="true"
        className={`chips-pill__indicator ${pillReady ? 'chips-pill__indicator--ready' : ''}`}
        style={{
          width: pill?.w ?? 0,
          transform: `translateX(${pill?.x ?? 0}px)`,
          opacity: pill ? 1 : 0,
        }}
      />
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
