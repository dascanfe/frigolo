import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Icona a sinistra del testo */
  icon?: ReactNode
  fullWidth?: boolean
}

const BASE_CLASS =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold transition-[transform,filter,background-color] duration-100 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-accent text-cream shadow-tile active:brightness-95',
  secondary: 'bg-surface text-primary ring-1 ring-subtle active:bg-sand/50',
  ghost: 'bg-transparent text-secondary active:bg-sand/40',
  danger: 'bg-transparent text-rust ring-1 ring-rust/40 active:bg-rust/10',
}

/** Bottone di base: altezza 48px, pieno arrotondato, tre varianti */
export function Button({
  variant = 'primary',
  icon,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[BASE_CLASS, VARIANT_CLASS[variant], fullWidth ? 'w-full' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

interface LinkButtonProps {
  to: string
  variant?: Variant
  icon?: ReactNode
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

/** Link di navigazione con l'aspetto di un bottone (un link dentro un button non è HTML valido) */
export function LinkButton({
  to,
  variant = 'primary',
  icon,
  fullWidth = false,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={[BASE_CLASS, VARIANT_CLASS[variant], fullWidth ? 'w-full' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
      {children}
    </Link>
  )
}
