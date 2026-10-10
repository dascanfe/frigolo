import { describe, expect, it } from 'vitest'
import { fuzzySearch, hasExactMatch, levenshtein, normalize, scoreMatch } from './fuzzy'

const CATALOG = [
  'Fragole',
  'Farina',
  'Fagiolini',
  'Fagioli in scatola',
  'Latte fresco',
  'Latte a lunga conservazione',
  'Latte senza lattosio',
  "Caffe' macinato",
  'Pane',
  'Pancarre',
  'Panna da cucina',
  'Zucchine',
  'Zucca',
  'Zucchero',
  'Pomodori',
  'Pomodorini',
  'Uova',
  'Cioccolato al latte',
]

describe('normalize', () => {
  it('toglie accenti, apostrofi e maiuscole', () => {
    expect(normalize('Caffè')).toBe('caffe')
    expect(normalize("Caffe' macinato")).toBe('caffe macinato')
    expect(normalize('  Pancarré  ')).toBe('pancarre')
    expect(normalize('Latte a lunga-conservazione')).toBe('latte a lunga conservazione')
  })
})

describe('levenshtein', () => {
  it('calcola la distanza', () => {
    expect(levenshtein('fragole', 'fragole')).toBe(0)
    expect(levenshtein('fragole', 'fragol')).toBe(1)
    expect(levenshtein('fragole', 'fargole')).toBe(2)
    expect(levenshtein('', 'abc')).toBe(3)
  })
  it('esce presto oltre il massimo', () => {
    expect(levenshtein('fragole', 'zucchero', 2)).toBeGreaterThan(2)
  })
})

describe('scoreMatch', () => {
  it('premia esatto > prefisso > prefisso di parola > sottostringa > refuso', () => {
    expect(scoreMatch('pane', 'pane')).toBeGreaterThan(scoreMatch('pan', 'pane'))
    expect(scoreMatch('pan', 'pane')).toBeGreaterThan(scoreMatch('fresco', 'latte fresco'))
    expect(scoreMatch('fresco', 'latte fresco')).toBeGreaterThan(scoreMatch('att', 'latte fresco'))
    expect(scoreMatch('att', 'latte fresco')).toBeGreaterThan(scoreMatch('fragl', 'fragole'))
  })
  it('con 1-2 caratteri considera solo i prefissi', () => {
    expect(scoreMatch('fr', 'fragole')).toBeGreaterThan(0)
    expect(scoreMatch('ra', 'fragole')).toBe(0)
  })
  it('tollera un refuso su query corte e due su query lunghe', () => {
    expect(scoreMatch('frgole', 'fragole')).toBeGreaterThan(0)
    expect(scoreMatch('fargole', 'fragole')).toBeGreaterThan(0)
    expect(scoreMatch('pomodro', 'pomodori')).toBeGreaterThan(0)
    expect(scoreMatch('zuca', 'zucca')).toBeGreaterThan(0)
    expect(scoreMatch('xyzw', 'fragole')).toBe(0)
  })
})

describe('fuzzySearch', () => {
  const search = (q: string, limit?: number) =>
    fuzzySearch(q, CATALOG, (n) => n, limit).map((r) => r.item)

  it('mette prima i prefissi, poi il resto in ordine alfabetico a pari punteggio', () => {
    expect(search('latte')).toEqual([
      'Latte a lunga conservazione',
      'Latte fresco',
      'Latte senza lattosio',
      'Cioccolato al latte',
    ])
  })

  it('trova per parola interna e per sottostringa', () => {
    expect(search('fresco')).toEqual(['Latte fresco'])
    expect(search('scatola')).toEqual(['Fagioli in scatola'])
    expect(search('lung')).toContain('Latte a lunga conservazione')
  })

  it('tollera refusi e accenti', () => {
    expect(search('fragl')).toContain('Fragole')
    expect(search('caffè')).toEqual(["Caffe' macinato"])
    expect(search('zuchine')).toContain('Zucchine')
  })

  it('con un refuso preferisce il match sulla prima parola', () => {
    const results = search('lattee')
    expect(results.slice(0, 3)).toEqual([
      'Latte a lunga conservazione',
      'Latte fresco',
      'Latte senza lattosio',
    ])
    expect(results.indexOf('Cioccolato al latte')).toBeGreaterThan(2)
  })

  it('non confonde prodotti diversi con prefisso comune', () => {
    const results = search('zucca')
    expect(results[0]).toBe('Zucca')
    expect(results).not.toContain('Fragole')
  })

  it('rispetta il limite e ignora la query vuota', () => {
    expect(search('p', 2)).toHaveLength(2)
    expect(search('   ')).toEqual([])
  })
})

describe('hasExactMatch', () => {
  it('confronta i nomi normalizzati', () => {
    expect(hasExactMatch('FRAGOLE', CATALOG, (n) => n)).toBe(true)
    expect(hasExactMatch('caffè macinato', CATALOG, (n) => n)).toBe(true)
    expect(hasExactMatch('fragol', CATALOG, (n) => n)).toBe(false)
  })
})
