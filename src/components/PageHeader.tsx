import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { it as t } from '@/i18n/it'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  className?: string
}

/**
 * Testata delle pagine che si aprono dalla lista (catalogo, analitiche,
 * impostazioni, ispirazioni): freccia per tornare alla lista in alto a
 * sinistra, poi il titolo. Non c'è più una barra di navigazione in basso.
 */
export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={['px-4 pt-3 pb-1', className ?? ''].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-1">
        <Link
          to="/"
          aria-label={t.nav.back}
          title={t.nav.back}
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-primary active:bg-sand/40"
        >
          <ArrowLeft size={26} strokeWidth={2.25} aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 truncate font-display text-4xl font-bold text-primary">{title}</h1>
      </div>
      {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
    </header>
  )
}
