import { describe, expect, it } from 'vitest'
import { nameFromEmail } from './nameFromEmail'

describe('nameFromEmail', () => {
  it('propone il nome dalla parte prima della @', () => {
    expect(nameFromEmail('marta@example.com')).toBe('Marta')
    expect(nameFromEmail('marta.rossi@example.com')).toBe('Marta Rossi')
  })

  it('niente proposta se non sembra un nome', () => {
    expect(nameFromEmail('mr1987@example.com')).toBe('')
    expect(nameFromEmail(undefined)).toBe('')
    expect(nameFromEmail('a.b.c.d@example.com')).toBe('')
  })
})
