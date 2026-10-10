import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

interface ConfirmSheetProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  /** Il bottone dice l'azione ("Elimina la lista"), mai "OK" o "Sì" */
  confirmLabel: string
  onConfirm: () => Promise<void>
  danger?: boolean
}

/** Conferma per le azioni che non si annullano */
export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  danger = false,
}: ConfirmSheetProps) {
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-primary">{message}</p>
        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            variant={danger ? 'danger' : 'primary'}
            onClick={() => void confirm()}
            disabled={busy}
          >
            {busy ? 'Un attimo...' : confirmLabel}
          </Button>
          <Button fullWidth variant="ghost" onClick={onClose} disabled={busy}>
            Annulla
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
