import { describe, expect, it } from 'vitest'
import {
  fuzzySearch,
  hasExactMatch,
  levenshtein,
  maxTypos,
  normalize,
  scoreMatch,
  scoreTypo,
} from './fuzzy'

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
    expect(scoreMatch('fresco', 'latte fresco')).toBeGreaterThan(scoreMatch('atte', 'latte fresco'))
    expect(scoreMatch('atte', 'latte fresco')).toBeGreaterThan(0)
    expect(scoreMatch('atte', 'latte fresco')).toBeGreaterThan(scoreTypo('fragle', 'fragole'))
  })
  it('la sottostringa vale solo da 4 caratteri', () => {
    expect(scoreMatch('cacc', 'focaccia')).toBeGreaterThan(0)
    expect(scoreMatch('acc', 'focaccia')).toBe(0)
  })
  it('con 1-2 caratteri considera solo i prefissi', () => {
    expect(scoreMatch('fr', 'fragole')).toBeGreaterThan(0)
    expect(scoreMatch('ra', 'fragole')).toBe(0)
  })
})

describe('scoreTypo', () => {
  it('la tolleranza cresce con la lunghezza della query', () => {
    expect(maxTypos(4)).toBe(0)
    expect(maxTypos(5)).toBe(1)
    expect(maxTypos(6)).toBe(1)
    expect(maxTypos(7)).toBe(2)
  })
  it('tollera un refuso su query corte e due su query lunghe', () => {
    expect(scoreTypo('frgole', 'fragole')).toBeGreaterThan(0)
    expect(scoreTypo('fargole', 'fragole')).toBeGreaterThan(0)
    expect(scoreTypo('pomodro', 'pomodori')).toBeGreaterThan(0)
    expect(scoreTypo('zucca', 'zuccca')).toBeGreaterThan(0)
    expect(scoreTypo('xyzw', 'fragole')).toBe(0)
  })
  it('sotto i 5 caratteri non tollera niente', () => {
    expect(scoreTypo('lata', 'latte')).toBe(0)
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
    expect(search('lunga')).toContain('Latte a lunga conservazione')
  })

  it('tollera refusi e accenti', () => {
    expect(search('fragole')).toContain('Fragole')
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

/** Casi reali: nomi del catalogo base (supabase/seed.sql) */
const REAL = [
  'Focaccia',
  'Cacao in polvere',
  'Cachi',
  'Carciofi',
  'Tacchino',
  "Sacchetti per l'umido",
  'Latte a lunga conservazione',
  'Latte di avena',
  'Latte fresco',
  'Latte senza lattosio',
  'Cioccolato al latte',
  'Gelato',
  'Insalata',
  'Marmellata',
  'Pelati',
  'Pizza surgelata',
  'Pomodori',
  'Pomodorini',
  'Passata di pomodoro',
  'Caffè in capsule',
  'Caffè macinato',
  'Biscotti',
  'Fette biscottate',
  'Pane',
  'Pangrattato',
  'Panna da cucina',
  'Aceto',
  'Acqua frizzante',
]

describe('ricerca su casi reali', () => {
  const search = (q: string, options?: Parameters<typeof fuzzySearch<string>>[3]) =>
    fuzzySearch(q, REAL, (n) => n, options).map((r) => r.item)

  it('"cacc" non inonda di nomi strani: niente refusi con query così corte', () => {
    const results = search('cacc')
    expect(results).toEqual(['Focaccia'])
  })

  it('"lat" mostra i latte e il resto con la parola "latte", non "gelato" o "insalata"', () => {
    expect(search('lat')).toEqual([
      'Latte a lunga conservazione',
      'Latte di avena',
      'Latte fresco',
      'Latte senza lattosio',
      'Cioccolato al latte',
    ])
  })

  it('"pomod" porta prima i nomi che iniziano così, poi la parola dentro il nome', () => {
    expect(search('pomod')).toEqual(['Pomodori', 'Pomodorini', 'Passata di pomodoro'])
  })

  it('"caffe" senza accento trova i caffè', () => {
    expect(search('caffe')).toEqual(['Caffè in capsule', 'Caffè macinato'])
    expect(search('CAFFÈ')).toEqual(['Caffè in capsule', 'Caffè macinato'])
  })

  it('un errore di battitura trova il prodotto, ma dopo i risultati esatti', () => {
    expect(search('pomdoro')).toContain('Pomodori')
    expect(search('biscoti')).toContain('Biscotti')
    expect(search('lattee')[0]).toBe('Latte a lunga conservazione')
  })

  it('i refusi non entrano quando i risultati esatti sono abbastanza', () => {
    const many = ['Pane 1', 'Pane 2', 'Pane 3', 'Pane 4', 'Pane 5', 'Pene']
    const results = fuzzySearch('pane', many, (n) => n).map((r) => r.item)
    expect(results).not.toContain('Pene')
    expect(fuzzySearch('panee', many, (n) => n).map((r) => r.item)).toContain('Pane 1')
  })

  it("a pari punteggio vince il più comprato, poi l'ordine alfabetico", () => {
    const bought = new Map([
      ['Latte fresco', 12],
      ['Latte di avena', 3],
    ])
    const results = search('latte', { getFrequency: (n) => bought.get(n) ?? 0 })
    expect(results.slice(0, 4)).toEqual([
      'Latte fresco',
      'Latte di avena',
      'Latte a lunga conservazione',
      'Latte senza lattosio',
    ])
  })

  it('il punteggio batte la frequenza: chi inizia con la query sta prima', () => {
    const results = search('pane', { getFrequency: (n) => (n === 'Pangrattato' ? 99 : 0) })
    expect(results[0]).toBe('Pane')
  })
})
