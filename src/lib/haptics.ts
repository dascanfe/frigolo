/**
 * Feedback aptico, dove il browser lo supporta (Android Chrome sì, iOS Safari no).
 * Fallisce in silenzio: è un dettaglio, non deve mai rompere l'interazione.
 */
function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    // alcuni browser lanciano se la pagina non è stata ancora toccata
  }
}

export const haptics = {
  /** tocco leggero: aggiunta o spostamento di un prodotto */
  tap: () => vibrate(10),
  /** conferma: spesa completata */
  success: () => vibrate([10, 40, 10]),
  /** long press riconosciuto */
  hold: () => vibrate(15),
}
