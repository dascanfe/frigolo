export const C = {
  cremaFondo: '#f8eef0',
  crema: '#fdf7f8',
  sabbia: '#efd3da',
  arancio: '#c93a5e',
  mattone: '#b02e50',
  pesca: '#f2bccb',
  salvia: '#75a093',
  inchiostro: '#3b1d26',
  inchiostro2: '#6f4a55',
  menta: '#9de0d1',
  verdeScuro: '#04342f',
  arancioVivo: '#f7a017',
  teal: '#3e7c86',
  terracotta: '#d9695c',
  ocra: '#c2902f',
}

export const FONT_TITLE = "'Playfair Display', Georgia, serif"
export const FONT_TEXT = "'Lato', Helvetica, Arial, sans-serif"

/** Colonna sonora: percorso in public/audio, oppure null per rendere senza musica. */
export const MUSIC: string | null = 'audio/musica.mp3'
/** Volume base della musica: moderato, sotto i suoni di tocco (0.7) */
export const MUSIC_VOLUME = 0.22

/** Sfondo (colore `bg`) di ogni tema dell'app, per la fascia sotto la status bar */
export const THEME_BG: Record<string, string> = {
  autunno: '#f4ece2',
  basilico: '#edf2ea',
  mare: '#ebf1f7',
  prugna: '#f3eff6',
  lampone: '#f8eef0',
  liquirizia: '#efeeec',
}
