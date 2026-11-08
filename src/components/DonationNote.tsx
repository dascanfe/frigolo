import { Coffee } from 'lucide-react'
import { DONATION_SATISPAY_URL, DONATION_URL, it as t } from '@/i18n/it'

const METHODS = [
  { label: 'PayPal', href: DONATION_URL },
  { label: 'Satispay', href: DONATION_SATISPAY_URL },
]

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
            aria-label={`${t.donation.label} con ${m.label}`}
            className="inline-flex h-11 min-w-28 items-center justify-center rounded-full bg-surface px-5 text-sm font-bold text-primary ring-1 ring-subtle transition-transform active:scale-95"
          >
            {m.label}
          </a>
        ))}
      </div>
    </div>
  )
}
