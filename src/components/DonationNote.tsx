import { Coffee } from 'lucide-react'
import { DONATION_SATISPAY_URL, DONATION_URL, it as t } from '@/i18n/it'
import { recordEvent } from '@/lib/telemetry'

/** Marchio PayPal (Simple Icons, CC0) nel blu del marchio */
function PayPalLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#002991"
        d="M7.016 19.198h-4.2a.562.562 0 0 1-.555-.65L5.093.584A.692.692 0 0 1 5.776 0h7.222c3.417 0 5.904 2.488 5.846 5.5-.006.25-.027.5-.066.747A6.794 6.794 0 0 1 12.071 12H8.743a.69.69 0 0 0-.682.583l-.325 2.056-.013.083-.692 4.39-.015.087zM19.79 6.142c-.01.087-.01.175-.023.261a7.76 7.76 0 0 1-7.695 6.598H9.007l-.283 1.795-.013.083-.692 4.39-.134.843-.014.088H6.86l-.497 3.15a.562.562 0 0 0 .555.65h3.612c.34 0 .63-.249.683-.585l.952-6.031a.692.692 0 0 1 .683-.584h2.126a6.793 6.793 0 0 0 6.707-5.752c.306-1.95-.466-3.744-1.89-4.906z"
      />
    </svg>
  )
}

/** Simbolo Satispay (il "biglietto" rosso-arancio, dalla loro pagina di pagamento) */
function SatispayLogo() {
  return (
    <svg viewBox="0 0 224 224" width="18" height="18" aria-hidden="true">
      <path
        fill="#ff3d00"
        d="M16 -0.000488281C7.16344 -0.000488281 0 7.16294 0 15.9995V88.8705C0.00721154 90.5695 0.710111 92.1925 1.94689 93.3632L15.6677 106.353C17.1961 107.845 18.0755 109.937 18.0545 112.05C18.0545 114.205 17.1333 116.276 15.563 117.747L1.96898 130.491C0.719126 131.663 0.0074369 133.294 0 135.004V208C0 216.837 7.16345 224 16 224H208C216.837 224 224 216.837 224 208V135.37C223.993 133.671 223.29 132.048 222.053 130.877L208.332 117.888C206.804 116.396 205.924 114.304 205.945 112.191C205.945 110.036 206.867 107.965 208.437 106.493L222.031 93.75C223.281 92.5779 223.993 90.9459 224 89.2362V15.9995C224 7.16296 216.837 -0.000488281 208 -0.000488281H16Z"
      />
    </svg>
  )
}

const METHODS = [
  { label: 'PayPal', href: DONATION_URL, Logo: PayPalLogo, evento: 'sostegno_1' },
  { label: 'Satispay', href: DONATION_SATISPAY_URL, Logo: SatispayLogo, evento: 'sostegno_2' },
] as const

/** Riga discreta "Offrimi un caffè" con PayPal e Satispay: in fondo alla home e alle impostazioni */
export function DonationNote({ className }: { className?: string }) {
  return (
    <div
      className={['flex flex-col items-center gap-2 text-center', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-xs text-secondary">{t.donation.text}</p>
      <p className="inline-flex items-center gap-2 text-sm font-bold text-accent">
        <Coffee size={16} aria-hidden="true" />
        {t.donation.label}
      </p>
      <div className="flex gap-2">
        {METHODS.map((m) => (
          <a
            key={m.label}
            href={m.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordEvent(m.evento)}
            aria-label={`${t.donation.label} con ${m.label}`}
            className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-full bg-surface pr-5 pl-4 text-sm font-bold text-primary ring-1 ring-subtle transition-transform active:scale-95"
          >
            <m.Logo />
            {m.label}
          </a>
        ))}
      </div>
    </div>
  )
}
