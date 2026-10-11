import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { it as t } from '@/i18n/it'
import { TURNSTILE_SITE_KEY, loadTurnstile } from '@/lib/turnstile'
import type { TurnstileApi } from '@/lib/turnstile'

export interface TurnstileHandle {
  /** Il token vale una volta sola: dopo ogni invio se ne chiede uno nuovo */
  reset: () => void
}

interface TurnstileProps {
  /** Token pronto, oppure null quando scade o va richiesto di nuovo */
  onToken: (token: string | null) => void
  /** Lo script non si carica (rete, blocchi): il modulo prova senza token */
  onUnavailable?: () => void
  action?: string
  ref?: Ref<TurnstileHandle>
}

/**
 * Widget di Turnstile. Di solito resta invisibile (appearance
 * "interaction-only"): compare solo se Cloudflare vuole un tocco in più.
 * Senza site key non mostra niente.
 */
export function Turnstile({ onToken, onUnavailable, action, ref }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const [failed, setFailed] = useState(false)
  // il genitore passa spesso una arrow inline: l'effetto non deve rimontarsi
  const emit = useEffectEvent((token: string | null) => onToken(token))
  const unavailable = useEffectEvent(() => onUnavailable?.())

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken(null)
      if (widget.current) widget.current.api.reset(widget.current.id)
    },
  }))

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return
        const id = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => emit(token),
          'expired-callback': () => emit(null),
          'error-callback': () => emit(null),
          appearance: 'interaction-only',
          size: 'flexible',
          theme: 'auto',
          language: 'it',
          action,
        })
        widget.current = { api, id }
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        unavailable()
      })
    return () => {
      cancelled = true
      if (widget.current) widget.current.api.remove(widget.current.id)
      widget.current = null
    }
  }, [action])

  if (!TURNSTILE_SITE_KEY) return null
  return (
    <div className="flex flex-col items-center">
      <div ref={container} className="w-full empty:hidden" />
      {failed && (
        <p className="text-center text-xs font-bold text-rust" role="alert">
          {t.login.captchaFailed}
        </p>
      )}
    </div>
  )
}
