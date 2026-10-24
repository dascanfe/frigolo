import { X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { it as t } from '@/i18n/it'
import { applyUpdate, getServiceWorkerState, subscribeServiceWorker } from '@/lib/pwa'
import { recordEvent } from '@/lib/telemetry'

/**
 * Barra in alto quando il service worker ha trovato una versione nuova:
 * colore d'accento del tema, mascotte piccola, "Aggiorna ora" e una X.
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
      <div className="flex w-full max-w-md items-center gap-2.5 rounded-3xl bg-accent py-2 pr-1.5 pl-2.5 text-[color:var(--on-accent)] shadow-tile ring-1 ring-black/10">
        <img
          src="/mascot-avatar.webp"
          alt=""
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-full bg-white/90"
          draggable={false}
        />
        <p className="min-w-0 flex-1 text-[13px] leading-tight font-bold">{t.updateBar.title}</p>
        <button
          type="button"
          onClick={() => void update()}
          disabled={applying}
          className="h-10 shrink-0 rounded-full bg-white px-3.5 text-sm font-black text-accent active:scale-[0.97] disabled:opacity-70"
        >
          {applying ? t.app.updating : t.updateBar.button}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t.updateBar.dismiss}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[color:var(--on-accent)] active:bg-black/10"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
