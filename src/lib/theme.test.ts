import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PALETTE_VARS, THEMES, onAccentColor } from './theme'
import type { ThemePalette } from './theme'

const tokens = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
}

function luminance(rgb: number[]) {
  const [r = 0, g = 0, b = 0] = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** color-mix(in srgb, a p%, b) */
function mix(a: string, b: string, p: number) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return ca.map((v, i) => v * p + (cb[i] ?? 0) * (1 - p))
}

describe('temi', () => {
  it('il tema di default coincide con i valori di tokens.css', () => {
    const autunno = THEMES[0]
    expect(autunno?.id).toBe('autunno')
    for (const [key, cssVar] of Object.entries(PALETTE_VARS) as [keyof ThemePalette, string][]) {
      const match = tokens.match(new RegExp(`${cssVar}:\\s*(#[0-9a-f]{6});`, 'i'))
      expect(match?.[1]?.toLowerCase(), cssVar).toBe(autunno?.palette[key])
    }
  })

  it('id unici e nessun tema con gli stessi colori principali', () => {
    const ids = new Set(THEMES.map((t) => t.id))
    expect(ids.size).toBe(THEMES.length)
    const signatures = new Set(THEMES.map((t) => `${t.palette.burnt}/${t.palette.bg}`))
    expect(signatures.size).toBe(THEMES.length)
  })

  it("testo sopra l'accento leggibile in ogni tema (Spesa finita)", () => {
    for (const { palette } of THEMES) {
      const text = hexToRgb(onAccentColor(palette))
      expect(contrast(text, hexToRgb(palette.brick))).toBeGreaterThanOrEqual(3.5)
    }
    const autunno = THEMES[0]
    // il default di tokens.css deve coincidere con quello calcolato per Autunno
    expect(autunno && onAccentColor(autunno.palette)).toBe('#ffffff')
  })

  it.each(THEMES.filter((t) => t.id !== 'autunno'))('$name ha testi leggibili', ({ palette }) => {
    const cream = hexToRgb(palette.cream)
    // nome prodotto sulla tile "da comprare"
    expect(contrast(cream, mix(palette.burnt, palette.ink, 0.85))).toBeGreaterThanOrEqual(4.5)
    // testo dei bottoni principali
    expect(contrast(cream, hexToRgb(palette.brick))).toBeGreaterThanOrEqual(4.5)
    // testo secondario sul fondo e sulle superfici
    expect(contrast(hexToRgb(palette.inkSoft), hexToRgb(palette.bg))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hexToRgb(palette.inkSoft), cream)).toBeGreaterThanOrEqual(4.5)
  })
})
