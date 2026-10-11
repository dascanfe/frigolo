import { describe, expect, it } from 'vitest'
import { parseAuthConfirm } from './authConfirm'

describe('parseAuthConfirm', () => {
  it('legge token_hash e type', () => {
    expect(parseAuthConfirm('/auth/confirm', '?token_hash=abc123&type=signup')).toEqual({
      tokenHash: 'abc123',
      type: 'signup',
    })
    expect(parseAuthConfirm('/auth/confirm/', '?type=recovery&token_hash=xyz')).toEqual({
      tokenHash: 'xyz',
      type: 'recovery',
    })
  })

  it('scarta percorsi, tipi o token sbagliati', () => {
    expect(parseAuthConfirm('/auth/altro', '?token_hash=a&type=signup')).toBeNull()
    expect(parseAuthConfirm('/auth/confirm', '?token_hash=a&type=boh')).toBeNull()
    expect(parseAuthConfirm('/auth/confirm', '?type=signup')).toBeNull()
  })
})
