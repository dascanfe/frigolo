import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MESI } from '@/features/inspiration/mesi'
import { CATEGORY_SLUGS } from '@/types/domain'
import { isIconName } from './icons'

/**
 * Il catalogo base vive in supabase/seed.sql (e le migration 0029 e 0032 aggiungono
 * i prodotti nuovi a un database già in uso). Qui si legge il testo SQL e si
 * controlla che ogni prodotto sia valido per l'app: icona esistente, unità
 * ammessa, mesi 1-12, nomi unici, categoria conosciuta.
 */
interface Riga {
  slug: string
  nome: string
  icona: string
  unita: string
  mesi: number[]
}

const RIGA = /^\s+\('([a-z-]+)', '((?:[^']|'')+)', '(\w+)', '(\w+)', '\{([\d,]*)\}'\),?$/

function righe(file: string): Riga[] {
  const testo = readFileSync(new URL(file, import.meta.url), 'utf8')
  const result: Riga[] = []
  for (const linea of testo.split('\n')) {
    const m = RIGA.exec(linea)
    if (!m) continue
    result.push({
      slug: m[1]!,
      nome: m[2]!.replaceAll("''", "'"),
      icona: m[3]!,
      unita: m[4]!,
      mesi: m[5] ? m[5].split(',').map(Number) : [],
    })
  }
  return result
}

const seed = righe('../../supabase/seed.sql')
const migration = righe('../../supabase/migrations/0029_catalogo_esteso.sql')
const migrationRicette = righe(
  '../../supabase/migrations/0032_catalogo_ricette_e_nuovi_prodotti.sql',
)

