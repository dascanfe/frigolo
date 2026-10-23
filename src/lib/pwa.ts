/**
 * Stato del service worker e prompt di installazione, come store esterni
 * (useSyncExternalStore) così Impostazioni, toast e banner leggono lo
 * stesso stato senza contesto React.
 */
import { registerSW } from 'virtual:pwa-register'

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

// Debug in sviluppo: window.__frigoloPwa.setSwState({ needRefresh: true }) simula una versione nuova
if (import.meta.env.DEV) Object.assign(window, { __frigoloPwa: { setSwState } })

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** Da chiamare una volta all'avvio (main.tsx) */
export function setupServiceWorker() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
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
    onNeedRefresh: () => setSwState({ needRefresh: true }),
  })
}

/** Cerca una nuova versione adesso; ritorna true se ne ha trovata una in attesa */
export async function checkForUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  await registration.update()
  // l'evento onNeedRefresh arriva in modo asincrono: diamo un attimo
  await new Promise((resolve) => window.setTimeout(resolve, 800))
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
 * Attiva la nuova versione e ricarica. Non si affida solo al plugin: manda
 * SKIP_WAITING al worker in attesa e ricarica quando prende il controllo,
 * oppure comunque dopo 2,5 secondi (su iOS standalone il cambio di controller
 * a volte non arriva).
 */
export async function applyUpdate() {
  const registration =
    'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  const reloadWhenControlled = new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2500)
    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timeout)
        resolve()
      },
      { once: true },
    )
  })
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  } else if (updateServiceWorker) {
    void updateServiceWorker(false)
  }
  await reloadWhenControlled
  window.location.reload()
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
  /** iOS Safari: niente prompt, si spiega "Condividi > Aggiungi alla schermata Home" */
  isIos: boolean
}

const DISMISSED_KEY = 'frigolo.install-dismissed'

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installState: InstallState = { installed: false, canPrompt: false, isIos: false }
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
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)
  setInstallState({ installed: isStandalone(), isIos })

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    setInstallState({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
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
 * Il banner compare solo dopo il primo prodotto aggiunto (prima l'app deve
 * servire a qualcosa), se non è stato chiuso e non si è già installata.
 */
export function shouldOfferInstall(firstProductAdded: boolean): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    return firstProductAdded && !dismissed && !installState.installed
  } catch {
    return false
  }
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // ignorato
  }
  setInstallState({})
}

/** Mostra il prompt nativo; ritorna true se l'utente ha accettato */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  setInstallState({ canPrompt: false })
  return outcome === 'accepted'
}
