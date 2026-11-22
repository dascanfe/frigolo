import { describe, expect, it } from 'vitest'
import { formatQuantity, parseQuantity } from './quantity'

describe('quantità scritta a mano', () => {
  it('accetta interi e decimali con virgola o punto', () => {
    expect(parseQuantity('3')).toBe(3)
    expect(parseQuantity('12')).toBe(12)
    expect(parseQuantity('1,5')).toBe(1.5)
    expect(parseQuantity('0.25')).toBe(0.25)
    expect(parseQuantity(' 2 ')).toBe(2)
  })

  it('campo vuoto, a metà o non valido: nessuna quantità (il campo resta come scritto)', () => {
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity(',')).toBeNull()
    expect(parseQuantity('0')).toBeNull()
    expect(parseQuantity('abc')).toBeNull()
    expect(parseQuantity('-2')).toBeNull()
    expect(parseQuantity('1,2,3')).toBeNull()
  })

  it('"1," mentre si scrive vale ancora 1', () => {
    expect(parseQuantity('1,')).toBe(1)
  })

  it('mostra i decimali con la virgola', () => {
    expect(formatQuantity(1.5)).toBe('1,5')
    expect(formatQuantity(2)).toBe('2')
  })
})
