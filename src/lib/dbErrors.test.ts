import { describe, expect, it } from 'vitest'
import { describeDbError, describeQuotaError } from './dbErrors'

describe('errori del database', () => {
  it('riconosce le quote dalla chiave hint, non dal testo', () => {
    expect(describeQuotaError({ message: 'qualunque testo', hint: 'entries_quota' })).toMatch(
      /300 prodotti/,
    )
    expect(describeQuotaError({ message: 'Troppe voci', hint: 'lists_limit' })).toBeNull()
  })

  it('limiti, tentativi, rete e riserva', () => {
    expect(describeDbError({ hint: 'lists_limit' }, 'x')).toMatch(/2 liste/)
    expect(describeDbError({ hint: 'members_limit' }, 'x')).toMatch(/5 persone/)
    expect(describeDbError({ code: 'PT429' }, 'x')).toMatch(/Troppi tentativi/)
    expect(describeDbError(new TypeError('Failed to fetch'), 'x')).toMatch(/connessione/)
    expect(describeDbError({ message: 'boh' }, 'Riserva')).toBe('Riserva')
  })
})
