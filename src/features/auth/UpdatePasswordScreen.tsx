import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { describeAuthError } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'
import { signOut } from './useSession'

interface UpdatePasswordScreenProps {
  /** Chiamato quando la nuova password è salvata */
  onDone: () => void
}

/** Mostrata dopo aver aperto il link "password dimenticata" */
export function UpdatePasswordScreen({ onDone }: UpdatePasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError('Le due password non coincidono.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      setError(describeAuthError(updateError))
      return
    }
    onDone()
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-accent text-cream shadow-tile">
          <KeyRound size={32} strokeWidth={2} aria-hidden="true" />
        </span>
        <h1 className="font-display text-3xl font-bold text-primary">Nuova password</h1>
        <p className="text-secondary">Scegli la nuova password per il tuo account.</p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label="Nuova password"
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Ripeti la password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error}
        />
        <Button
          type="submit"
          fullWidth
          disabled={busy || password.length < 8 || confirm.length < 8}
        >
          {busy ? 'Salvo...' : 'Salva la password'}
        </Button>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => signOut()}>
            Annulla ed esci
          </Button>
        </div>
      </form>
    </main>
  )
}
