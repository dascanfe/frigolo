import { describe, expect, it } from 'vitest'
import { describeDbError, describeQuotaError } from './dbErrors'

describe('describeDbError', () => {
  it('traduce i limiti della migration 0020', () => {
    expect(describeQuotaError({ message: 'Troppe voci nella lista (massimo 300)' })).toMatch(
      /300 prodotti/,
    )
    expect(describeQuotaError(new Error('Troppi articoli in questa spesa (massimo 300)'))).toMatch(
      /carrello/,
    )
  })

  it('rete e riserva', () => {
    expect(describeDbError(new TypeError('Failed to fetch'), 'x')).toMatch(/connessione/)
    expect(describeDbError({ message: 'boh' }, 'Riserva')).toBe('Riserva')
    expect(describeQuotaError(null)).toBeNull()
  })
})
