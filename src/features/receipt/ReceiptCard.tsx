/**
 * La scheda "Lo scontrino" in cima alle analitiche: un piccolo scontrino
 * d'esempio, la scelta del periodo e "Crea lo scontrino". Il foglio con il
 * disegno vero si carica solo al tocco.
 */
import { Receipt } from 'lucide-react'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { recordVisit } from '@/lib/telemetry'
import { RECEIPT_PERIODS, receiptRange } from './receiptModel'
import type { ReceiptPeriod } from './receiptModel'

const loadSheet = () => import('./ReceiptSheet')
const ReceiptSheet = lazy(loadSheet)

export function ReceiptCard() {
  const [now] = useState(() => new Date())
  const [period, setPeriod] = useState<ReceiptPeriod>('mese')
  const [open, setOpen] = useState(false)
  // resta montato dopo la prima apertura, per l'animazione di chiusura
  const [mounted, setMounted] = useState(false)
  const ranges = useMemo(() => RECEIPT_PERIODS.map((p) => receiptRange(p, now)), [now])
  const range = ranges.find((r) => r.period === period) ?? ranges[0]
  if (!range) return null

  return (
    <section
      className="mx-4 flex gap-4 rounded-3xl bg-surface p-4 shadow-[0_2px_14px_rgb(58_44_33/0.06)] ring-1 ring-subtle"
      aria-labelledby="scontrino-titolo"
    >
      <MiniReceipt stamp={range.stamp} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-col leading-tight">
          <h2 id="scontrino-titolo" className="font-display text-lg font-bold text-primary">
            Lo scontrino
          </h2>
          <span className="text-xs text-secondary">
            La vostra spesa in uno scontrino da mandare in chat o nelle storie
          </span>
        </header>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="Periodo dello scontrino"
        >
          {ranges.map((r) => (
            <button
              key={r.period}
              type="button"
              role="radio"
              aria-checked={period === r.period}
              onClick={() => setPeriod(r.period)}
              className={[
                'h-9 rounded-full px-3 text-[13px] font-bold transition-colors',
                period === r.period
                  ? 'bg-primary text-cream shadow-tile'
                  : 'bg-sand/40 text-secondary ring-1 ring-subtle',
              ].join(' ')}
            >
              {r.short}
            </button>
          ))}
        </div>
        <Button
          className="self-start"
          icon={<Receipt size={18} aria-hidden="true" />}
          onPointerEnter={() => void loadSheet()}
          onPointerDown={() => void loadSheet()}
          onClick={() => {
            recordVisit('scontrino')
            setMounted(true)
            setOpen(true)
          }}
        >
          Crea lo scontrino
        </Button>
      </div>
      {mounted && (
        <Suspense fallback={null}>
          <ReceiptSheet open={open} onClose={() => setOpen(false)} range={range} />
        </Suspense>
      )}
    </section>
  )
}

/** Un piccolo scontrino d'esempio, solo decorativo */
function MiniReceipt({ stamp }: { stamp: string }) {
  return (
    <div aria-hidden="true" className="flex w-[84px] shrink-0 items-start justify-center pt-1">
      <div
        className="w-[78px] -rotate-3 bg-[#fffdf8] px-2 pt-3 pb-4 text-ink shadow-[0_6px_16px_rgb(58_44_33/0.18)]"
        style={{
          clipPath:
            'polygon(0 4px, 6.25% 0, 12.5% 4px, 18.75% 0, 25% 4px, 31.25% 0, 37.5% 4px, 43.75% 0, 50% 4px, 56.25% 0, 62.5% 4px, 68.75% 0, 75% 4px, 81.25% 0, 87.5% 4px, 93.75% 0, 100% 4px, 100% calc(100% - 4px), 93.75% 100%, 87.5% calc(100% - 4px), 81.25% 100%, 75% calc(100% - 4px), 68.75% 100%, 62.5% calc(100% - 4px), 56.25% 100%, 50% calc(100% - 4px), 43.75% 100%, 37.5% calc(100% - 4px), 31.25% 100%, 25% calc(100% - 4px), 18.75% 100%, 12.5% calc(100% - 4px), 6.25% 100%, 0 calc(100% - 4px))',
        }}
      >
        <p className="text-center font-display text-[11px] leading-none font-bold">FRIGOLO</p>
        <p className="mt-1 truncate text-center text-[6px] leading-none font-bold tracking-wide">
          {stamp}
        </p>
        <div className="mt-2 flex flex-col gap-[5px]">
          {[70, 55, 80, 45, 62].map((w) => (
            <div key={w} className="flex items-center gap-1">
              <span className="h-[3px] rounded-full bg-ink/50" style={{ width: `${w * 0.45}%` }} />
              <span className="h-0 flex-1 border-t border-dotted border-ink/35" />
              <span className="h-[3px] w-2 rounded-full bg-ink/50" />
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-dashed border-ink/40 pt-1.5">
          <div className="flex justify-between text-[6px] leading-none font-black">
            <span>TOTALE</span>
            <span>0,00</span>
          </div>
        </div>
        <div className="mx-auto mt-2 grid size-6 grid-cols-3 gap-px">
          {[1, 0, 1, 0, 1, 0, 1, 1, 0].map((on, i) => (
            <span key={i} className={on ? 'bg-ink/80' : 'bg-transparent'} />
          ))}
        </div>
      </div>
    </div>
  )
}
