import { ArrowLeft, MailCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { STICKY_TOP } from '@/components/PageHeader'
import { TextField } from '@/components/TextField'
import { Turnstile } from '@/components/Turnstile'
import type { TurnstileHandle } from '@/components/Turnstile'
import { it as t } from '@/i18n/it'
import { describeAuthError } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'

interface ForgotPasswordScreenProps {
  /** Email già scritta nell'accesso: il campo parte compilato */
  initialEmail?: string
  /** Freccia indietro e "Torna all'accesso" */
  onBack: () => void
}

/**
 * "Crea una nuova password": chiede l'email e manda il link di recupero
 * (template supabase/templates/recovery.html, che porta a /auth/confirm).
 * Il riscontro è lo stesso che l'account esista o no: non si rivela chi è
 * iscritto.
 */
export function ForgotPasswordScreen({ initialEmail = '', onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState(initialEmail)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const cleanEmail = email.trim().toLowerCase()
  const canSubmit = !busy && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)

  // cambio di stato (modulo / email mandata): il focus va al titolo, così chi
  // usa un lettore di schermo sente subito dove si trova. Senza email già
  // scritta il focus va invece al campo (autoFocus)
  useEffect(() => {
    if (sentTo || initialEmail) heading.current?.focus()
  }, [sentTo, initialEmail])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    if (!navigator.onLine) {
      setError(describeAuthError(new Error('network')))
      return
    }
    setBusy(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
      captchaToken: captchaToken ?? undefined,
    })
    setBusy(false)
    turnstile.current?.reset()
    // stesso riscontro per tutti: un account che non esiste o un secondo invio entro
    // il minuto (la mail di prima è già partita) non sono errori da mostrare, così
    // non si può capire se un'email è registrata
    const silenzioso =
      resetError?.code === 'user_not_found' ||
      resetError?.code === 'over_email_send_rate_limit' ||
      (resetError?.status === 429 && resetError.message.includes('email'))
    if (resetError && !silenzioso) {
      setError(describeAuthError(resetError))
      return
    }
    setSentTo(cleanEmail)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pt-safe pb-safe">
      {/* freccia nel cerchio di vetro, come nelle altre pagine (PageHeader) */}
      <button
        type="button"
        onClick={onBack}
        aria-label={t.forgotPassword.back}
        title={t.forgotPassword.back}
        className="group fixed z-30 flex size-11 items-center justify-center"
        style={{ top: STICKY_TOP, left: 'max(12px, calc(50vw - 500px))' }}
      >
        <span className="glass flex size-9 items-center justify-center rounded-full text-primary transition-transform group-active:scale-95">
          <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </button>

      {/* esito per i lettori di schermo: la regione resta montata, cambia il testo */}
      <p className="sr-only" aria-live="polite" role="status">
        {sentTo ? `${t.forgotPassword.sentTitle}. ${t.forgotPassword.sentBody(sentTo)}` : ''}
      </p>

      {sentTo ? (
        <>
          <header className="flex flex-col items-center gap-3 text-center">
            <img
              src="/mascot-happy.webp"
              alt=""
              width={112}
              height={112}
              className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
              draggable={false}
            />
            <MailCheck size={28} className="text-accent" aria-hidden="true" />
            <h1
              ref={heading}
              tabIndex={-1}
              className="font-display text-3xl font-bold text-primary focus:outline-none"
            >
              {t.forgotPassword.sentTitle}
            </h1>
            <p className="text-secondary">{t.forgotPassword.sentBody(sentTo)}</p>
            <p className="text-sm text-secondary">{t.forgotPassword.sentExpiry}</p>
            <p className="text-xs text-secondary">{t.forgotPassword.sentSpam}</p>
          </header>
          <div className="flex flex-col items-center gap-1">
            <Button fullWidth onClick={onBack}>
              {t.forgotPassword.backToLogin}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSentTo(null)
                setError(null)
              }}
            >
              {t.forgotPassword.otherEmail}
            </Button>
          </div>
        </>
      ) : (
        <>
          <header className="flex flex-col items-center gap-3 text-center">
            <img
              src="/mascot.png"
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
              {t.forgotPassword.title}
            </h1>
            <p className="text-secondary">{t.forgotPassword.lead}</p>
          </header>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <TextField
              label="Email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="nome@esempio.it"
              autoFocus={!initialEmail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              error={error}
            />
            <Turnstile ref={turnstile} onToken={setCaptchaToken} action="recovery" />
            <Button type="submit" fullWidth disabled={!canSubmit}>
              {busy ? t.forgotPassword.sending : t.forgotPassword.submit}
            </Button>
          </form>
          <div className="flex justify-center">
            <Button variant="ghost" onClick={onBack}>
              {t.forgotPassword.backToLogin}
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
