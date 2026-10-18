import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CAPTCHA_WAIT_MS, startTokenTimeout } from './turnstile'

describe('startTokenTimeout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('scatta dopo 6 secondi senza token', () => {
    const onTimeout = vi.fn()
    startTokenTimeout(onTimeout)
    vi.advanceTimersByTime(CAPTCHA_WAIT_MS - 1)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('non scatta se il token arriva e lo si annulla', () => {
    const onTimeout = vi.fn()
    const cancel = startTokenTimeout(onTimeout)
    cancel()
    vi.advanceTimersByTime(CAPTCHA_WAIT_MS * 2)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
