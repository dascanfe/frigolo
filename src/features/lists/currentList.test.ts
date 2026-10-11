import { describe, expect, it } from 'vitest'
import { pickCurrentList } from './currentList'

const lists = [
  { id: 'ufficio', joinedAt: '2026-10-05T10:00:00Z' },
  { id: 'casa', joinedAt: '2025-01-01T08:00:00Z' },
  { id: 'mare', joinedAt: '2026-07-01T09:00:00Z' },
]

describe('pickCurrentList', () => {
  it('nessuna lista: null', () => {
    expect(pickCurrentList([], 'casa')).toBeNull()
  })

  it('tiene la lista salvata se esiste ancora', () => {
    expect(pickCurrentList(lists, 'mare')).toBe('mare')
  })

  it('senza scelta salvata apre la lista più vecchia', () => {
    expect(pickCurrentList(lists, null)).toBe('casa')
  })

  it('se la lista salvata non esiste più torna alla più vecchia', () => {
    expect(pickCurrentList(lists, 'lasciata')).toBe('casa')
  })
})
