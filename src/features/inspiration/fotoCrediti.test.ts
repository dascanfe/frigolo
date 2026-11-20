import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FOTO_CREDITI, fotoDelPiatto, slugPiatto } from './fotoCrediti'
import { MESI } from './mesi'

const CARTELLA = new URL('../../../public/ricette/', import.meta.url)
const piatti = MESI.flatMap((m) => m.piatti.map((p) => p.nome))
const slugPiatti = new Set(piatti.map(slugPiatto))

describe('foto delle ricette', () => {
  it('slugPiatto toglie accenti, apostrofi e virgole', () => {
    expect(slugPiatto("Torta all'arancia")).toBe('torta-all-arancia')
    expect(slugPiatto('Rucola, fragole e grana')).toBe('rucola-fragole-e-grana')
    expect(slugPiatto('Tiramisù al panettone')).toBe('tiramisu-al-panettone')
    expect(slugPiatto('Baccalà in umido')).toBe('baccala-in-umido')
  })

  it('ogni piatto ha uno slug diverso', () => {
    expect(slugPiatti.size).toBe(piatti.length)
  })

  it('ogni credito è di un piatto vero e la sua foto esiste sul disco', () => {
    for (const slug of Object.keys(FOTO_CREDITI)) {
      expect(slugPiatti.has(slug), `credito senza piatto: ${slug}`).toBe(true)
      const file = new URL(`${slug}.webp`, CARTELLA)
      expect(existsSync(file), `foto mancante: public/ricette/${slug}.webp`).toBe(true)
      // obiettivo 40-80 KB: 120 KB è il tetto oltre il quale qualcosa è andato storto
      expect(statSync(file).size).toBeLessThan(120 * 1024)
    }
  })

  it('ogni foto sul disco ha il suo credito', () => {
    const foto = readdirSync(CARTELLA).filter((f) => f.endsWith('.webp'))
    for (const file of foto) {
      expect(FOTO_CREDITI[file.replace(/\.webp$/, '')], `foto senza credito: ${file}`).toBeDefined()
    }
  })

  it('ogni credito ha autore, fonte, licenza libera e pagina originale', () => {
    for (const [slug, c] of Object.entries(FOTO_CREDITI)) {
      expect(c.autore.trim(), slug).not.toBe('')
      expect(c.pagina, slug).toMatch(/^https:\/\//)
      if (c.fonte === 'Wikimedia Commons') {
        expect(c.licenza, slug).toMatch(/^(CC0|CC BY(-SA)? \d\.\d)$/)
        expect(c.licenzaUrl, slug).toMatch(/^https:\/\/creativecommons\.org\//)
      } else {
        expect(c.licenza, slug).toBe(c.fonte === 'Unsplash' ? 'Licenza Unsplash' : 'Licenza Pexels')
      }
    }
  })

  it('un piatto senza foto non ne restituisce una', () => {
    expect(fotoDelPiatto('Piatto che non esiste')).toBeNull()
  })
})
