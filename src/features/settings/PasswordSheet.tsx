import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { useHousehold } from '@/features/auth/useHousehold'
import { MIN_PASSWORD_LENGTH, describeAuthError } from '@/lib/authErrors'
import { haptics } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

const MIN_PASSWORD = MIN_PASSWORD_LENGTH

interface PasswordSheetProps {
  open: boolean
  onClose: () => void
}

/** Cambio password dall'interno dell'app, con la sessione già aperta */
export function PasswordSheet({ open, onClose }: PasswordSheetProps) {
  const formId = useId()
  const [busy, setBusy] = useState(false)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Cambia password"
      footer={
        <Button type="submit" form={formId} fullWidth disabled={busy}>
          {busy ? 'Salvo...' : 'Salva la password'}
        </Button>
      }
    >
      {open && <PasswordForm formId={formId} onBusy={setBusy} onDone={onClose} />}
    </BottomSheet>
  )
}

interface PasswordFormProps {
  formId: string
  onBusy: (busy: boolean) => void
  onDone: () => void
}

function PasswordForm({ formId, onBusy, onDone }: PasswordFormProps) {
  const { email } = useHousehold()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < MIN_PASSWORD) {
      setError(`Usa almeno ${MIN_PASSWORD} caratteri.`)
      return
    }
    if (password !== confirm) {
      setError('Le due password non coincidono.')
      return
    }
    onBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    onBusy(false)
    if (updateError) {
      setError(describeAuthError(updateError))
      return
    }
    haptics.success()
    toast('Password cambiata', 'success')
    onDone()
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1 pb-3" noValidate>
      {/* l'email nascosta dice al portachiavi di iPhone a quale account
          appartiene la nuova password, così non tocca quelle di altre app */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email ?? ''}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <p className="text-sm text-secondary">
        {email ? (
          <>
            Nuova password per <strong className="text-primary">{email}</strong>.{' '}
          </>
        ) : null}
        Vale solo per Frigolo: le password delle altre app non cambiano.
      </p>
      <PasswordField
        label="Nuova password"
        name="new-password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        placeholder={`Almeno ${MIN_PASSWORD} caratteri`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordField
        label="Ripeti la password"
        name="confirm-password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={error}
      />
    </form>
  )
}
