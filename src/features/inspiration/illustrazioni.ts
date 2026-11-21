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

/** Piatti che hanno l'illustrazione (oggi tutti e 60) */
export const ILLUSTRAZIONI: ReadonlySet<string> = new Set([
  'agnello-al-forno-con-patate',
  'baccala-in-umido',
  'bruschette-con-fave-e-ricotta',
  'caponata',
  'carciofi-alla-romana',
  'chiacchiere',
  'cotechino-con-lenticchie',
  'crostata-di-fragole',
  'fagiolini-e-patate-in-umido',
  'fiori-di-zucca-fritti',
  'frittata-alle-erbe',
  'frittata-di-carciofi',
  'gnocchi-al-gorgonzola-e-noci',
  'insalata-di-melograno-e-finocchi',
  'insalata-di-polpo-e-patate',
  'insalata-di-rinforzo',
  'insalata-di-riso',
  'macedonia-di-frutta',
  'mele-al-forno',
  'minestrone-di-stagione',
  'monte-bianco',
  'orecchiette-con-le-cime-di-rapa',
  'panzanella',
  'parmigiana-di-melanzane',
  'pasta-al-pesto-genovese',
  'pasta-alla-norma',
  'pasta-con-gli-asparagi',
  'pasta-con-il-cavolfiore',
  'pasta-e-ceci',
  'pasta-e-fagioli',
  'patate-novelle-al-forno',
  'peperonata',
  'pesce-spada-alla-siciliana',
  'pesche-al-vino',
  'polenta-e-funghi',
  'polenta-e-salsiccia',
  'pollo-al-limone',
  'pollo-alla-cacciatora',
  'pollo-con-i-peperoni',
  'pomodori-ripieni-di-riso',
  'ribollita',
  'risotto-agli-asparagi',
  'risotto-ai-porcini',
  'risotto-al-radicchio',
  'risotto-alla-zucca',
  'rucola-fragole-e-grana',
  'schiacciata-all-uva',
  'seppie-con-i-piselli',
  'sfoglia-di-spinaci-e-ricotta',
  'spaghetti-alle-alici',
  'spaghetti-alle-zucchine',
  'spaghetti-con-i-pomodorini-freschi',
  'spezzatino-con-patate',
  'tiramisu-al-panettone',
  'torta-all-arancia',
  'tortellini-in-brodo',
  'verza-e-salsiccia',
  'vignarola',
  'zucchine-alla-scapece',
  'zucchine-ripiene',
])

/** Indirizzo dell'illustrazione del piatto, o null se non c'è ancora */
export function illustrazioneDelPiatto(nome: string): string | null {
  const slug = slugPiatto(nome)
  return ILLUSTRAZIONI.has(slug) ? `/ricette/${slug}.webp` : null
}
