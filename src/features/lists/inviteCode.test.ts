import { describe, expect, it } from 'vitest'
import {
  inviteCodeFromPath,
  inviteLink,
  isCompleteInviteCode,
  normalizeInviteCode,
  parseInvite,
} from './inviteCode'

const TOKEN = 'aB3_x-Yz09QwErTyUiOpAs'

describe('normalizeInviteCode', () => {
  it('mette in maiuscolo e toglie spazi e trattini', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345')
    expect(normalizeInviteCode('ab cd 23 45')).toBe('ABCD2345')
  })

  it('taglia a 8 caratteri e scarta i simboli', () => {
    expect(normalizeInviteCode('abcd2345xyz')).toBe('ABCD2345')
    expect(normalizeInviteCode('àb#c!')).toBe('BC')
    expect(isCompleteInviteCode('ABCD234')).toBe(false)
    expect(isCompleteInviteCode('ABCD2345')).toBe(true)
  })
})

describe('parseInvite', () => {
  it('dal link prende il token senza toccare maiuscole e minuscole', () => {
    expect(parseInvite(`https://frigolo.dascanfe.com/invito/${TOKEN}`)).toBe(TOKEN)
    expect(parseInvite(`Entra qui: https://x.it/invito/${TOKEN}?utm=1 grazie`)).toBe(TOKEN)
    expect(parseInvite(TOKEN)).toBe(TOKEN)
  })

  it('un codice corto si normalizza, anche dentro un link', () => {
    expect(parseInvite('abcd-2345')).toBe('ABCD2345')
    expect(parseInvite('https://x.it/invito/abcd2345')).toBe('ABCD2345')
  })

  it('niente di utilizzabile: null', () => {
    expect(parseInvite('  ')).toBeNull()
    expect(parseInvite('???')).toBeNull()
  })
})

describe('inviteCodeFromPath', () => {
  it('riconosce /invito/<token> e /invito/<codice>', () => {
    expect(inviteCodeFromPath(`/invito/${TOKEN}`)).toBe(TOKEN)
    expect(inviteCodeFromPath(`/invito/${TOKEN}/`)).toBe(TOKEN)
    expect(inviteCodeFromPath('/invito/abcd-2345')).toBe('ABCD2345')
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
    expect(inviteLink('https://frigolo.dascanfe.com/', TOKEN)).toBe(
      `https://frigolo.dascanfe.com/invito/${TOKEN}`,
    )
  })
})
