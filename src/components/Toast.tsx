import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getToasts, subscribeToasts } from '@/lib/toast'
import type { ToastKind } from '@/lib/toast'

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  error: TriangleAlert,
}

/** Da montare una volta sola, in App: mostra i toast sopra la bottom nav */
export function ToastHost() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts)
  if (items.length === 0) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(var(--nav-offset) + 16px)' }}
      role="status"
      aria-live="polite"
    >
      {items.map(({ id, kind, message, mascot }) => {
        const IconComponent = ICONS[kind]
        return (
          <div
            key={id}
            className="flex max-w-md items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-cream shadow-sheet"
          >
            {mascot ? (
              <img
                src="/mascot-avatar.webp"
                alt=""
                width={32}
                height={32}
                className="-my-1 -ml-2 size-8 shrink-0"
                draggable={false}
              />
            ) : (
              <IconComponent
                size={18}
                className={kind === 'error' ? 'text-peach' : 'text-sage'}
                aria-hidden="true"
              />
            )}
            {message}
          </div>
        )
      })}
    </div>
  )
}
