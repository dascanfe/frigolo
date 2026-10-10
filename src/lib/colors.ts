/** "frutta" -> "var(--cat-frutta)": colore pieno della categoria (sfondi, linee, grafici) */
export function categoryColorVar(slug: string): string {
  return `var(--cat-${slug})`
}

/** "frutta" -> "var(--cat-frutta-text)": versione scurita per testo piccolo sul fondo app */
export function categoryTextColorVar(slug: string): string {
  return `var(--cat-${slug}-text)`
}

/** "frutta" -> "var(--cat-frutta-solid)": sfondo dei cerchi con l'icona bianca */
export function categoryIconBgVar(slug: string): string {
  return `var(--cat-${slug}-solid)`
}

/**
 * Colori dei membri: valori fissi (quelli del tema autunno), così avatar e
 * grafici restano riconoscibili con qualunque tema. I temi riscrivono alcuni
 * token grezzi (c-brick, c-burnt, ...) e con var() cambierebbero colore.
 */
const MEMBER_COLORS: Readonly<Record<string, string>> = {
  'c-teal': '#3e7c86',
  'c-brick': '#ce5f36',
  'c-olive-deep': '#7e7530',
  'c-rust': '#a85641',
  'c-brown': '#7e5e29',
  'c-terracotta': '#d9695c',
  'c-burnt': '#db6a2e',
  'c-ochre': '#c2902f',
  'c-ink-soft': '#6b5844',
}

/** Nome italiano del colore, per screen reader e tooltip */
const MEMBER_COLOR_NAMES: Readonly<Record<string, string>> = {
  'c-teal': 'ottanio',
  'c-brick': 'mattone',
  'c-olive-deep': 'oliva',
  'c-rust': 'ruggine',
  'c-brown': 'marrone',
  'c-terracotta': 'terracotta',
  'c-burnt': 'arancio',
  'c-ochre': 'ocra',
  'c-ink-soft': 'grigio',
}

export function memberColorName(token: string): string {
  return MEMBER_COLOR_NAMES[token] ?? token.replace('c-', '')
}

/** Colore pieno di un membro (token salvato in household_members.color) */
export function memberColor(token: string | null | undefined): string {
  return MEMBER_COLORS[token ?? ''] ?? '#6b5844'
}

/** Testo o icona sopra il colore di un membro: crema, o inchiostro sull'ocra */
export function onMemberColor(token: string | null | undefined): string {
  return token === 'c-ochre' ? '#3a2c21' : '#faf3ec'
}
