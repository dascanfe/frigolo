import { ChevronDown, Pencil, Store, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { formatQuantity } from '@/lib/format'
import { toast } from '@/lib/toast'
import type { TripRow } from './useAnalytics'
import { useTripEdits } from './useTripEdits'

interface TripsListProps {
  trips: TripRow[]
  /** Data di riferimento per il mese corrente, passata dal genitore */
  now: Date
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })

/** Tutte le spese, divise per mese: aperto solo il mese corrente */
export function TripsList({ trips, now }: TripsListProps) {
  const { removePurchase, removeTrip } = useTripEdits()
  /** Spesa in modifica e spesa in attesa di conferma eliminazione */
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fail = (error: unknown) =>
    toast(error instanceof Error ? error.message : 'Modifica non riuscita', 'error')

  const months = groupByMonth(trips, now)

  const renderTrip = (trip: TripRow) => {
    const when = trip.completed_at ? new Date(trip.completed_at) : new Date(trip.started_at)
    const count = trip.purchases.length
    const isEditing = editing === trip.id
    return (
      <li key={trip.id}>
        <details className="group rounded-2xl bg-app/70 ring-1 ring-subtle">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-sm font-bold text-primary capitalize">
                {dateFormatter.format(when)}
                <span className="font-normal text-secondary">
                  {' '}
                  alle {timeFormatter.format(when)}
                </span>
              </span>
              <span className="flex items-center gap-1 text-xs text-secondary">
                {trip.store && (
                  <>
                    <Store size={12} aria-hidden="true" />
                    {trip.store}
                    <span aria-hidden="true">&middot;</span>
                  </>
                )}
                {count} {count === 1 ? 'prodotto' : 'prodotti'}
                {trip.completed_by === null && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    salvata da sola
                  </>
                )}
              </span>
            </div>
            <ChevronDown
              size={18}
              className="text-secondary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ul className="flex flex-wrap gap-1.5 px-3 pb-3">
            {trip.purchases.map((purchase) => (
              <li
                key={purchase.id}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full bg-surface py-1 text-xs font-bold text-primary ring-1 ring-subtle',
                  isEditing ? 'pr-1 pl-2.5' : 'px-2.5',
                ].join(' ')}
              >
                <Icon
                  name={purchase.items?.icon}
                  size={13}
                  className="text-secondary"
                  aria-hidden="true"
                />
                {purchase.items?.name ?? 'Prodotto'}
                {(purchase.quantity !== 1 || (purchase.unit && purchase.unit !== 'pz')) && (
                  <span className="text-secondary">
                    {formatQuantity(purchase.quantity, purchase.unit)}
                  </span>
                )}
                {isEditing && (
                  <button
                    type="button"
                    className="-my-1 flex size-7 items-center justify-center rounded-full text-rust active:bg-rust/10"
                    aria-label={`Togli ${purchase.items?.name ?? 'il prodotto'} da questa spesa`}
                    disabled={removePurchase.isPending}
                    onClick={() =>
                      removePurchase.mutate(
                        {
                          purchaseId: purchase.id,
                          tripId: trip.id,
                          // l'ultimo prodotto si porta via la spesa intera
                          last: trip.purchases.length === 1,
                        },
                        { onError: fail },
                      )
                    }
                  >
                    <X size={14} strokeWidth={3} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-2 px-3 pb-3">
            {isEditing && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-rust ring-1 ring-rust/40 active:bg-rust/10"
                disabled={removeTrip.isPending}
                onClick={() => {
                  if (confirmDelete !== trip.id) {
                    setConfirmDelete(trip.id)
                    return
                  }
                  removeTrip.mutate(trip.id, {
                    onSuccess: () => toast('Spesa eliminata', 'success'),
                    onError: fail,
                  })
                  setConfirmDelete(null)
                  setEditing(null)
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
                {confirmDelete === trip.id ? 'Tocca ancora per eliminarla' : 'Elimina spesa'}
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-bold text-primary ring-1 ring-subtle active:bg-sand/50"
              aria-pressed={isEditing}
              onClick={() => {
                setEditing(isEditing ? null : trip.id)
                setConfirmDelete(null)
              }}
            >
              {isEditing ? (
                'Fatto'
              ) : (
                <>
                  <Pencil size={13} aria-hidden="true" />
                  Correggi
                </>
              )}
            </button>
          </div>
        </details>
      </li>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {months.map((month) => {
        const articles = month.trips.reduce((sum, t) => sum + t.purchases.length, 0)
        return (
          <li key={month.key}>
            {/* solo il mese corrente parte aperto */}
            <details className="group/month" open={month.current}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-1 py-1 [&::-webkit-details-marker]:hidden">
                <span className="flex-1 text-[15px] font-black text-primary capitalize">
                  {monthFormatter.format(month.date)}
                </span>
                <span className="text-xs text-secondary">
                  {month.trips.length === 0
                    ? 'nessuna spesa'
                    : `${month.trips.length} ${month.trips.length === 1 ? 'spesa' : 'spese'} · ${articles} ${articles === 1 ? 'prodotto' : 'prodotti'}`}
                </span>
                <ChevronDown
                  size={18}
                  className="text-secondary transition-transform group-open/month:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              {month.trips.length === 0 ? (
                <p className="px-1 pb-2 text-sm text-secondary">
                  Ancora nessuna spesa questo mese.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 pb-2">{month.trips.map(renderTrip)}</ul>
              )}
            </details>
          </li>
        )
      })}
    </ul>
  )
}

interface MonthGroup {
  key: string
  date: Date
  current: boolean
  trips: TripRow[]
}

function tripDate(trip: TripRow): Date {
  return new Date(trip.completed_at ?? trip.started_at)
}

/**
 * Spese raggruppate per mese (dal più recente). Il mese corrente c'è sempre,
 * anche vuoto, così si vede subito che questo mese non ci sono ancora spese.
 */
function groupByMonth(trips: TripRow[], now: Date): MonthGroup[] {
  const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const currentKey = keyOf(now)
  const groups = new Map<string, MonthGroup>([
    [
      currentKey,
      {
        key: currentKey,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        current: true,
        trips: [],
      },
    ],
  ])
  for (const trip of trips) {
    const date = tripDate(trip)
    const key = keyOf(date)
    const group = groups.get(key)
    if (group) group.trips.push(trip)
    else
      groups.set(key, {
        key,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        current: false,
        trips: [trip],
      })
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
}
