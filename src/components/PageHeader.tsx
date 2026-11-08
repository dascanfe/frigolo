import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { it as t } from '@/i18n/it'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  className?: string
}

/** Distanza dal bordo alto (oltre l'area sicura) del cerchio con la freccia: le barre appiccicose si attaccano alla stessa altezza */
export const STICKY_TOP = 'calc(var(--safe-top) + 14px)'

/**
 * Top di una riga di chip (alte 44px, con 8px di margine sopra) appiccicata in
 * alto: così il centro delle chip coincide con il centro del cerchio della freccia.
 */
export const STICKY_CHIPS_TOP = 'calc(var(--safe-top) + 6px)'

/**
 * Top di una barra con pillola di vetro (alta 50px col bordo, con 8px di margine sopra)
 * appiccicata in alto: il centro della pillola coincide con quello del cerchio.
 */
export const STICKY_PILL_TOP = 'calc(var(--safe-top) + 3px)'

/**
 * Vetro dietro a una barra appiccicosa: quando la barra è attaccata copre anche
 * la fascia sopra (fino al bordo dello schermo), così il contenuto che scorre si
 * vede solo sfocato. Va messo come primo figlio della barra (che è `sticky z-10`).
 */
export function StickyGlass({ visible, top }: { visible: boolean; top: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 -z-10 border-b border-subtle transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        top: `calc(-1 * ${top})`,
        backgroundColor: 'color-mix(in srgb, var(--bg-app) 72%, transparent)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        backdropFilter: 'blur(20px) saturate(1.6)',
      }}
    />
  )
}

/** Spazio a sinistra di una barra appiccicosa attaccata in alto: ci sta il cerchio della freccia */
export const STICKY_LEFT_GAP = 'pl-[62px]'

/**
 * Testata delle pagine che si aprono dalla lista (catalogo, analitiche,
 * impostazioni, ispirazioni). La freccia per tornare alla lista è fissa in
 * alto a sinistra, in un cerchio di vetro, anche scorrendo: galleggia sopra il
 * contenuto, senza fasce. Il titolo scorre con la pagina e a inizio pagina sta
 * accanto al cerchio.
 */
export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={['px-4 pt-3 pb-1', className ?? ''].filter(Boolean).join(' ')}>
      {/* area di tocco 44px, cerchio di vetro visibile 36px: il bordo destro del cerchio sta a 52px */}
      <Link
        to="/"
        aria-label={t.nav.back}
        title={t.nav.back}
        className="group fixed z-30 flex size-11 items-center justify-center"
        style={{
          top: STICKY_TOP,
          left: 'max(12px, calc(50vw - 500px))',
        }}
      >
        <span className="glass flex size-9 items-center justify-center rounded-full text-primary transition-transform group-active:scale-95">
          <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </Link>
      <div className="flex items-start">
        {/* al posto della freccia, che sta fissa: il titolo parte a 10px dal bordo del cerchio */}
        <span className="h-11 w-[46px] shrink-0" aria-hidden="true" />
        <h1 className="min-w-0 break-words pt-1 font-display text-3xl leading-[1.1] sm:text-4xl font-bold text-primary">
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
