import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { UNIT_STEPS, isUnit } from '@/types/domain'
import { formatQuantity, parseQuantity } from './quantity'

interface QuantityStepperProps {
  value: number
  unit: string | null | undefined
  onChange: (value: number) => void
  label?: string
}

function roundTo(value: number, step: number): number {
  const decimals = step < 1 ? (String(step).split('.')[1]?.length ?? 1) : 0
  return Number(value.toFixed(decimals))
}

/** Meno / valore modificabile / più, con passo adatto all'unità */
export function QuantityStepper({
  value,
  unit,
  onChange,
  label = 'Quantità',
}: QuantityStepperProps) {
  const id = useId()
  const step = isUnit(unit) ? UNIT_STEPS[unit] : 1
  const min = step
  // Testo che si sta scrivendo: può restare vuoto o a metà ("1,") finché il
  // campo ha il focus, senza che il numero di prima ricompaia.
  const [bozza, setBozza] = useState<string | null>(null)

  const set = (next: number) => {
    setBozza(null)
    onChange(Math.max(min, roundTo(next, step)))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-primary">
        {label}
      </label>
      <div className="flex h-12 items-stretch overflow-hidden rounded-2xl bg-elevated ring-1 ring-subtle">
        <button
          type="button"
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label="Diminuisci"
          className="flex w-14 items-center justify-center text-primary disabled:opacity-30"
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={bozza ?? formatQuantity(value)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const testo = e.target.value
            setBozza(testo)
            const parsed = parseQuantity(testo)
            if (parsed !== null) onChange(parsed)
          }}
          onBlur={() => {
            // campo lasciato vuoto o non valido: torna l'ultima quantità buona
            if (bozza !== null && parseQuantity(bozza) === null) onChange(Math.max(min, value))
            setBozza(null)
          }}
          className="w-full min-w-0 flex-1 border-x border-subtle bg-transparent text-center text-lg font-black text-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => set(value + step)}
          aria-label="Aumenta"
          className="flex w-14 items-center justify-center text-primary"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
