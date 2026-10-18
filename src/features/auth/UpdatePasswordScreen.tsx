import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { it as t } from '@/i18n/it'
import { MIN_PASSWORD_LENGTH, describeAuthError } from '@/lib/authErrors'
import { isStandalone } from '@/lib/pwa'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { signOut } from './useSession'

interface UpdatePasswordScreenProps {
  /** Chiamato quando si può entrare nell'app con la sessione aperta dal link */
  onDone: () => void
}

/** Mostrata dopo aver aperto il link "password dimenticata" */
export function UpdatePasswordScreen({ onDone }: UpdatePasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const canSave = !busy && password.length >= MIN_PASSWORD_LENGTH && confirm.length > 0 && !mismatch

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      setError(describeAuthError(updateError))
      return
    }
    if (isStandalone()) {
      // aperta dall'app installata: si entra direttamente
      toast(t.newPassword.changedToast, 'success')
      onDone()
    } else {
      // aperta dal browser: l'app installata è un'altra finestra, ci si rientra da lì
      setSaved(true)
    }
  }

  if (saved) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 pb-safe pt-safe text-center">
        <img
          src="/mascot-happy.webp"
          alt=""
          width={144}
          height={144}
          className="size-36 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
          draggable={false}
        />
        <h1 className="font-display text-3xl font-bold text-primary">{t.newPassword.doneTitle}</h1>
        <p className="text-secondary">{t.newPassword.doneMessage}</p>
        <Button variant="ghost" onClick={onDone}>
          {t.newPassword.continueHere}
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-accent text-cream shadow-tile">
          <KeyRound size={32} strokeWidth={2} aria-hidden="true" />
        </span>
        <h1 className="font-display text-3xl font-bold text-primary">{t.newPassword.title}</h1>
        <p className="text-secondary">{t.newPassword.lead}</p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label={t.newPassword.password}
          hint={`Almeno ${MIN_PASSWORD_LENGTH} caratteri.`}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label={t.newPassword.confirm}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? t.newPassword.mismatch : error}
        />
        <Button type="submit" fullWidth disabled={!canSave}>
          {busy ? t.newPassword.saving : t.newPassword.save}
        </Button>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => signOut()}>
            {t.newPassword.cancel}
          </Button>
        </div>
      </form>
    </main>
  )
}
