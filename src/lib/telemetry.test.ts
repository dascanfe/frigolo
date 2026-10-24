import { describe, expect, it } from 'vitest'
import { doveRender, messaggioRender, ripulisci } from './telemetry'

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

describe('errori di render', () => {
  it("il messaggio ha il prefisso [render], il nome dell'errore e dove è successo", () => {
    const errore = new TypeError('x is undefined')
    errore.stack =
      'TypeError: x is undefined\n    at Ce (https://frigolo.app/assets/index-AbC123.js:12:34567)'
    const testo = messaggioRender(
      errore,
      '\n    at CatalogScreen (https://x/assets/a.js:1:2)\n    at div',
    )
    expect(testo).toMatch(
      /^\[render\] TypeError: x is undefined @ CatalogScreen index-AbC123\.js:12:/,
    )
    expect(testo.length).toBeLessThanOrEqual(200)
  })

  it('senza stack resta il solo messaggio ripulito', () => {
    expect(messaggioRender('rotto per mario@example.com')).toBe('[render] rotto per <email>')
  })

  it('un messaggio lunghissimo non fa perdere la posizione e resta nei 200 caratteri', () => {
    const errore = new Error('m '.repeat(400))
    errore.stack = 'Error\n    at f (https://x/assets/index-a.js:7:8)'
    const testo = messaggioRender(errore, null)
    expect(testo.length).toBeLessThanOrEqual(200)
    expect(testo).toMatch(/@ index-a\.js:7:8$/)
  })

  it('senza stack dei componenti usa la funzione della prima riga e ignora ?t= di sviluppo', () => {
    const errore = new Error('boom')
    errore.stack =
      'Error: boom\n    at CatalogScreen (http://localhost:5173/src/features/catalog/CatalogScreen.tsx?t=1792:25:3)'
    expect(doveRender(errore)).toBe('CatalogScreen CatalogScreen.tsx:25:3')
  })

  it('doveRender legge anche lo stack di Safari (nome@url:riga:colonna)', () => {
    const errore = new Error('boom')
    errore.stack = 'render@https://x/assets/index-Zz.js:3:9\nother@https://x/assets/index-Zz.js:4:1'
    expect(doveRender(errore)).toBe('index-Zz.js:3:9')
  })
})
