import { describe, expect, it } from 'vitest'

// pwa.ts importa il modulo virtuale del plugin: lo simuliamo
import { vi } from 'vitest'
vi.mock('virtual:pwa-register', () => ({ registerSW: () => async () => {} }))

const { shouldReloadOnResume, BACKGROUND_RELOAD_AFTER_MS } = await import('./pwa')

describe('shouldReloadOnResume', () => {
  it('non ricarica se non c e una versione nuova', () => {
    expect(shouldReloadOnResume(false, BACKGROUND_RELOAD_AFTER_MS * 10)).toBe(false)
  })
  it('non ricarica per un background breve (cambio app veloce)', () => {
    expect(shouldReloadOnResume(true, 10_000)).toBe(false)
  })
  it('ricarica dopo qualche minuto in background', () => {
    expect(shouldReloadOnResume(true, BACKGROUND_RELOAD_AFTER_MS)).toBe(true)
  })
})
