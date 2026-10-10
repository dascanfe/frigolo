import { CloudOff, RefreshCw } from 'lucide-react'
import { useOnlineStatus, usePendingListMutations } from '@/lib/offlineQueue'

/**
 * Pillola discreta in alto: compare offline, o mentre le modifiche fatte
 * offline vengono sincronizzate al ritorno della rete.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()
  const pending = usePendingListMutations()

  if (online && pending === 0) return null

  let message: string
  if (!online) {
    message =
      pending === 1
        ? 'Offline: 1 modifica in attesa di rete'
        : pending > 1
          ? `Offline: ${pending} modifiche in attesa di rete`
          : 'Offline: le modifiche verranno sincronizzate'
  } else {
    message = pending === 1 ? 'Sincronizzo 1 modifica...' : `Sincronizzo ${pending} modifiche...`
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ top: 'calc(var(--safe-top) + 8px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-primary">
        {online ? (
          <RefreshCw size={14} className="animate-spin text-accent" aria-hidden="true" />
        ) : (
          <CloudOff size={14} className="text-secondary" aria-hidden="true" />
        )}
        {message}
      </div>
    </div>
  )
}
