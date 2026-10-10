import { describe, expect, it } from 'vitest'
import { isNetworkAuthError, readStoredSession } from './sessionFallback'

function storageWith(value: string | null) {
  return { getItem: () => value }
}

describe('readStoredSession', () => {
  it('legge la sessione salvata', () => {
    const saved = JSON.stringify({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: 1,
      user: { id: 'u1' },
    })
    expect(readStoredSession(storageWith(saved), 'k')?.user.id).toBe('u1')
  })

  it('niente sessione, sessione rovinata o incompleta: null', () => {
    expect(readStoredSession(storageWith(null), 'k')).toBeNull()
    expect(readStoredSession(storageWith('{rotto'), 'k')).toBeNull()
    expect(readStoredSession(storageWith('{"access_token":"a"}'), 'k')).toBeNull()
    expect(
      readStoredSession(
        {
          getItem: () => {
            throw new Error('bloccato')
          },
        },
        'k',
      ),
    ).toBeNull()
  })
})

describe('isNetworkAuthError', () => {
  it('riconosce gli errori di rete', () => {
    expect(isNetworkAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toBe(true)
    expect(isNetworkAuthError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkAuthError({ message: 'Load failed' })).toBe(true)
  })

  it('un refresh token rifiutato non è un errore di rete', () => {
    expect(
      isNetworkAuthError({ name: 'AuthApiError', status: 400, message: 'Invalid Refresh Token' }),
    ).toBe(false)
    expect(isNetworkAuthError(null)).toBe(false)
  })
})
