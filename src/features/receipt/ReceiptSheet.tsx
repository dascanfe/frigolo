/**
 * Il foglio dello scontrino: anteprima grande, "Mostra i nomi" e "Condividi".
 * Si carica solo quando si apre (carattere monospazio, codice QR e disegno
 * stanno in questo pezzo dell'app). L'immagine si crea sul telefono.
 */
import { Download, Share2 } from 'lucide-react'
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { memberName, useHousehold } from '@/features/auth/useHousehold'
import { useCatalog } from '@/features/catalog/useCatalog'
import { recordEvent } from '@/lib/telemetry'
import { THEMES, getTheme, subscribeTheme } from '@/lib/theme'
import { toast } from '@/lib/toast'
import { canvasToPng, drawReceipt, loadMascot, loadReceiptFonts } from './drawReceipt'
import { buildReceipt, receiptAltText, receiptFileName, receiptShareText } from './receiptModel'
import type { ReceiptRange } from './receiptModel'
import { useReceiptTrips } from './useReceiptData'

interface ReceiptSheetProps {
  open: boolean
  onClose: () => void
  range: ReceiptRange
}

interface Rendered {
  blob: Blob
  url: string
}

/** Condivisione di file supportata (Safari iOS, Chrome Android): altrimenti si scarica */
function canShareFiles(): boolean {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'prova.png', {
      type: 'image/png',
    })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export default function ReceiptSheet({ open, onClose, range }: ReceiptSheetProps) {
  const { household, members } = useHousehold()
  const catalog = useCatalog()
  const trips = useReceiptTrips(range)
  const themeId = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  const [showNames, setShowNames] = useState(true)
  // colore dello sfondo: parte dal tema dell'app, si può cambiare solo per lo scontrino
  const [bgChoice, setBgChoice] = useState<string | null>(null)
  const bgTheme = bgChoice ?? themeId
  const [rendered, setRendered] = useState<Rendered | null>(null)
  const [failed, setFailed] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareFiles] = useState(canShareFiles)
  const switchId = useId()
  const together = members.length >= 2

  const model = useMemo(() => {
    if (!trips.data || catalog.isPending) return null
    return buildReceipt({
      listName: household.name,
      range,
      trips: trips.data,
      people: members.map((m) => ({ user_id: m.user_id, name: memberName(m, '') })),
      seasonMonths: (id) => catalog.itemById.get(id)?.season_months,
      showNames,
    })
  }, [trips.data, catalog.isPending, catalog.itemById, household.name, range, members, showNames])

  // Disegno: caratteri e mascotte prima, poi il canvas e il PNG
  useEffect(() => {
    if (!model) return
    let cancelled = false
    const palette = (THEMES.find((t) => t.id === bgTheme) ?? THEMES[0])?.palette
    if (!palette) return
    void (async () => {
      try {
        const [, mascot] = await Promise.all([loadReceiptFonts(), loadMascot()])
        if (cancelled) return
        const canvas = drawReceipt({ model, palette, mascot })
        const blob = await canvasToPng(canvas)
        if (cancelled) return
        setRendered({ blob, url: URL.createObjectURL(blob) })
        setFailed(false)
        recordEvent('scontrino_creato')
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [model, bgTheme])

  // l'indirizzo dell'immagine precedente si libera quando arriva la nuova
  useEffect(() => {
    if (!rendered) return
    return () => URL.revokeObjectURL(rendered.url)
  }, [rendered])

  async function share() {
    if (!rendered) return
    const name = receiptFileName(range)
    setSharing(true)
    try {
      if (shareFiles) {
        const file = new File([rendered.blob], name, { type: 'image/png' })
        try {
          await navigator.share({ files: [file], text: receiptShareText(range) })
          recordEvent('scontrino_condiviso')
          return
        } catch (error) {
          // chiusa senza scegliere: va bene così
          if (error instanceof DOMException && error.name === 'AbortError') return
        }
      }
      download(rendered.blob, name)
      recordEvent('scontrino_condiviso')
      toast('Scontrino salvato tra i download', 'success')
    } finally {
      setSharing(false)
    }
  }

  const title =
    range.kind === 'anno'
      ? `Lo scontrino del ${range.stamp}`
      : `Lo scontrino di ${range.short.toLowerCase()}`
  const error = trips.isError || failed

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2.5 ring-1 ring-subtle">
            <span id={`${switchId}-sfondo`} className="text-[15px] font-bold text-primary">
              Sfondo
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`${switchId}-sfondo`}
              className="flex flex-wrap justify-end gap-2"
            >
              {THEMES.map((t) => {
                const scelto = bgTheme === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={scelto}
                    aria-label={t.name}
                    title={t.name}
                    onClick={() => setBgChoice(t.id)}
                    style={{ backgroundColor: t.palette.burnt }}
                    className={[
                      'size-8 rounded-full ring-offset-2 ring-offset-surface transition-transform active:scale-90',
                      scelto ? 'ring-2 ring-primary' : 'ring-1 ring-subtle',
                    ].join(' ')}
                  />
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2.5 ring-1 ring-subtle">
            <label htmlFor={switchId} className="flex flex-col leading-tight">
              <span id={`${switchId}-nome`} className="text-[15px] font-bold text-primary">
                Mostra i nomi
              </span>
              <span id={`${switchId}-nota`} className="text-xs text-secondary">
                {!showNames
                  ? 'Nessun nome sullo scontrino'
                  : together
                    ? 'Nome della lista e chi ha messo più cose'
                    : 'Il nome della lista'}
              </span>
            </label>
            <button
              id={switchId}
              type="button"
              role="switch"
              aria-checked={showNames}
              aria-labelledby={`${switchId}-nome`}
              aria-describedby={`${switchId}-nota`}
              onClick={() => setShowNames((v) => !v)}
              className={[
                'relative h-8 w-13 shrink-0 rounded-full transition-colors',
                showNames ? 'bg-accent' : 'bg-sand',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'absolute top-1 left-1 size-6 rounded-full bg-cream shadow-tile transition-transform',
                  showNames ? 'translate-x-5' : '',
                ].join(' ')}
              />
            </button>
          </div>
          <Button
            fullWidth
            onClick={() => void share()}
            disabled={!rendered || sharing}
            icon={
              shareFiles ? (
                <Share2 size={18} aria-hidden="true" />
              ) : (
                <Download size={18} aria-hidden="true" />
              )
            }
          >
            {shareFiles ? 'Condividi' : "Scarica l'immagine"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 pb-2">
        {error ? (
          <p role="alert" className="py-16 text-center text-sm text-secondary">
            Non riesco a stampare lo scontrino. Riprova tra poco.
          </p>
        ) : rendered && model ? (
          <img
            src={rendered.url}
            alt={receiptAltText(model)}
            width={1080}
            height={1920}
            className="receipt-print h-[min(52dvh,560px)] w-auto rounded-2xl shadow-[0_8px_30px_rgb(58_44_33/0.18)]"
            draggable={false}
          />
        ) : (
          <div
            className="flex aspect-[9/16] h-[min(52dvh,560px)] items-center justify-center rounded-2xl bg-sand/40"
            role="status"
          >
            <span className="text-sm text-secondary">Stampo lo scontrino...</span>
          </div>
        )}
        <p className="max-w-xs text-center text-xs text-secondary">
          {together
            ? "L'immagine si crea sul telefono e la condividi solo se vuoi."
            : "L'immagine si crea sul telefono. In compagnia è più bello: con altre persone nella lista compare anche chi ha messo più cose."}
        </p>
      </div>
    </BottomSheet>
  )
}
