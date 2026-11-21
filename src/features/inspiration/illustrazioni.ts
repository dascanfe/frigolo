/**
 * Illustrazioni dei piatti delle Ispirazioni, nello stile della mascotte di
 * Frigolo (contorno marrone, colori pieni e caldi). Sono disegni creati per
 * Frigolo con un generatore di immagini, non foto: niente crediti da citare.
 * Stanno in `public/ricette/<slug>.webp` (800x600, 4:3). Un piatto che non è
 * qui resta senza illustrazione: l'interfaccia regge lo stesso.
 */

/** Slug del piatto: minuscole, senza accenti, parole unite da "-" */
export function slugPiatto(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Piatti che hanno già l'illustrazione */
export const ILLUSTRAZIONI: ReadonlySet<string> = new Set([
  'pasta-e-fagioli',
  'gnocchi-al-gorgonzola-e-noci',
  'verza-e-salsiccia',
  'insalata-di-melograno-e-finocchi',
  'monte-bianco',
])

/** Indirizzo dell'illustrazione del piatto, o null se non c'è ancora */
export function illustrazioneDelPiatto(nome: string): string | null {
  const slug = slugPiatto(nome)
  return ILLUSTRAZIONI.has(slug) ? `/ricette/${slug}.webp` : null
}
