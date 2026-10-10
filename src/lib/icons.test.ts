import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CATEGORY_ICON_SUGGESTIONS, ICON_KEYWORDS } from './iconKeywords'
import { ICON_NAMES, getIcon } from './icons'

const seed = readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8')

/** Icone dei prodotti e delle categorie nel seed: ('slug', 'Nome', 'Icona', ...) */
function seedIcons(): string[] {
  const icons = new Set<string>()
  for (const match of seed.matchAll(/\(\s*'[^']+',\s*'(?:[^']|'')+',\s*'([A-Z][A-Za-z0-9]+)'/g)) {
    if (match[1]) icons.add(match[1])
  }
  return [...icons]
}

describe('icone', () => {
  it('ogni icona usata nel seed esiste nel catalogo', () => {
    const icons = seedIcons()
    expect(icons.length).toBeGreaterThan(50)
    const missing = icons.filter((name) => !(ICON_NAMES as readonly string[]).includes(name))
    expect(missing).toEqual([])
  })

  it('suggerimenti e parole chiave puntano a icone esistenti', () => {
    const names = ICON_NAMES as readonly string[]
    for (const list of Object.values(CATEGORY_ICON_SUGGESTIONS)) {
      expect(list.filter((name) => !names.includes(name))).toEqual([])
    }
    expect(Object.keys(ICON_KEYWORDS).filter((name) => !names.includes(name))).toEqual([])
  })

  it('le icone custom si risolvono (niente ripiego sul cestino)', () => {
    for (const name of ['Raspberry', 'Blueberry', 'Mozzarella', 'Flatbread', 'Cucumber']) {
      expect(getIcon(name), name).not.toBe(getIcon('ShoppingBasket'))
    }
  })
})
