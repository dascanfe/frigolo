/**
 * Temi dell'app: cambiano fondi, bordi, colore delle tile, accento e testo.
 * La palette di ogni tema è qui (unica fonte): all'avvio e al cambio tema i
 * colori vengono scritti come variabili CSS su <html>, sopra ai valori di
 * tokens.css. Il tema "autunno" è quello di :root e non scrive nulla.
 * Scelta salvata sul dispositivo, applicata prima del primo render.
 */
export interface ThemePalette {
  /** fondo dell'app */
  bg: string
  /** superfici, tile non in lista */
  cream: string
  /** bordi e separatori */
  sand: string
  /** tile "da comprare" (scurita all'85% con l'inchiostro) */
  burnt: string
  /** accento: bottoni principali, anelli di focus */
  brick: string
  /** tile "nel carrello" (scurita all'80% con l'inchiostro) */
  sage: string
  /** accento tenue */
  peach: string
  /** testo principale */
  ink: string
  /** testo secondario */
  inkSoft: string
}

export interface Theme {
  id: string
  name: string
  palette: ThemePalette
}

/**
 * Sei famiglie di colore ben distinte. Contrasti verificati (WCAG): testo
 * crema sulle tile da comprare >= 4.8:1 (autunno 3.8:1, colori storici del
 * brand), testo secondario sul fondo >= 5.7:1.
 */
const AUTUNNO: Theme = {
  id: 'autunno',
  name: 'Autunno',
  palette: {
    bg: '#f4ece2',
    cream: '#faf3ec',
    sand: '#ebd5b3',
    burnt: '#db6a2e',
    brick: '#ce5f36',
    sage: '#86a79b',
    peach: '#e5987a',
    ink: '#3a2c21',
    inkSoft: '#6b5844',
  },
}

export const THEMES: Theme[] = [
  AUTUNNO,
  {
    id: 'basilico',
    name: 'Basilico',
    palette: {
      bg: '#edf2ea',
      cream: '#f7faf5',
      sand: '#cfdcc8',
      burnt: '#3f8a4f',
      brick: '#2f7a41',
      sage: '#a08a70',
      peach: '#b5d6b8',
      ink: '#1c2b20',
      inkSoft: '#4d5f50',
    },
  },
  {
    id: 'mare',
    name: 'Mare',
    palette: {
      bg: '#ebf1f7',
      cream: '#f6f9fc',
      sand: '#cad8e8',
      burnt: '#2b6cb0',
      brick: '#1f5d9e',
      sage: '#ab9163',
      peach: '#b9cfe8',
      ink: '#1a2433',
      inkSoft: '#4b5a6e',
    },
  },
  {
    id: 'prugna',
    name: 'Prugna',
    palette: {
      bg: '#f3eff6',
      cream: '#faf8fc',
      sand: '#ddd3e8',
      burnt: '#7c4a9e',
      brick: '#6a3a8b',
      sage: '#a3915f',
      peach: '#d9c6e8',
      ink: '#271d33',
      inkSoft: '#5d5170',
    },
  },
  {
    id: 'lampone',
    name: 'Lampone',
    palette: {
      bg: '#f8eef0',
      cream: '#fdf7f8',
      sand: '#efd3da',
      burnt: '#c93a5e',
      brick: '#b02e50',
      sage: '#75a093',
      peach: '#f2bccb',
      ink: '#3b1d26',
      inkSoft: '#6f4a55',
    },
  },
  {
    id: 'liquirizia',
    name: 'Liquirizia',
    palette: {
      bg: '#efeeec',
      cream: '#f8f7f5',
      sand: '#dad6d0',
      burnt: '#3a3633',
      brick: '#c4472f',
      sage: '#948d84',
      peach: '#e9c2b8',
      ink: '#1d1b19',
      inkSoft: '#58534d',
    },
  },
]

/** Variabile CSS (tokens.css) per ogni colore della palette */
export const PALETTE_VARS: Record<keyof ThemePalette, string> = {
  bg: '--c-bg',
  cream: '--c-cream',
  sand: '--c-sand',
  burnt: '--c-burnt',
  brick: '--c-brick',
  sage: '--c-sage',
  peach: '--c-peach',
  ink: '--c-ink',
  inkSoft: '--c-ink-soft',
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r = 0, g = 0, b = 0] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Testo sopra l'accento del tema: bianco, o l'inchiostro se l'accento è chiaro */
export function onAccentColor(palette: ThemePalette): string {
  return contrastRatio('#ffffff', palette.brick) >= contrastRatio(palette.ink, palette.brick)
    ? '#ffffff'
    : palette.ink
}

/** Colori effettivi delle tile, calcolati come in tokens.css */
export function tileColors(palette: ThemePalette) {
  return {
    active: `color-mix(in srgb, ${palette.burnt} 85%, ${palette.ink})`,
    done: `color-mix(in srgb, ${palette.sage} 80%, ${palette.ink})`,
  }
}

const STORAGE_KEY = 'frigolo.theme'
const DEFAULT_THEME = AUTUNNO.id

/** Temi della prima versione, rimappati sul nuovo tema più vicino */
const LEGACY_THEMES: Record<string, string> = {
  menta: 'basilico',
  cielo: 'mare',
  lavanda: 'prugna',
  pesca: 'lampone',
  sabbia: 'liquirizia',
}

const listeners = new Set<() => void>()
let current = DEFAULT_THEME

function findTheme(id: string | null) {
  return THEMES.find((t) => t.id === id)
}

function applyToDocument(theme: Theme) {
  const root = document.documentElement
  for (const [key, cssVar] of Object.entries(PALETTE_VARS) as [keyof ThemePalette, string][]) {
    if (theme.id === DEFAULT_THEME) root.style.removeProperty(cssVar)
    else root.style.setProperty(cssVar, theme.palette[key])
  }
  if (theme.id === DEFAULT_THEME) root.style.removeProperty('--on-accent')
  else root.style.setProperty('--on-accent', onAccentColor(theme.palette))
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = theme.palette.burnt
}

function save(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // storage non disponibile: il tema vale per questa sessione
  }
}

/** Da chiamare all'avvio, prima del render */
export function applyStoredTheme() {
  let stored: string | null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    stored = null
  }
  const legacy = stored ? LEGACY_THEMES[stored] : undefined
  const theme = findTheme(legacy ?? stored) ?? AUTUNNO
  if (legacy) save(legacy)
  current = theme.id
  applyToDocument(theme)
}

export function setTheme(id: string) {
  const theme = findTheme(id)
  if (!theme) return
  current = id
  applyToDocument(theme)
  save(id)
  for (const listener of listeners) listener()
}

export function getTheme() {
  return current
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
