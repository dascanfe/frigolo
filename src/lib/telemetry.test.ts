import { describe, expect, it } from 'vitest'
import { ripulisci } from './telemetry'

describe('ripulisci', () => {
  it('toglie email, id, parametri, token e numeri lunghi', () => {
    const t = ripulisci(
      'Errore per mario.rossi@example.com su 3f2b1c4d-1111-4222-8333-444455556666 codice 123456 https://x.it/a?token=segreto chiave abcdefghijklmnopqrstuvwxyz',
    )
    expect(t).not.toMatch(/@|3f2b1c4d|123456|segreto|abcdefghij/)
    expect(t).toContain('<email>')
    expect(t).toContain('<id>')
    expect(t).toContain('<n>')
    expect(t).toContain('<token>')
  })

  it('accorcia i messaggi lunghi', () => {
    expect(ripulisci('x '.repeat(500), 50).length).toBeLessThanOrEqual(50)
  })
})
