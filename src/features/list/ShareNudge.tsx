import { X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { useHousehold } from '@/features/auth/useHousehold'
import { InvitePanel } from '@/features/lists/InvitePanel'
import { useInvalidateLists } from '@/features/lists/useLists'
import {
  dismissShareNudge,
  isShareNudgePending,
  subscribeShareNudge,
} from '@/features/tips/shareNudge'
import { it as t } from '@/i18n/it'

/**
 * Dopo il primo prodotto, una volta sola: "La spesa si fa in due?" con il
 * pannello d'invito. È una scheda dentro la pagina, non un popup, e sparisce
 * se la lista ha già altre persone.
 */
export function ShareNudge() {
  const { household, members, userId } = useHousehold()
  const invalidateLists = useInvalidateLists()
  const pending = useSyncExternalStore(subscribeShareNudge, isShareNudgePending, () => false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const shared = members.length > 1
  // qualcuno è già entrato: l'invito non serve più
  useEffect(() => {
    if (shared && pending) dismissShareNudge()
  }, [shared, pending])

  if ((!pending || shared) && !sheetOpen) return null

  return (
    <>
      {pending && !sheetOpen && (
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-3xl bg-surface p-3 ring-1 ring-subtle">
          <img
            src="/mascot-avatar.webp"
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0"
            draggable={false}
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-primary">{t.shareNudge.title}</p>
            <p className="text-xs text-secondary">{t.shareNudge.text}</p>
          </div>
          <Button className="h-10 shrink-0 px-4 text-sm" onClick={() => setSheetOpen(true)}>
            {t.shareNudge.button}
          </Button>
          <button
            type="button"
            onClick={dismissShareNudge}
            aria-label={t.shareNudge.dismiss}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-secondary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      <BottomSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          dismissShareNudge()
        }}
        title={t.invite.title}
      >
        <div className="flex flex-col gap-3 pb-4">
          <p className="text-sm text-secondary">{t.invite.subtitle(household.name)}</p>
          <InvitePanel
            household={household}
            peopleCount={members.length}
            onRotated={() => invalidateLists(userId)}
          />
        </div>
      </BottomSheet>
    </>
  )
}
