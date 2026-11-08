import { X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/Button'
import { isShareNudgePending, subscribeShareNudge } from '@/features/tips/shareNudge'
import { it as t } from '@/i18n/it'
import {
  dismissInstallNudge,
  getInstallNudge,
  isInstallNudgeDue,
  subscribeInstallNudge,
} from '@/lib/installNudge'
import { getInstallState, promptInstall, subscribeInstall } from '@/lib/pwa'
import { recordEvent } from '@/lib/telemetry'
import { IosInstallGuide } from './IosInstallGuide'

/**
 * Scheda in pagina (non un popup) che invita a installare l'app, solo quando
 * si usa il browser. Android/Chrome: "Installa Frigolo" apre il prompt nativo.
 * iPhone: "Come si fa" apre la guida (Safari) o spiega di passare a Safari.
 * Chiusa con la X torna dopo 3 giorni, al massimo 3 volte. Cede il posto
 * all'invito a condividere, se è in attesa. Non blocca mai l'uso dal browser.
 */
export function InstallCard() {
  const install = useSyncExternalStore(subscribeInstall, getInstallState, getInstallState)
  const nudge = useSyncExternalStore(subscribeInstallNudge, getInstallNudge, getInstallNudge)
  const sharePending = useSyncExternalStore(subscribeShareNudge, isShareNudgePending, () => false)
  const [guideOpen, setGuideOpen] = useState(false)
  // Date.now() una volta sola per montaggio: la scheda non deve sparire da sola mentre la si guarda
  const [now] = useState(() => Date.now())

  const ios = install.platform !== 'other'
  const canInstall = install.canPrompt || ios
  // metriche anonime: la scheda è stata mostrata (una volta per apertura)
  const cardShown =
    !install.installed && canInstall && !guideOpen && !sharePending && isInstallNudgeDue(nudge, now)
  useEffect(() => {
    if (cardShown) recordEvent('install_scheda')
  }, [cardShown])
  if (install.installed || !canInstall) return null
  if (!guideOpen && (sharePending || !isInstallNudgeDue(nudge, now))) return null

  async function onInstall() {
    recordEvent('install_android_tocco')
    const accepted = await promptInstall()
    // rifiutato dal prompt nativo: conta come chiusura, torna tra 3 giorni
    if (!accepted) dismissInstallNudge()
  }

  return (
    <>
      {!guideOpen && (
        <div className="mx-4 mt-2 flex flex-col gap-3 rounded-3xl bg-surface p-3 ring-1 ring-subtle">
          <div className="flex items-center gap-3">
            <img
              src="/mascot-avatar.webp"
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0"
              draggable={false}
            />
            <p className="min-w-0 flex-1 text-sm font-bold text-primary">{t.installCard.text}</p>
            <button
              type="button"
              onClick={() => dismissInstallNudge()}
              aria-label={t.installCard.dismiss}
              className="flex size-9 shrink-0 items-center justify-center self-start rounded-full text-secondary"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {install.canPrompt ? (
            <Button className="h-10 w-full text-sm" onClick={() => void onInstall()}>
              {t.installCard.install}
            </Button>
          ) : (
            <Button className="h-10 w-full text-sm" onClick={() => setGuideOpen(true)}>
              {t.installCard.how}
            </Button>
          )}
        </div>
      )}
      <IosInstallGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        safari={install.platform === 'ios-safari'}
      />
    </>
  )
}
