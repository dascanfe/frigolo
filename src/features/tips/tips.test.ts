import { beforeEach, describe, expect, it } from 'vitest'
import { dismissTip, getCurrentTip, resetTipsForTests, triggerTip } from './tips'

const store = new Map<string, string>()
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  },
})

describe('suggerimenti al primo uso', () => {
  beforeEach(() => {
    store.clear()
    resetTipsForTests()
  })

  it("uno per volta, nell'ordine in cui arrivano", () => {
    triggerTip('cart')
    triggerTip('finish')
    expect(getCurrentTip()).toBe('cart')
    dismissTip('cart')
    expect(getCurrentTip()).toBe('finish')
  })

  it('un suggerimento già visto non torna', () => {
    triggerTip('added')
    dismissTip('added')
    triggerTip('added')
    expect(getCurrentTip()).toBeNull()
  })

  it('niente doppioni in coda', () => {
    triggerTip('added')
    triggerTip('added')
    dismissTip('added')
    expect(getCurrentTip()).toBeNull()
  })
})

describe('chi ha già fatto la spesa', () => {
  beforeEach(() => {
    store.clear()
    resetTipsForTests()
  })

  it('non vede suggerimenti, né in coda né dopo', async () => {
    const { suppressAllTips } = await import('./tips')
    triggerTip('added')
    suppressAllTips()
    expect(getCurrentTip()).toBeNull()
    triggerTip('cart')
    expect(getCurrentTip()).toBeNull()
  })
})
