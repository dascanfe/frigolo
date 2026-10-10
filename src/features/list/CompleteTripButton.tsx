import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { TextField } from '@/components/TextField'
import { toast } from '@/lib/toast'
import { formatQuantity, pluralize } from '@/lib/format'
import type { ListEntryWithItem } from '@/types/domain'
import { useStores } from './useStores'
import { useCompleteTrip } from './useToggleItem'

interface CompleteTripButtonProps {
  cart: ListEntryWithItem[]
  todoCount: number
  /** Supermercato del filtro attivo: proposto come negozio della spesa */
  suggestedStore?: string | null
}

/** Il supermercato comune a tutti i prodotti del carrello che ne hanno uno */
function commonStore(cart: ListEntryWithItem[]): string | null {
  const stores = new Set(cart.map((e) => e.store).filter((s): s is string => Boolean(s)))
  return stores.size === 1 ? ([...stores][0] ?? null) : null
}

/** Durata dell'uscita (attesa della tendina + goccia che sprofonda), vedi global.css */
const LEAVE_MS = 860

/**
 * "Spesa finita": bottone fisso sopra la barra, visibile con almeno un
 * prodotto nel carrello. Al primo prodotto emerge da dietro la barra come una
 * goccia che si gonfia in pillola; aprendo la lista con il carrello già pieno
 * è subito al suo posto, senza animazione.
 */
export function CompleteTripButton({ cart, todoCount, suggestedStore }: CompleteTripButtonProps) {
  const visible = cart.length > 0
  // "static" = già presente al primo render; "enter" = appena comparso
  const [phase, setPhase] = useState<'hidden' | 'static' | 'enter'>(visible ? 'static' : 'hidden')
  const [prevVisible, setPrevVisible] = useState(visible)
  const [lastCount, setLastCount] = useState(cart.length)
  if (visible !== prevVisible) {
    setPrevVisible(visible)
    if (visible) setPhase('enter')
  }
  if (visible && cart.length !== lastCount) setLastCount(cart.length)
  const leaving = !visible && phase !== 'hidden'

  // a fine uscita il bottone si smonta
  useEffect(() => {
    if (!leaving) return
    const timeout = window.setTimeout(() => setPhase('hidden'), LEAVE_MS)
    return () => window.clearTimeout(timeout)
  }, [leaving])

  const [open, setOpen] = useState(false)
  const [store, setStore] = useState('')
  const complete = useCompleteTrip()
  const { stores } = useStores()

  /** Supermercati della lista, prima quelli dei prodotti nel carrello */
  const storeChoices = useMemo(() => {
    const inCart = new Set(cart.map((e) => e.store).filter((s): s is string => Boolean(s)))
    return [...stores.filter((s) => inCart.has(s)), ...stores.filter((s) => !inCart.has(s))]
  }, [cart, stores])

  async function confirm() {
    try {
      await complete.mutateAsync(store.trim() || null)
      setOpen(false)
      setStore('')
      // il messaggio arriva a goccia sparita: comparirebbe proprio sopra l'uscita
      const message = `Spesa finita: ${pluralize(cart.length, 'prodotto', 'prodotti')}`
      window.setTimeout(() => toast(message, 'success'), LEAVE_MS)
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Non sono riuscito a completare la spesa',
        'error',
      )
    }
  }

  return (
    <>
      {phase !== 'hidden' && (
        <div
          className="pointer-events-none fixed inset-x-0 z-20 flex justify-center px-4"
          style={{ bottom: 'calc(var(--nav-offset) + 12px)' }}
        >
          <button
            type="button"
            className="trip-fab pointer-events-auto"
            data-phase={leaving ? 'leave' : phase}
            disabled={leaving}
            aria-label={`Spesa finita, ${pluralize(lastCount, 'prodotto', 'prodotti')} nel carrello`}
            onClick={() => {
              setStore(suggestedStore ?? commonStore(cart) ?? '')
              setOpen(true)
            }}
          >
            {/* fondo liquido: la goccia e la pillola si fondono col filtro "goo" */}
            <span className="trip-fab__goo" aria-hidden="true">
              <span className="trip-fab__blob" />
              <span className="trip-fab__drop" />
            </span>
            <span className="trip-fab__content" aria-hidden="true">
              <span className="trip-fab__label">Spesa finita 🥳</span>
              <span className="trip-fab__badge">{lastCount}</span>
            </span>
          </button>
          <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
            <filter id="trip-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </svg>
        </div>
      )}

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Spesa finita 🥳"
        footer={
          <Button
            fullWidth
            icon={<Check size={18} aria-hidden="true" />}
            onClick={confirm}
            disabled={complete.isPending}
          >
            {complete.isPending
              ? 'Salvo...'
              : `Conferma ${pluralize(cart.length, 'prodotto', 'prodotti')}`}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-secondary">
            I prodotti nel carrello finiscono nello storico degli acquisti.
            {todoCount > 0 &&
              ` ${pluralize(todoCount, 'prodotto resta', 'prodotti restano')} in lista per la prossima volta.`}
          </p>
          <ul className="divide-y divide-subtle rounded-2xl bg-surface ring-1 ring-subtle">
            {cart.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                <Icon
                  name={entry.item.icon}
                  size={20}
                  className="text-secondary"
                  aria-hidden="true"
                />
                <span className="flex-1 font-bold">{entry.item.name}</span>
                <span className="text-sm text-secondary">
                  {formatQuantity(entry.quantity, entry.unit)}
                </span>
              </li>
            ))}
          </ul>
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 text-sm font-bold text-primary">
              Dove hai fatto la spesa?
            </legend>
            {storeChoices.length > 0 && (
              <div className="chip-row -mx-5 px-5" role="group" aria-label="Supermercati">
                {storeChoices.map((name) => {
                  const selected = store === name
                  return (
                    <button
                      key={name}
                      type="button"
                      className="chip h-10 shrink-0 px-4"
                      aria-pressed={selected}
                      onClick={() => setStore(selected ? '' : name)}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            )}
            <TextField
              label="Oppure scrivi il negozio (facoltativo)"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              maxLength={60}
              placeholder="Es. Esselunga"
              autoComplete="off"
            />
          </fieldset>
        </div>
      </BottomSheet>
    </>
  )
}
