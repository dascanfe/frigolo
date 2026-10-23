/**
 * Stato del service worker e prompt di installazione, come store esterni
 * (useSyncExternalStore) così Impostazioni, toast e banner leggono lo
 * stesso stato senza contesto React.
 */
import { registerSW } from 'virtual:pwa-register'
import { detectInstallPlatform } from './installPlatform'
import type { InstallPlatform } from './installPlatform'
import { markInstalled, recordInstallOutcome } from './installNudge'

/* ------------------------------------------------------------------------- */
/* Service worker                                                            */
/* ------------------------------------------------------------------------- */

export interface ServiceWorkerState {
  /** Il browser supporta e ha registrato il service worker */
  registered: boolean
  /** L'app è pronta per l'uso offline (prima installazione completata) */
  offlineReady: boolean
  /** C'e' una nuova versione in attesa: chiamare applyUpdate() */
  needRefresh: boolean
}

let swState: ServiceWorkerState = { registered: false, offlineReady: false, needRefresh: false }
const swListeners = new Set<() => void>()
let updateServiceWorker: ((reload?: boolean) => Promise<void>) | null = null

function setSwState(patch: Partial<ServiceWorkerState>) {
  swState = { ...swState, ...patch }
  for (const listener of swListeners) listener()
}

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000
/** In background per piu' di cosi', alla ripresa la pagina si ricarica da sola */
export const BACKGROUND_RELOAD_AFTER_MS = 3 * 60 * 1000
const RELOAD_FLAG = 'frigolo-preload-reload'

/** Salva la coda offline e ricarica: le modifiche in attesa non si perdono */
async function reloadPage() {
  try {
    // import dinamico: pwa.ts resta leggero e testabile senza Supabase
    const [{ savePendingMutations }, { queryClient }] = await Promise.all([
      import('./offlineQueue'),
      import('./queryClient'),
    ])
    await savePendingMutations(queryClient)
  } catch {
    // se il salvataggio fallisce si ricarica comunque: resta la cache principale
  }
  window.location.reload()
}

/**
 * Decide se, tornando in primo piano dopo `hiddenMs`, serve ricaricare in
 * silenzio per passare alla versione nuova (mai mentre la pagina e' visibile).
 */
export function shouldReloadOnResume(needRefresh: boolean, hiddenMs: number): boolean {
  return needRefresh && hiddenMs >= BACKGROUND_RELOAD_AFTER_MS
}

/** Da chiamare una volta all'avvio (main.tsx) */
export function setupServiceWorker() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return

  // Il nuovo worker si attiva da solo (skipWaiting). Se la pagina aperta era gia'
  // controllata da un worker, il cambio di controller vuol dire "versione nuova
  // attiva, questa pagina e' ancora la vecchia": si mostra la barra.
  let hadController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) setSwState({ needRefresh: true })
    hadController = true
  })

  // Ripresa dal background: dopo qualche minuto la pagina vecchia si ricarica in silenzio
  let hiddenAt = 0
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
    } else if (hiddenAt && shouldReloadOnResume(swState.needRefresh, Date.now() - hiddenAt)) {
      void reloadPage()
    }
  })

  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW: (_url, registration) => {
      setSwState({ registered: true })
      if (!registration) return
      // controlla ogni ora e ogni volta che l'app torna in primo piano
      window.setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
    onOfflineReady: () => setSwState({ offlineReady: true }),
    // versione in attesa (vecchi worker senza skipWaiting): si mostra la barra
    onNeedRefresh: () => setSwState({ needRefresh: true }),
  })
}

/**
 * Pezzi dell'app non piu' sul server (versione nuova uscita mentre la pagina
 * era aperta): ricarica una volta sola, il flag in sessionStorage evita i cicli.
 * Si installa anche in sviluppo e senza service worker.
 */
export function setupChunkErrorReload() {
  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return
      sessionStorage.setItem(RELOAD_FLAG, '1')
    } catch {
      return // senza sessionStorage meglio non rischiare un ciclo
    }
    void reloadPage()
  }
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnce()
  })
  window.addEventListener('unhandledrejection', (event) => {
    const message = String((event.reason as Error | undefined)?.message ?? event.reason)
    if (
      /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
        message,
      )
    ) {
      reloadOnce()
    }
  })
  // caricata bene: il prossimo problema potra' ricaricare di nuovo
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG)
      } catch {
        /* niente */
      }
    }, 10_000)
  })
}

/** Cerca una nuova versione adesso; ritorna true se ne ha trovata una (gia' attiva o in attesa) */
export async function checkForUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  await registration.update()
  // il nuovo worker si installa e si attiva da solo: aspettiamo il cambio di controller
  if (registration.installing || registration.waiting) {
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 10_000)
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
    })
  }
  if (registration.waiting) setSwState({ needRefresh: true })
  return swState.needRefresh
}

export function subscribeServiceWorker(listener: () => void) {
  swListeners.add(listener)
  return () => {
    swListeners.delete(listener)
  }
}

export function getServiceWorkerState() {
  return swState
}

/**
 * Passa alla versione nuova e ricarica (al tocco di "Aggiorna ora"). Di norma
 * il worker nuovo e' gia' attivo e basta ricaricare; se ce n'e' ancora uno in
 * attesa (worker vecchi) gli manda SKIP_WAITING e ricarica quando prende il
 * controllo, o comunque dopo 2,5 secondi (su iOS standalone il cambio di
 * controller a volte non arriva).
 */
export async function applyUpdate() {
  const registration =
    'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  if (registration?.waiting) {
    const reloadWhenControlled = new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 2500)
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.clearTimeout(timeout)
          resolve()
        },
        { once: true },
      )
    })
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    await reloadWhenControlled
  } else if (swState.needRefresh && !registration && updateServiceWorker) {
    void updateServiceWorker(false)
  }
  await reloadPage()
}

/* ------------------------------------------------------------------------- */
/* Installazione                                                             */
/* ------------------------------------------------------------------------- */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallState {
  /** L'app gira già come PWA installata */
  installed: boolean
  /** Il browser offre il prompt nativo (Chrome/Edge/Android) */
  canPrompt: boolean
  /** Browser: su iOS niente prompt, si spiega il gesto (Safari) o si rimanda a Safari */
  platform: InstallPlatform
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installState: InstallState = { installed: false, canPrompt: false, platform: 'other' }
const installListeners = new Set<() => void>()

function setInstallState(patch: Partial<InstallState>) {
  installState = { ...installState, ...patch }
  for (const listener of installListeners) listener()
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

/** Da chiamare una volta all'avvio: cattura il prompt di installazione */
export function setupInstallPrompt() {
  // Debug in sviluppo: window.__frigoloPwa.setSwState({ needRefresh: true }) simula una
  // versione nuova, setInstallState({ canPrompt: true }) il prompt di installazione
  if (import.meta.env.DEV) Object.assign(window, { __frigoloPwa: { setSwState, setInstallState } })
  setInstallState({
    installed: isStandalone(),
    platform: detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints),
  })

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    setInstallState({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    markInstalled()
    setInstallState({ installed: true, canPrompt: false })
  })
}

export function subscribeInstall(listener: () => void) {
  installListeners.add(listener)
  return () => {
    installListeners.delete(listener)
  }
}

export function getInstallState() {
  return installState
}

/**
 * Mostra il prompt nativo e registra l'esito (localStorage, vedi
 * installNudge). Ritorna true se l'utente ha accettato.
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  setInstallState({ canPrompt: false })
  recordInstallOutcome(outcome)
  return outcome === 'accepted'
}
