import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string
  hint?: string
  error?: string | null
}

/** Campo password con bottone mostra/nascondi (target 44px) */
export function PasswordField({ label, hint, error, className, ...rest }: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-describedby={
            [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={error ? true : undefined}
          className={[
            'h-12 w-full rounded-2xl bg-elevated pr-12 pl-4 text-base text-primary ring-1 ring-subtle placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent',
            error ? 'ring-2 ring-rust' : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Nascondi password' : 'Mostra password'}
          aria-pressed={visible}
          className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-secondary"
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-bold text-rust" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
