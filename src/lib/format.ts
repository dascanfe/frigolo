import type { Unit } from '@/types/domain'

const numberFormatter = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 })

/** "2", "1,5 kg", "500 g": l'unità "pz" non si mostra, è implicita */
export function formatQuantity(quantity: number, unit?: string | null): string {
  const qty = numberFormatter.format(quantity)
  if (!unit || unit === 'pz') return qty
  return `${qty} ${unit}`
}

/** Etichetta leggibile per l'unità (nel bottom sheet e nel picker) */
export function unitLabel(unit: Unit): string {
  switch (unit) {
    case 'pz':
      return 'pezzi'
    case 'kg':
      return 'chilogrammi'
    case 'g':
      return 'grammi'
    case 'l':
      return 'litri'
    case 'ml':
      return 'millilitri'
    case 'conf':
      return 'confezioni'
  }
}

/** Plurale semplice: 1 prodotto, 3 prodotti */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * Quantità da mostrare nel badge della tile: solo se l'utente l'ha
 * personalizzata dal long press (quantità diversa da 1 o unità diversa da
 * quella predefinita del prodotto). "1 kg" di default non aggiunge nulla.
 */
export function badgeQuantity(
  quantity: number,
  unit: string | null | undefined,
  defaultUnit: string | null | undefined,
): number | undefined {
  if (quantity !== 1) return quantity
  if (unit && defaultUnit && unit !== defaultUnit) return quantity
  return undefined
}

const shortDateFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'short', year: '2-digit' })

/** "19 set" */
export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** "set 26" */
export function formatMonth(value: string | Date): string {
  return monthFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** "42%" con arrotondamento, senza decimali */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/** Prima lettera maiuscola, il resto invariato ("latte fresco" -> "Latte fresco") */
export function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toLocaleUpperCase('it-IT') + text.slice(1)
}
