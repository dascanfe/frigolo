import { LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { TextField } from '@/components/TextField'
import { describeAuthError } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

const MIN_PASSWORD = 8

/**
 * Legge (e ripulisce) l'esito di un link di recupero password aperto in un
 * browser diverso o scaduto: Supabase lo mette nell'URL come #error=...
 */
function readUrlOutcome(): string | null {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const description = hash.get('error_description') ?? search.get('error_description')
  const hadCode = search.has('code')
  if (description || hadCode || hash.has('error')) {
    window.history.replaceState(null, '', window.location.pathname)
  }
  if (description) return describeAuthError(new Error(description))
  if (hadCode)
    return "Il link va aperto nello stesso browser da cui l'hai richiesto. Richiedine uno nuovo da qui."
  return null
}

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => readUrlOutcome())

  const cleanEmail = email.trim().toLowerCase()
  const canSubmit =
    !busy && cleanEmail.length > 3 && password.length >= (mode === 'signup' ? MIN_PASSWORD : 1)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    setNotice(null)

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signUp({ email: cleanEmail, password })

    setBusy(false)
    if (result.error) {
      setError(describeAuthError(result.error))
      return
    }
    // Con le conferme email disattivate la sessione arriva subito e AuthGate
    // cambia schermata. Se un giorno venissero riattivate, avvisiamo.
    if (mode === 'signup' && !result.data.session) {
      setNotice("Ti abbiamo mandato un'email: conferma l'indirizzo e poi accedi.")
      setMode('signin')
    }
  }

  async function handleForgotPassword() {
    if (!cleanEmail) {
      setError('Scrivi prima la tua email, poi tocca "Password dimenticata".')
      return
    }
    setBusy(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    })
    setBusy(false)
    if (resetError) {
      setError(describeAuthError(resetError))
      return
    }
    setNotice(
      `Se ${cleanEmail} è registrata riceverai un'email con il link per scegliere una nuova password. Aprilo da questo stesso browser.`,
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 pb-safe pt-safe">
      <header className="flex flex-col items-center gap-3 text-center">
        <img
          src="/mascot.png"
          alt=""
          width={112}
          height={112}
          className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
          draggable={false}
        />
        <h1 className="font-display text-4xl font-bold text-primary">Frigolo</h1>
        <p className="text-secondary">La lista della spesa di casa, sempre in tasca.</p>
      </header>

      <div
        className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 ring-1 ring-subtle"
        role="tablist"
      >
        {(
          [
            { id: 'signin', label: 'Accedi', icon: LogIn },
            { id: 'signup', label: 'Registrati', icon: UserPlus },
          ] as const
        ).map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id)
              setError(null)
            }}
            className={[
              'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors',
              mode === id ? 'bg-primary text-cream' : 'text-secondary',
            ].join(' ')}
          >
            <TabIcon size={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="rounded-2xl bg-sand/50 px-4 py-3 text-sm text-primary" role="status">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          placeholder="nome@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
          placeholder={mode === 'signup' ? `Almeno ${MIN_PASSWORD} caratteri` : ''}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          hint={
            mode === 'signup'
              ? 'Scegline una che ricordi: siete in due, niente reset automatici.'
              : undefined
          }
        />
        <Button type="submit" fullWidth disabled={!canSubmit}>
          {busy ? 'Un attimo...' : mode === 'signin' ? 'Entra' : 'Crea account'}
        </Button>
        {mode === 'signin' && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={handleForgotPassword} disabled={busy}>
              Password dimenticata?
            </Button>
          </div>
        )}
      </form>
    </main>
  )
}
