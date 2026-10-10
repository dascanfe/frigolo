import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { signOut } from '@/features/auth/useSession'
import { it as t } from '@/i18n/it'

interface OnboardingLayoutProps {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  /** Mascotte in alto (schermate di inizio e fine percorso) */
  mascot?: boolean
  children: ReactNode
  /** "Esci" in fondo: chi ha sbagliato account può tornare all'accesso */
  showSignOut?: boolean
}

/** Impaginazione comune delle schermate dell'onboarding, a una colonna */
export function OnboardingLayout({
  eyebrow,
  title,
  subtitle,
  mascot = false,
  children,
  showSignOut = true,
}: OnboardingLayoutProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pt-safe pb-safe">
      <header className="flex flex-col gap-1 pt-8">
        {mascot && (
          <img
            src="/mascot.png"
            alt=""
            width={80}
            height={80}
            className="mb-2 size-20 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
            draggable={false}
          />
        )}
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-secondary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="text-secondary">{subtitle}</p>}
      </header>

      {children}

      {showSignOut && (
        <div className="mt-auto flex justify-center pb-4">
          <Button
            variant="ghost"
            icon={<LogOut size={18} aria-hidden="true" />}
            onClick={() => void signOut()}
          >
            {t.common.signOut}
          </Button>
        </div>
      )}
    </main>
  )
}