describe('catalogo base (seed.sql)', () => {
  it('ha tra 600 e 660 prodotti', () => {
    expect(seed.length).toBeGreaterThanOrEqual(600)
    expect(seed.length).toBeLessThanOrEqual(660)
  })

  it('ogni icona esiste nel catalogo delle icone', () => {
    const sconosciute = seed.filter((r) => !isIconName(r.icona)).map((r) => `${r.nome}: ${r.icona}`)
    expect(sconosciute).toEqual([])
  })

  it('unità ammesse, mesi da 1 a 12, nomi di lunghezza valida', () => {
    for (const r of seed) {
      expect(['pz', 'kg', 'g', 'l', 'ml', 'conf'], r.nome).toContain(r.unita)
      expect(
        r.mesi.every((m) => m >= 1 && m <= 12),
        r.nome,
      ).toBe(true)
      expect(new Set(r.mesi).size, r.nome).toBe(r.mesi.length)
      expect(r.nome.length, r.nome).toBeLessThanOrEqual(60)
    }
  })

  it('i nomi sono unici (senza badare alle maiuscole)', () => {
    const visti = new Set<string>()
    const doppi: string[] = []
    for (const r of seed) {
      const k = r.nome.toLowerCase()
      if (visti.has(k)) doppi.push(r.nome)
      visti.add(k)
    }
    expect(doppi).toEqual([])
  })

  it('ogni prodotto sta in una categoria conosciuta e ogni categoria ha prodotti', () => {
    const slugs = new Set<string>(CATEGORY_SLUGS)
    expect(seed.filter((r) => !slugs.has(r.slug)).map((r) => r.nome)).toEqual([])
    for (const slug of CATEGORY_SLUGS) {
      expect(
        seed.some((r) => r.slug === slug),
        slug,
      ).toBe(true)
    }
  })

  it('carne e pesce sono due categorie', () => {
    expect(CATEGORY_SLUGS).not.toContain('carne-pesce')
    expect(seed.find((r) => r.nome === 'Salmone')?.slug).toBe('pesce')
    expect(seed.find((r) => r.nome === 'Bistecca')?.slug).toBe('carne')
  })

  it('ogni mese ha frutta e verdura di stagione', () => {
    for (let mese = 1; mese <= 12; mese++) {
      const frutta = seed.filter((r) => r.slug === 'frutta' && r.mesi.includes(mese))
      const verdura = seed.filter((r) => r.slug === 'verdura' && r.mesi.includes(mese))
      expect(frutta.length, `frutta ${mese}`).toBeGreaterThanOrEqual(2)
      expect(verdura.length, `verdura ${mese}`).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('migration 0029', () => {
  it('ogni prodotto nuovo è anche nel seed, identico', () => {
    expect(migration.length).toBeGreaterThan(200)
    const perNome = new Map(seed.map((r) => [r.nome, r]))
    for (const r of migration) expect(perNome.get(r.nome), r.nome).toEqual(r)
  })
})

describe('migration 0032 (ingredienti delle ricette e prodotti nuovi)', () => {
  it('i 124 prodotti nuovi sono anche nel seed, identici', () => {
    expect(migrationRicette).toHaveLength(124)
    const perNome = new Map(seed.map((r) => [r.nome, r]))
    for (const r of migrationRicette) expect(perNome.get(r.nome), r.nome).toEqual(r)
  })

  it('gli ingredienti aggiunti per le ricette servono a Ispirazioni', () => {
    const usati = new Set(MESI.flatMap((m) => m.piatti.flatMap((p) => p.ingredienti)))
    const nuovi = new Set(migrationRicette.map((r) => r.nome))
    for (const nome of [
      'Alloro',
      'Carne per brodo',
      'Ricotta salata',
      'Giardiniera',
      'Ditalini',
      'Trofie',
      'Riso parboiled',
      'Fagioli borlotti',
      'Fagioli cannellini',
      'Gallina',
      'Lievito di birra',
    ]) {
      expect(nuovi.has(nome), nome).toBe(true)
      expect(usati.has(nome), nome).toBe(true)
    }
  })
})

describe('Ispirazioni (mesi.ts)', () => {
  const nomi = new Set(seed.map((r) => r.nome.toLowerCase()))

  it('ci sono tutti i 12 mesi, con 5 idee ciascuno', () => {
    expect(MESI).toHaveLength(12)
    for (const mese of MESI) expect(mese.piatti, mese.nome).toHaveLength(5)
  })

  it('ogni ingrediente è un prodotto del catalogo', () => {
    const mancanti: string[] = []
    for (const mese of MESI)
      for (const piatto of mese.piatti)
        for (const ing of piatto.ingredienti)
          if (!nomi.has(ing.toLowerCase())) mancanti.push(`${mese.nome} / ${piatto.nome}: ${ing}`)
    expect(mancanti).toEqual([])
  })

  it('ogni piatto ha da 4 a 10 ingredienti, senza acqua, sale e pepe', () => {
    const scontati = new Set(['acqua naturale', 'sale', 'sale grosso', 'pepe nero'])
    for (const mese of MESI)
      for (const piatto of mese.piatti) {
        expect(piatto.ingredienti.length, piatto.nome).toBeGreaterThanOrEqual(4)
        expect(piatto.ingredienti.length, piatto.nome).toBeLessThanOrEqual(10)
        for (const ing of piatto.ingredienti)
          expect(scontati.has(ing.toLowerCase()), `${piatto.nome}: ${ing}`).toBe(false)
      }
  })

  it('ogni piatto ha un procedimento di 3-5 passi non vuoti, con dosi per 2 persone', () => {
    for (const mese of MESI)
      for (const piatto of mese.piatti) {
        expect(piatto.procedimento.length, piatto.nome).toBeGreaterThanOrEqual(3)
        expect(piatto.procedimento.length, piatto.nome).toBeLessThanOrEqual(5)
        for (const passo of piatto.procedimento) {
          expect(passo.trim().length, piatto.nome).toBeGreaterThan(20)
          // passi brevi: una o due frasi
          expect(passo.length, `${piatto.nome}: ${passo}`).toBeLessThanOrEqual(260)
          // le dosi sono per 2: nessun residuo di ricette per 4 o 6 persone
          expect(passo, piatto.nome).not.toMatch(/per [3-9] persone/i)
        }
      }
  })

  it("nomi dei piatti unici in tutto l'anno", () => {
    const nomi = MESI.flatMap((m) => m.piatti.map((p) => p.nome.toLowerCase()))
    expect(new Set(nomi).size).toBe(nomi.length)
  })

  it('testi senza trattini lunghi o medi e senza ingredienti ripetuti', () => {
    const testo = JSON.stringify(MESI)
    // codici U+2013 e U+2014, scritti a codice per non avere i trattini nel file
    expect(testo).not.toMatch(
      new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`),
    )
    for (const mese of MESI)
      for (const piatto of mese.piatti)
        expect(new Set(piatto.ingredienti).size, piatto.nome).toBe(piatto.ingredienti.length)
  })
})
