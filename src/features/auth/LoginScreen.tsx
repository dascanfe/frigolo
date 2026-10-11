import type { EmailOtpType } from '@supabase/supabase-js'
import { LogIn, MailCheck, UserPlus } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/Button'
import { PasswordField } from '@/components/PasswordField'
import { TextField } from '@/components/TextField'
import { Turnstile } from '@/components/Turnstile'
import type { TurnstileHandle } from '@/components/Turnstile'
import { readPendingInvite } from '@/features/lists/inviteCode'
import { PRIVACY_URL, TERMS_URL, it as t } from '@/i18n/it'
import { MIN_PASSWORD_LENGTH, describeAuthError } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

const MIN_PASSWORD = MIN_PASSWORD_LENGTH

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

interface LoginScreenProps {
  /** Link di un'email scaduto o già usato: si offre di mandarne uno nuovo */
  linkError?: { type: EmailOtpType | null } | null
  onLinkErrorDone?: () => void
}

export function LoginScreen({ linkError = null, onLinkErrorDone }: LoginScreenProps = {}) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  /** Email a cui è partito il link di conferma: mostra "Controlla la posta" */
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [hasInvite] = useState(() => readPendingInvite() !== null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => readUrlOutcome())
  // captcha: con la site key serve un token nuovo per ogni invio
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  // il captcha non blocca mai il modulo: se non risponde si invia senza token
  // e, se Supabase lo pretende, risponde con un errore che dice di riprovare
  const captcha = captchaToken ?? undefined
  const renewCaptcha = () => turnstile.current?.reset()

  const cleanEmail = email.trim().toLowerCase()
  const canSubmit =
    !busy &&
    cleanEmail.length > 3 &&
    password.length >= (mode === 'signup' ? MIN_PASSWORD : 1) &&
    (mode === 'signin' || displayName.trim().length > 0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    setNotice(null)

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
            options: { captchaToken: captcha },
          })
        : await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              // il profilo nasce già con il nome (trigger su auth.users)
              data: { display_name: displayName.trim().slice(0, 40) },
              emailRedirectTo: window.location.origin,
              captchaToken: captcha,
            },
          })

    setBusy(false)
    renewCaptcha()
    if (result.error) {
      setError(describeAuthError(result.error))
      return
    }
    // Con le conferme email disattivate la sessione arriva subito e AuthGate
    // cambia schermata. Con le conferme attive: "Controlla la posta".
    if (mode === 'signup' && !result.data.session) {
      setSentTo(cleanEmail)
    }
  }

  async function handleResend() {
    if (!sentTo) return
    setBusy(true)
    setError(null)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: sentTo,
      options: { emailRedirectTo: window.location.origin, captchaToken: captcha },
    })
    setBusy(false)
    renewCaptcha()
    if (resendError) {
      setError(describeAuthError(resendError))
      return
    }
    setNotice(t.checkEmail.resent)
  }

  if (sentTo) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe text-center">
        <header className="flex flex-col items-center gap-3">
          <img
            src="/mascot.png"
            alt=""
            width={112}
            height={112}
            className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
            draggable={false}
          />
          <MailCheck size={28} className="text-accent" aria-hidden="true" />
          <h1 className="font-display text-3xl font-bold text-primary">{t.checkEmail.title}</h1>
          <p className="text-secondary">{t.checkEmail.body(sentTo)}</p>
          <p className="text-xs text-secondary">{t.checkEmail.spam}</p>
        </header>
        {(notice || error) && (
          <p
            className={[
              'rounded-2xl px-4 py-3 text-sm',
              error ? 'bg-rust/10 font-bold text-rust' : 'bg-sand/50 text-primary',
            ].join(' ')}
            role={error ? 'alert' : 'status'}
          >
            {error ?? notice}
          </p>
        )}
        <Turnstile
          ref={turnstile}
          onToken={setCaptchaToken}
          action="resend"
        />
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="secondary"
            onClick={() => void handleResend()}
            disabled={busy}
          >
            {busy ? t.common.wait : t.checkEmail.resend}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSentTo(null)
              setNotice(null)
              setError(null)
              setMode('signup')
            }}
          >
            {t.checkEmail.wrongEmail}
          </Button>
        </div>
      </main>
    )
  }

  async function handleLinkResend(event: FormEvent) {
    event.preventDefault()
    if (!cleanEmail || busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error: sendError } =
      linkError?.type === 'recovery'
        ? await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: window.location.origin,
            captchaToken: captcha,
          })
        : await supabase.auth.resend({
            type: 'signup',
            email: cleanEmail,
            options: { emailRedirectTo: window.location.origin, captchaToken: captcha },
          })
    setBusy(false)
    renewCaptcha()
    if (sendError) {
      setError(describeAuthError(sendError))
      return
    }
    setNotice(t.authLink.sent(cleanEmail))
  }

  if (linkError) {
    const emailChange = linkError.type === 'email_change'
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-safe pt-safe">
        <header className="flex flex-col items-center gap-3 text-center">
          <img
            src="/mascot.png"
            alt=""
            width={112}
            height={112}
            className="size-28 drop-shadow-[0_8px_16px_rgb(58_44_33/0.15)]"
            draggable={false}
          />
          <h1 className="font-display text-3xl font-bold text-primary">
            {t.authLink.expiredTitle}
          </h1>
          <p className="text-secondary">
            {emailChange ? t.authLink.expiredEmailChange : t.authLink.expiredBody}
          </p>
        </header>
        {notice && (
          <p className="rounded-2xl bg-sand/50 px-4 py-3 text-sm text-primary" role="status">
            {notice}
          </p>
        )}
        {!emailChange && (
          <form onSubmit={handleLinkResend} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="nome@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Turnstile
              ref={turnstile}
              onToken={setCaptchaToken}
              action="resend"
            />
            <Button type="submit" fullWidth disabled={busy || !cleanEmail}>
              {busy ? t.common.wait : t.authLink.resend}
            </Button>
          </form>
        )}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => {
              setNotice(null)
              setError(null)
              onLinkErrorDone?.()
            }}
          >
            {t.authLink.backToLogin}
          </Button>
        </div>
      </main>
    )
  }

  async function handleForgotPassword() {
    if (!cleanEmail) {
      setError(t.login.forgotNoEmail)
      return
    }
    setBusy(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
      captchaToken: captcha,
    })
    setBusy(false)
    renewCaptcha()
    if (resetError) {
      setError(describeAuthError(resetError))
      return
    }
    setNotice(t.login.forgotSent(cleanEmail))
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
        <p className="text-secondary">{t.login.tagline}</p>
      </header>

      <div
        className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 ring-1 ring-subtle"
        role="tablist"
      >
        {(
          [
            { id: 'signin', label: t.login.signin, icon: LogIn },
            { id: 'signup', label: t.login.signup, icon: UserPlus },
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

      {hasInvite && !notice && (
        <p className="rounded-2xl bg-sand/50 px-4 py-3 text-sm text-primary" role="status">
          {t.login.pendingInvite}
        </p>
      )}

      {notice && (
        <p className="rounded-2xl bg-sand/50 px-4 py-3 text-sm text-primary" role="status">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <TextField
            label={t.login.nameLabel}
            name="nickname"
            autoComplete="nickname"
            autoCapitalize="words"
            maxLength={40}
            required
            placeholder={t.login.namePlaceholder}
            hint={t.login.nameHint}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
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
          hint={mode === 'signup' ? t.login.passwordHint : undefined}
        />
        {mode === 'signup' && (
          <p className="text-xs text-secondary">
            {t.login.legalBefore}
            <a href={TERMS_URL} target="_blank" rel="noopener" className="font-bold underline">
              {t.login.legalTerms}
            </a>
            {t.login.legalAnd}
            <a href={PRIVACY_URL} target="_blank" rel="noopener" className="font-bold underline">
              {t.login.legalPrivacy}
            </a>
            {t.login.legalAfter}
          </p>
        )}
        <Turnstile
          ref={turnstile}
          onToken={setCaptchaToken}
          action={mode}
        />
        <Button type="submit" fullWidth disabled={!canSubmit}>
          {busy
            ? t.common.wait
            : mode === 'signin'
              ? t.login.submitSignin
              : t.login.submitSignup}
        </Button>
        {mode === 'signin' && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={handleForgotPassword} disabled={busy}>
              {t.login.forgot}
            </Button>
          </div>
        )}
      </form>
    </main>
  )
}
