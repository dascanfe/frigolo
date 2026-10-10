import { Apple, Check, Milk } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { THEMES, getTheme, setTheme, subscribeTheme, tileColors } from '@/lib/theme'

/**
 * Scelta del tema: ogni card è un'anteprima in miniatura con i colori veri
 * del tema (tile da comprare, nel carrello, non in lista). Applicato all'istante.
 */
export function ThemePicker() {
  const current = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  return (
    <div className="grid grid-cols-3 gap-2 px-4" role="radiogroup" aria-label="Tema">
      {THEMES.map((theme) => {
        const selected = theme.id === current
        const { palette } = theme
        const tiles = tileColors(palette)
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(theme.id)}
            className={[
              'flex flex-col gap-2 rounded-2xl p-2 text-left transition-[transform,box-shadow] active:scale-[0.97]',
              selected ? 'ring-2 ring-primary' : 'ring-1 ring-subtle',
            ].join(' ')}
            style={{ backgroundColor: palette.bg }}
          >
            <span className="grid grid-cols-3 gap-1" aria-hidden="true">
              <span
                className="flex aspect-square items-center justify-center rounded-lg"
                style={{ backgroundColor: tiles.active, color: palette.cream }}
              >
                <Apple size={14} strokeWidth={2.25} />
              </span>
              <span
                className="flex aspect-square items-center justify-center rounded-lg"
                style={{ backgroundColor: tiles.done, color: palette.cream }}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span
                className="flex aspect-square items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: palette.cream,
                  borderColor: palette.sand,
                  color: palette.inkSoft,
                }}
              >
                <Milk size={14} strokeWidth={2.25} />
              </span>
            </span>
            <span className="flex items-center justify-between gap-1 px-0.5">
              <span className="truncate text-xs font-bold" style={{ color: palette.ink }}>
                {theme.name}
              </span>
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded-full"
                style={
                  selected
                    ? { backgroundColor: palette.brick, color: palette.cream }
                    : { boxShadow: `inset 0 0 0 1.5px ${palette.sand}` }
                }
                aria-hidden="true"
              >
                {selected && <Check size={10} strokeWidth={3.5} />}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
