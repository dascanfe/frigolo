import { describe, expect, it } from 'vitest'
import {
  inviteCodeFromPath,
  inviteLink,
  isCompleteInviteCode,
  normalizeInviteCode,
} from './inviteCode'

describe('normalizeInviteCode', () => {
  it('mette in maiuscolo e toglie spazi e trattini', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345')
    expect(normalizeInviteCode('ab cd 23 45')).toBe('ABCD2345')
  })

  it('prende il codice da un link incollato', () => {
    expect(normalizeInviteCode('https://frigolo.dascanfe.com/invito/abcd2345')).toBe('ABCD2345')
    expect(normalizeInviteCode('Entra qui: https://x.it/invito/WXYZ9876?utm=1 grazie')).toBe(
      'WXYZ9876',
    )
  })

  it('taglia a 8 caratteri e scarta i simboli', () => {
    expect(normalizeInviteCode('abcd2345xyz')).toBe('ABCD2345')
    expect(normalizeInviteCode('àb#c!')).toBe('BC')
    expect(isCompleteInviteCode('ABCD234')).toBe(false)
    expect(isCompleteInviteCode('ABCD2345')).toBe(true)
  })
})

describe('inviteCodeFromPath', () => {
  it('riconosce /invito/:code', () => {
    expect(inviteCodeFromPath('/invito/abcd2345')).toBe('ABCD2345')
    expect(inviteCodeFromPath('/invito/ABCD-2345/')).toBe('ABCD2345')
    expect(inviteCodeFromPath('/Invito/abcd2345')).toBe('ABCD2345')
  })

  it('ignora gli altri percorsi', () => {
    expect(inviteCodeFromPath('/')).toBeNull()
    expect(inviteCodeFromPath('/invito/')).toBeNull()
    expect(inviteCodeFromPath('/invito/abc/altro')).toBeNull()
    expect(inviteCodeFromPath('/impostazioni')).toBeNull()
  })
})

describe('inviteLink', () => {
  it('costruisce il link senza doppie barre', () => {
    expect(inviteLink('https://frigolo.dascanfe.com/', 'ABCD2345')).toBe(
      'https://frigolo.dascanfe.com/invito/ABCD2345',
    )
  })
})
