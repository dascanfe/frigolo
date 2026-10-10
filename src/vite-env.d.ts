/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Site key pubblica di Cloudflare Turnstile; vuota = niente captcha */
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Versione da package.json, iniettata da Vite */
declare const __APP_VERSION__: string
