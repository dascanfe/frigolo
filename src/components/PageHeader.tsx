import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { it as t } from '@/i18n/it'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  className?: string
}

/** Altezza (oltre l'area sicura) occupata dalla freccia fissa: le barre appiccicose ripartono da qui */
export const BACK_BAR_OFFSET = '56px'

/**
 * Testata delle pagine che si aprono dalla lista (catalogo, analitiche,
 * impostazioni, ispirazioni). La freccia per tornare alla lista è fissa in
 * alto a sinistra, in un cerchio di vetro, anche scorrendo; sotto ha una
 * sfumatura del colore di fondo così il contenuto non le passa dietro in modo
 * brusco. Il titolo invece scorre con la pagina.
 */
export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={['px-4 pt-3 pb-1', className ?? ''].filter(Boolean).join(' ')}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-20"
        style={{
          height: `calc(var(--safe-top) + ${BACK_BAR_OFFSET})`,
          background: 'linear-gradient(to bottom, var(--bg-app) 65%, transparent)',
        }}
        aria-hidden="true"
      />
      <Link
        to="/"
        aria-label={t.nav.back}
        title={t.nav.back}
        className="glass fixed z-30 flex size-11 items-center justify-center rounded-full text-primary transition-transform active:scale-95"
        style={{
          top: 'calc(var(--safe-top) + 8px)',
          left: 'max(16px, calc(50vw - 496px))',
        }}
      >
        <ArrowLeft size={24} strokeWidth={2.25} aria-hidden="true" />
      </Link>
      <div className="flex items-start gap-1">
        {/* al posto della freccia, che sta fissa: il titolo parte accanto a lei */}
        <span className="size-11 shrink-0" aria-hidden="true" />
        <h1 className="min-w-0 break-words pt-1 font-display text-4xl leading-[1.1] font-bold text-primary">
          {title}
        </h1>
      </div>
      {typeof subtitle === 'string' ? (
        <p className="text-sm text-secondary">{subtitle}</p>
      ) : (
        subtitle
      )}
    </header>
  )
}
