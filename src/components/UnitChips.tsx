import { UNITS } from '@/types/domain'
import type { Unit } from '@/types/domain'

interface UnitChipsProps {
  value: Unit
  onChange: (unit: Unit) => void
  label?: string
}

/** Selettore unità come chip: pz, kg, g, l, ml, conf */
export function UnitChips({ value, onChange, label = 'Unità' }: UnitChipsProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-bold text-primary">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {UNITS.map((unit) => (
          <button
            key={unit}
            type="button"
            role="radio"
            aria-checked={value === unit}
            onClick={() => onChange(unit)}
            className={[
              'chip h-10 px-4',
              value === unit ? 'bg-primary text-cream ring-primary' : '',
            ].join(' ')}
            style={value === unit ? { borderColor: 'var(--text-primary)' } : undefined}
          >
            {unit}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
