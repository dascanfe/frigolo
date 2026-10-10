import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
  error?: string | null
}

/** Campo di testo con etichetta, suggerimento ed errore */
export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-primary">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
        }
        aria-invalid={error ? true : undefined}
        className={[
          'h-12 w-full rounded-2xl bg-elevated px-4 text-base text-primary ring-1 ring-subtle placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent',
          error ? 'ring-2 ring-rust' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
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
