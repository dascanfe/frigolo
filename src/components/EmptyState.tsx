import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Stato vuoto: icona grande, titolo in Playfair, testo e azione opzionale */
export function EmptyState({ icon: IconComponent, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-surface text-secondary ring-1 ring-subtle">
        <IconComponent size={32} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="font-display text-2xl font-bold text-primary">{title}</h2>
      {description && <p className="max-w-xs text-sm text-secondary">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
