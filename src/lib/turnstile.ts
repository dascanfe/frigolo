/**
 * Cloudflare Turnstile (captcha senza puzzle) per accesso, registrazione e
 * "password dimenticata". Lo script si carica solo quando una schermata di
 * accesso lo chiede, mai nel resto dell'app. Senza site key non si carica
 * niente e i moduli funzionano senza token.
 */

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  appearance?: 'always' | 'execute' | 'interaction-only'
  size?: 'normal' | 'flexible' | 'compact'
  theme?: 'auto' | 'light' | 'dark'
  language?: string
  action?: string
}

export interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''

let loading: Promise<TurnstileApi> | null = null

/** Carica lo script una volta sola; rifiuta se la rete o un blocco lo impediscono */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile non disponibile'))
    }
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Turnstile non caricato'))
    }
    document.head.appendChild(script)
  })
  return loading
}
