import { X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { it as t } from '@/i18n/it'
import { applyUpdate, getServiceWorkerState, subscribeServiceWorker } from '@/lib/pwa'
import { recordEvent } from '@/lib/telemetry'

/**
 * Barra in alto quando il service worker ha trovato una versione nuova:
 * colore d'accento del tema, mascotte, titolo e sottotitolo, "Aggiorna ora"
 * (con un alone che pulsa piano per farsi notare) e una X.
 * Chiusa con la X sparisce fino alla prossima apertura dell'app (lo stato
 * sta solo in memoria): la nuova versione resta in attesa e la barra torna.
 */
export function UpdateBar() {
  const sw = useSyncExternalStore(
    subscribeServiceWorker,
    getServiceWorkerState,
    getServiceWorkerState,
  )
  const [dismissed, setDismissed] = useState(false)
  const [applying, setApplying] = useState(false)
  const shown = sw.needRefresh && !dismissed
  // metriche anonime: barra mostrata (una volta per apertura)
  useEffect(() => {
    if (shown) recordEvent('aggiorna_barra')
  }, [shown])

  if (!sw.needRefresh || (dismissed && !applying)) return null

  async function update() {
    recordEvent('aggiorna_tocco')
    setApplying(true)
    await applyUpdate()
  }

  return (
    <div
      role="status"
      className="update-bar fixed inset-x-0 top-0 z-40 flex justify-center px-3"
      style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}
    >
      <div className="flex w-full max-w-md flex-col gap-3 rounded-[28px] bg-accent p-3 text-[color:var(--on-accent)] shadow-[0_14px_34px_rgb(0_0_0/0.28)] ring-1 ring-black/10">
        <div className="flex items-center gap-3">
          <img
            src="/mascot-avatar.webp"
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full bg-white/90"
            draggable={false}
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-base font-black">{t.updateBar.title}</p>
            <p className="mt-0.5 text-[13px] font-bold opacity-85">{t.updateBar.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t.updateBar.dismiss}
            className="flex size-10 shrink-0 items-center justify-center self-start rounded-full text-[color:var(--on-accent)] active:bg-black/10"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => void update()}
          disabled={applying}
          className="update-bar-cta h-12 w-full rounded-full bg-white text-base font-black text-accent active:scale-[0.98] disabled:opacity-70"
        >
          {applying ? t.app.updating : t.updateBar.button}
        </button>
      </div>
    </div>
  )
}
