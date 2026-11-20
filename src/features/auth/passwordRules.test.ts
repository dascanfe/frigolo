import { describe, expect, it } from 'vitest'
import { checkNewPassword, isSessionGone } from './passwordRules'

describe('checkNewPassword', () => {
  it('chiede almeno la lunghezza minima', () => {
    expect(checkNewPassword('corta', 'corta', 10).longEnough).toBe(false)
    expect(checkNewPassword('abbastanza1', '', 10).longEnough).toBe(true)
  })

  it('segnala la conferma diversa solo quando è scritta', () => {
    expect(checkNewPassword('abbastanza1', '', 10)).toMatchObject({
      matches: false,
      mismatch: false,
      valid: false,
    })
    expect(checkNewPassword('abbastanza1', 'abbastanza', 10)).toMatchObject({
      matches: false,
      mismatch: true,
      valid: false,
    })
  })

  it('è valida se è lunga abbastanza e coincide', () => {
    expect(checkNewPassword('abbastanza1', 'abbastanza1', 10).valid).toBe(true)
    expect(checkNewPassword('corta', 'corta', 10).valid).toBe(false)
  })
})

describe('isSessionGone', () => {
  it('riconosce la sessione del link che non vale più', () => {
    expect(isSessionGone({ code: 'session_not_found', message: '' })).toBe(true)
    expect(isSessionGone({ message: 'Auth session missing!' })).toBe(true)
    expect(
      isSessionGone({ code: 'same_password', message: 'New password should be different' }),
    ).toBe(false)
  })
})
