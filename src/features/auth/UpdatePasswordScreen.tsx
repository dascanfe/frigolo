import { Check, Circle, KeyRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { it as t } from '@/i18n/it'
import { MIN_PASSWORD_LENGTH, describeAuthError } from '@/lib/authErrors'
import { isStandalone } from '@/lib/pwa'
import { supabase } from '@/lib/supabase'
import { FORGOT_PASSWORD_PATH } from './authRoute'
import { checkNewPassword, isSessionGone } from './passwordRules'
import { signOut } from './useSession'

interface UpdatePasswordScreenProps {
  /** Chiamato quando si può entrare nell'app con la sessione aperta dal link */
  onDone: () => void
}

type Step = 'form' | 'saved' | 'expired'

/**
 * Mostrata dopo aver aperto il link dell'email "Crea una nuova password"
 * (/auth/confirm con type=recovery). Il link scaduto o già usato non arriva
 * qui: lo spiega LoginScreen. Se invece la sessione del link scade mentre la
 * pagina è aperta, lo si spiega qui e si offre un link nuovo.
 */
export function UpdatePasswordScreen({ onDone }: UpdatePasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('form')
  const heading = useRef<HTMLHeadingElement>(null)

  const checks = checkNewPassword(password, confirm, MIN_PASSWORD_LENGTH)
  const canSave = !busy && checks.valid

  // a ogni cambio di passo il focus va al titolo: il lettore di schermo lo legge
  useEffect(() => {
    if (step !== 'form') heading.current?.focus()
  }, [step])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) {
      if (isSessionGone(updateError)) setStep('expired')
      else setError(describeAuthError(updateError))
      return
    }
    setStep('saved')
  }

  function askNewLink() {
    // dopo l'uscita LoginScreen legge l'indirizzo e apre "Crea una nuova password"
    window.history.replaceState(null, '', FORGOT_PASSWORD_PATH)
    void signOut()
  }

  if (step === 'saved') {
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
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-3xl font-bold text-primary focus:outline-none"
          >
            {t.newPassword.doneTitle}
          </h1>
          <p className="text-secondary">{t.newPassword.doneMessage}</p>
          {!isStandalone() && (
            <p className="text-sm text-secondary">{t.newPassword.doneInstalled}</p>
          )}
        </div>
        <Button fullWidth onClick={onDone}>
          {t.newPassword.enter}
        </Button>
      </main>
    )
  }

  if (step === 'expired') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe">
        <header className="flex flex-col items-center gap-3 text-center">
          <img
            src="/mascot-sad.webp"
            alt=""
            width={112}
            height={112}
            className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
            draggable={false}
          />
          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-3xl font-bold text-primary focus:outline-none"
          >
            {t.newPassword.expiredTitle}
          </h1>
          <p className="text-secondary" role="alert">
            {t.newPassword.expiredBody}
          </p>
        </header>
        <div className="flex flex-col items-center gap-1">
          <Button fullWidth onClick={askNewLink}>
            {t.authLink.newRecoveryLink}
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            {t.authLink.backToLogin}
          </Button>
        </div>
      </main>
    )
  }

  const rules = [
    { ok: checks.longEnough, label: t.newPassword.ruleLength(MIN_PASSWORD_LENGTH) },
    { ok: checks.matches, label: t.newPassword.ruleMatch },
  ]

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-accent text-cream shadow-tile">
          <KeyRound size={32} strokeWidth={2} aria-hidden="true" />
        </span>
        <h1 className="font-display text-3xl font-bold text-primary">{t.newPassword.title}</h1>
        <p className="text-secondary">{t.newPassword.lead}</p>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordField
          label={t.newPassword.password}
          name="new-password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
        />
        <PasswordField
          label={t.newPassword.confirm}
          name="confirm-password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setError(null)
          }}
          error={checks.mismatch ? t.newPassword.mismatch : error}
        />
        <ul aria-label={t.newPassword.rulesLabel} className="flex flex-col gap-1.5 text-sm">
          {rules.map(({ ok, label }) => (
            <li
              key={label}
              className={[
                'flex items-center gap-2',
                ok ? 'font-bold text-primary' : 'text-secondary',
              ].join(' ')}
            >
              {ok ? (
                <Check size={16} strokeWidth={3} className="text-accent" aria-hidden="true" />
              ) : (
                <Circle size={16} aria-hidden="true" />
              )}
              {label}
              <span className="sr-only">
                {`: ${ok ? t.newPassword.ruleDone : t.newPassword.ruleTodo}`}
              </span>
            </li>
          ))}
        </ul>
        <Button type="submit" fullWidth disabled={!canSave}>
          {busy ? t.newPassword.saving : t.newPassword.save}
        </Button>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => void signOut()}>
            {t.newPassword.cancel}
          </Button>
        </div>
      </form>
    </main>
  )
}
