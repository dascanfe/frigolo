import { ChefHat, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { it as t } from '@/i18n/it'
import { recordRecipe } from '@/lib/telemetry'
import { slugPiatto } from './illustrazioni'

/** Spazio unificatore tra numero e unità ("500 g", "180 °C"): non vanno a capo separati */
function tieneUnita(testo: string) {
  return testo.replace(/(\d) (?=(?:g|kg|ml|cm|mm|°C)(?![\p{L}]))/gu, '$1 ')
}

interface RecipeStepsProps {
  /** Nome del piatto: dà contesto al bottone per chi usa lo screen reader */
  nome: string
  passi: string[]
}

/**
 * "Come si fa": il procedimento di un piatto, chiuso di default. Il pannello
 * resta nel DOM e si apre in altezza con grid-template-rows (stesso ritmo
 * morbido dell'app); da chiuso è `visibility: hidden`, quindi fuori dal focus
 * e dallo screen reader. I testi arrivano da mesi.ts: funziona anche offline.
 */
export function RecipeSteps({ nome, passi }: RecipeStepsProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="px-4 pt-2">
      <button
        type="button"
        className="-ml-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-accent active:bg-sand/40"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          // metriche anonime: solo l'apertura, con lo slug del piatto
          if (!open) recordRecipe(slugPiatto(nome))
          setOpen(!open)
        }}
      >
        <ChefHat size={16} strokeWidth={2.25} aria-hidden="true" />
        {t.inspiration.howTo}
        <span className="sr-only">: {nome}</span>
        <ChevronDown
          size={18}
          strokeWidth={2.25}
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} className="recipe-steps" data-open={open}>
        <div className="recipe-steps-inner">
          <div className="mt-1 rounded-2xl bg-surface p-4 ring-1 ring-subtle">
            <p className="pb-3 text-xs font-bold tracking-[0.08em] text-secondary uppercase">
              {t.inspiration.servings}
            </p>
            {/* role="list": con list-style none Safari toglierebbe la semantica di elenco */}
            <ol role="list" className="flex flex-col gap-3">
              {passi.map((passo, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-[color:var(--on-accent)]"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-primary">
                    {tieneUnita(passo)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
