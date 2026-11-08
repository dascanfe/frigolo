import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { categoryColorVar, categoryIconBgVar, categoryTextColorVar } from '@/lib/colors'

interface ProductGridProps {
  children: ReactNode
  /** Descrizione per screen reader, es. "Da comprare" */
  label?: string
  className?: string
}

/** Griglia 3 colonne su mobile, 4 da 640px, 6 oltre 900px; tile sempre quadrate */
export function ProductGrid({ children, label, className }: ProductGridProps) {
  return (
    <div
      className={['product-grid', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}

interface CategoryDividerProps {
  name: string
  /** Slug della categoria: risolve i token --cat-<slug> e --cat-<slug>-text */
  slug: string
  /** Icona lucide della categoria, in bianco sul cerchio colorato */
  icon?: string
  /** Id dell'elemento: serve a raggiungerlo e a seguirlo con lo scroll */
  id?: string
}

/**
 * Separatore discreto tra categorie dentro la griglia: occupa tutta la riga.
 * Lato 700, maiuscolo, 11px. Il testo usa la variante scurita del colore di
 * categoria (contrasto >= 4.5:1), la linea il colore pieno.
 */
export function CategoryDivider({ name, slug, icon, id }: CategoryDividerProps) {
  return (
    <div
      id={id}
      className="col-span-full flex items-center gap-2 pt-5 first:pt-0"
      role="presentation"
    >
      {icon && (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: categoryIconBgVar(slug) }}
          aria-hidden="true"
        >
          <Icon name={icon} size={13} strokeWidth={2.5} />
        </span>
      )}
      <span
        className="text-[11px] font-bold uppercase tracking-[0.08em]"
        style={{ color: categoryTextColorVar(slug) }}
      >
        {name}
      </span>
      <span
        className="h-px flex-1 opacity-60"
        style={{ backgroundColor: categoryColorVar(slug) }}
        aria-hidden="true"
      />
    </div>
  )
}
