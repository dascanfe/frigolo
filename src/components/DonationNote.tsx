import { Coffee } from 'lucide-react'
import { DONATION_URL, it as t } from '@/i18n/it'

/** Riga discreta "Offrimi un caffè": in fondo alla home e alle impostazioni */
export function DonationNote({ className }: { className?: string }) {
  return (
    <div
      className={['flex flex-col items-center gap-1 text-center', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-xs text-secondary">{t.donation.text}</p>
      <a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-accent active:bg-sand/40"
      >
        <Coffee size={16} aria-hidden="true" />
        {t.donation.label}
      </a>
    </div>
  )
}
