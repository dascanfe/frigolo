import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ILLUSTRAZIONI, illustrazioneDelPiatto, slugPiatto } from './illustrazioni'
import { MESI } from './mesi'

const CARTELLA = new URL('../../../public/ricette/', import.meta.url)
const piatti = MESI.flatMap((m) => m.piatti.map((p) => p.nome))
const slugPiatti = new Set(piatti.map(slugPiatto))

describe('illustrazioni delle ricette', () => {
  it('slugPiatto toglie accenti, apostrofi e virgole', () => {
    expect(slugPiatto("Torta all'arancia")).toBe('torta-all-arancia')
    expect(slugPiatto('Rucola, fragole e grana')).toBe('rucola-fragole-e-grana')
    expect(slugPiatto('Tiramisù al panettone')).toBe('tiramisu-al-panettone')
  })

  it('ogni piatto ha uno slug diverso', () => {
    expect(slugPiatti.size).toBe(piatti.length)
  })

  it('ogni illustrazione è di un piatto vero ed esiste sul disco, leggera', () => {
    for (const slug of ILLUSTRAZIONI) {
      expect(slugPiatti.has(slug), `illustrazione senza piatto: ${slug}`).toBe(true)
      const file = new URL(`${slug}.webp`, CARTELLA)
      expect(existsSync(file), `manca public/ricette/${slug}.webp`).toBe(true)
      expect(statSync(file).size).toBeLessThan(120 * 1024)
    }
  })

  it("ogni file sul disco è nell'elenco", () => {
    for (const file of readdirSync(CARTELLA).filter((f) => f.endsWith('.webp'))) {
      expect(ILLUSTRAZIONI.has(file.replace(/\.webp$/, '')), file).toBe(true)
    }
  })

  it('ogni piatto ha la sua illustrazione', () => {
    for (const nome of piatti) expect(illustrazioneDelPiatto(nome), nome).not.toBeNull()
  })

  it('un piatto senza illustrazione restituisce null', () => {
    expect(illustrazioneDelPiatto('Piatto che non esiste')).toBeNull()
  })
})
