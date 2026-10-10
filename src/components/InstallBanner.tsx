import { Download, Share, X } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/Button'
import { getCurrentTip, hasAddedFirstProduct, subscribeTips } from '@/features/tips/tips'
import { it as t } from '@/i18n/it'
import {
  dismissInstall,
  getInstallState,
  promptInstall,
  shouldOfferInstall,
  subscribeInstall,
} from '@/lib/pwa'

/**
 * Invito a installare l'app, non invasivo: solo dopo il primo prodotto
 * aggiunto e quando non c'è un suggerimento aperto, una riga sopra la nav,
 * chiudibile per sempre. Su iOS spiega il gesto manuale.
 */
export function InstallBanner() {
  const state = useSyncExternalStore(subscribeInstall, getInstallState, getInstallState)
  const tip = useSyncExternalStore(subscribeTips, getCurrentTip, getCurrentTip)
  const firstAdd = useSyncExternalStore(subscribeTips, hasAddedFirstProduct, hasAddedFirstProduct)
  const [hidden, setHidden] = useState(false)

  if (hidden || tip || state.installed || !shouldOfferInstall(firstAdd)) return null
  if (!state.canPrompt && !state.isIos) return null

  function close() {
    dismissInstall()
    setHidden(true)
  }

  async function install() {
    const accepted = await promptInstall()
    if (accepted) setHidden(true)
  }

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: 'calc(var(--nav-offset) + 12px)' }}
    >
      <div className="glass flex w-full max-w-md items-center gap-3 rounded-3xl px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-cream">
          {state.isIos ? (
            <Share size={20} aria-hidden="true" />
          ) : (
            <Download size={20} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold text-primary">{t.install.title}</p>
          <p className="text-xs text-secondary">
            {state.isIos ? t.install.ios : t.install.android}
          </p>
        </div>
        {state.canPrompt && (
          <Button onClick={install} className="h-10 px-4 text-sm">
            {t.install.button}
          </Button>
        )}
        <button
          type="button"
          onClick={close}
          aria-label={t.install.dismiss}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-secondary"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
