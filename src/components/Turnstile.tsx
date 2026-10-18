import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { it as t } from '@/i18n/it'
import { TURNSTILE_SITE_KEY, loadTurnstile, startTokenTimeout } from '@/lib/turnstile'
import type { TurnstileApi } from '@/lib/turnstile'

export interface TurnstileHandle {
  /** Il token vale una volta sola: dopo ogni invio se ne chiede uno nuovo */
  reset: () => void
}

interface TurnstileProps {
  /** Token pronto, oppure null quando scade o va richiesto di nuovo */
  onToken: (token: string | null) => void
  /**
   * Il captcha non risponde (script bloccato, errore, timeout, token scaduto):
   * il modulo prova senza token e non resta mai in attesa
   */
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
  const cancelWait = useRef<(() => void) | null>(null)
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
    const giveUp = () => {
      if (cancelled) return
      cancelWait.current?.()
      cancelWait.current = null
      emit(null)
      unavailable()
    }
    // in ogni caso, dopo 6 secondi senza token si smette di aspettare
    cancelWait.current = startTokenTimeout(giveUp)
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return
        const id = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => {
            cancelWait.current?.()
            cancelWait.current = null
            emit(token)
          },
          'expired-callback': giveUp,
          'timeout-callback': giveUp,
          'error-callback': (code) => {
            // 110200 = hostname non autorizzato per questa site key
            console.error(`[Turnstile] errore ${code}`)
            giveUp()
            return true
          },
          appearance: 'interaction-only',
          size: 'flexible',
          theme: 'auto',
          language: 'it',
          action,
        })
        widget.current = { api, id }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error('[Turnstile] impossibile caricare o creare il widget', error)
        setFailed(true)
        giveUp()
      })
    return () => {
      cancelled = true
      cancelWait.current?.()
      cancelWait.current = null
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
