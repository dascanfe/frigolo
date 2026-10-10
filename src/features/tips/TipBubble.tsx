import { useSyncExternalStore } from 'react'
import { Button } from '@/components/Button'
import { it as t } from '@/i18n/it'
import { dismissTip, getCurrentTip, subscribeTips } from './tips'

/** Il suggerimento in coda, con la mascotte piccola, sopra la barra in basso */
export function TipBubble() {
  const tip = useSyncExternalStore(subscribeTips, getCurrentTip, getCurrentTip)
  if (!tip) return null
  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: 'calc(var(--nav-offset) + 12px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="glass flex w-full max-w-md items-center gap-3 rounded-3xl px-3 py-3">
        <img
          src="/mascot-avatar.webp"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0"
          draggable={false}
        />
        <p className="min-w-0 flex-1 text-sm text-primary">{t.tips[tip]}</p>
        <Button className="h-10 shrink-0 px-4 text-sm" onClick={() => dismissTip(tip)}>
          {t.tips.ok}
        </Button>
      </div>
    </div>
  )
}
