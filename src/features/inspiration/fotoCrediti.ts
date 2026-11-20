/**
 * Foto dei piatti delle Ispirazioni: una per piatto, in `public/ricette/<slug>.webp`
 * (800x600, 4:3, WebP). Solo foto con licenza libera che permette uso commerciale e
 * modifica: Wikimedia Commons (CC0, CC BY, CC BY-SA), Unsplash e Pexels. Mai foto di
 * siti di ricette. Un piatto senza foto qui resta senza: l'interfaccia regge lo stesso.
 * L'elenco completo dei crediti è anche in docs/legale/licenze-di-terze-parti.md.
 */
export interface CreditoFoto {
  autore: string
  fonte: 'Wikimedia Commons' | 'Unsplash' | 'Pexels'
  /** Per Commons la sigla (CC0, CC BY 2.0, CC BY-SA 4.0 ...); altrimenti la licenza del sito */
  licenza: string
  /** Testo della licenza CC, da linkare accanto al credito */
  licenzaUrl?: string
  /** Pagina originale della foto */
  pagina: string
}

/** Slug del piatto: minuscole, senza accenti, parole unite da "-" */
export function slugPiatto(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const FOTO_CREDITI: Readonly<Record<string, CreditoFoto>> = {
  'agnello-al-forno-con-patate': {
    autore: 'Valerialucatello',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Agnello_al_forno_con_patate_alla_leccese.jpg',
  },
  'baccala-in-umido': {
    autore: 'Italy Chronicles Photos',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Baccal%C3%A0_e_pomodoro.jpg',
  },
  caponata: {
    autore: 'Massimoweb',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Sicilian_caponata.jpg',
  },
  'carciofi-alla-romana': {
    autore: 'C. Shen',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Carciofi_alla_Romana.jpg',
  },
  chiacchiere: {
    autore: 'Juan Emilio Prades Bel',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Le_Chiacchiere_di_Carnevale.jpg',
  },
  'cotechino-con-lenticchie': {
    autore: 'Popo le Chien',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Cotechino.jpg',
  },
  'crostata-di-fragole': {
    autore: 'Bangin',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.5',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.5/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Strawberry_Pie.jpg',
  },
  'fiori-di-zucca-fritti': {
    autore: 'Luca Volpe Productions',
    fonte: 'Pexels',
    licenza: 'Licenza Pexels',
    pagina: 'https://www.pexels.com/photo/delicious-stuffed-zucchini-flowers-with-dip-37225404/',
  },
  'frittata-alle-erbe': {
    autore: 'Dedda 71',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Frittata_slice.jpg',
  },
  'gnocchi-al-gorgonzola-e-noci': {
    autore: 'cyclonebill',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Flickr_-_cyclonebill_-_Gnocchi_med_gorgonzola_og_valn%C3%B8dder.jpg',
  },
  'insalata-di-polpo-e-patate': {
    autore: 'Marlein Topciu',
    fonte: 'Pexels',
    licenza: 'Licenza Pexels',
    pagina: 'https://www.pexels.com/photo/delicious-health-salad-16010617/',
  },
  'insalata-di-riso': {
    autore: 'Auryg',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Insalata_di_riso.jpg',
  },
  'macedonia-di-frutta': {
    autore: 'Bangin',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.5',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.5/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Fruit_salad.JPG',
  },
  'mele-al-forno': {
    autore: 'Alabama Extension',
    fonte: 'Wikimedia Commons',
    licenza: 'CC0',
    licenzaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Hot_and_Sweet_Baked_Apples_-_50495578482.jpg',
  },
  'minestrone-di-stagione': {
    autore: 'Katrin Morenz',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Minestrone_soup.jpg',
  },
  'monte-bianco': {
    autore: 'Meg Zimbeck',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Mont_blanc_dessert_from_Patisserie_des_Reves.jpg',
  },
  'orecchiette-con-le-cime-di-rapa': {
    autore: 'Romainbehar',
    fonte: 'Wikimedia Commons',
    licenza: 'CC0',
    licenzaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Lyon_7e_-_Restaurant_Veronatuti_-_Orecchiette_con_le_cime_di_rapa_(plat_originaire_des_Pouilles).jpg',
  },
  panzanella: {
    autore: 'Missvain',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Sunday_Supper_Aug_2019_-_Stierch_04.jpg',
  },
  'parmigiana-di-melanzane': {
    autore: 'Schellenberg',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Parmigiana_di_melanzane.jpg',
  },
  'pasta-al-pesto-genovese': {
    autore: 'Pastalovers',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Trofie_al_pesto_.jpg',
  },
  'pasta-alla-norma': {
    autore: 'Paoletta S.',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pasta_alla_Norma_(2563876877).jpg',
  },
  'pasta-con-gli-asparagi': {
    autore: 'Albarubescens',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pasta_con_asparagi_selvatici.jpg',
  },
  'pasta-e-ceci': {
    autore: 'spurekar',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pasta_e_ceci_(49671162847).jpg',
  },
  'pasta-e-fagioli': {
    autore: 'Spinoziano',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pasta_e_fagioli_cannellini.jpg',
  },
  'patate-novelle-al-forno': {
    autore: 'Markus Winkler',
    fonte: 'Unsplash',
    licenza: 'Licenza Unsplash',
    pagina:
      'https://unsplash.com/photos/a-white-plate-topped-with-potatoes-and-parsley-9DEggBoY8CY',
  },
  peperonata: {
    autore: 'Kobako',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Peperonata22.jpg',
  },
  'pesche-al-vino': {
    autore: 'F Ceragioli',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pesche_al_vino.jpg',
  },
  'polenta-e-funghi': {
    autore: 'やましこ',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Polenta_con_i_funghi_(49653224713).jpg',
  },
  'polenta-e-salsiccia': {
    autore: 'Matt Squirrell',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Lunch_of_polenta,_sausages_and_tomato_sauce.jpg',
  },
  'pollo-al-limone': {
    autore: 'Eiliv Aceron',
    fonte: 'Pexels',
    licenza: 'Licenza Pexels',
    pagina: 'https://www.pexels.com/photo/a-delicious-roasted-chicken-with-lemon-slices-6896080/',
  },
  'pollo-alla-cacciatora': {
    autore: 'Chris Bennett',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Chicken_cacciatore.jpg',
  },
  'pollo-con-i-peperoni': {
    autore: 'Luca Nebuloni',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Chicken_with_red_peppers,_onions_and_soya_sauce_(7181423576).jpg',
  },
  'pomodori-ripieni-di-riso': {
    autore: 'Mina Biennier',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Tomates_farcies_maison_de_Mina_Biennier.jpg',
  },
  ribollita: {
    autore: 'Xaura',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Ribollita.jpg',
  },
  'risotto-agli-asparagi': {
    autore: 'Karen and Brad Emerson',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Herb_pesto_risotto_with_asparagus_(3299107018).jpg',
  },
  'risotto-al-radicchio': {
    autore: 'Luca Nebuloni',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Risotto_with_radicchio_and_oranges_(32407613653).jpg',
  },
  'risotto-alla-zucca': {
    autore: 'o.tacke',
    fonte: 'Wikimedia Commons',
    licenza: 'CC0',
    licenzaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Pumpkin_risotto.jpg',
  },
  'rucola-fragole-e-grana': {
    autore: 'Francelia Urena',
    fonte: 'Unsplash',
    licenza: 'Licenza Unsplash',
    pagina:
      'https://unsplash.com/photos/a-white-plate-topped-with-a-salad-covered-in-strawberries-MOHg9B-yG_U',
  },
  'seppie-con-i-piselli': {
    autore: 'Alessio Sbarbaro',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY-SA 3.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Buridda_di_seppie_01.jpg',
  },
  'spaghetti-alle-alici': {
    autore: 'Andrew Malone',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Spaghetti_with_anchovies_(356534448).jpg',
  },
  'spaghetti-alle-zucchine': {
    autore: 'Luca Volpe Productions',
    fonte: 'Pexels',
    licenza: 'Licenza Pexels',
    pagina: 'https://www.pexels.com/photo/pasta-on-white-ceramic-plate-11675216/',
  },
  'spaghetti-con-i-pomodorini-freschi': {
    autore: 'Luca Nebuloni',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Spaghetti_with_cherry_tomatoes_and_cashew_nuts_(20142599775).jpg',
  },
  'spezzatino-con-patate': {
    autore: 'Luca Nebuloni',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 2.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/2.0/',
    pagina:
      'https://commons.wikimedia.org/wiki/File:Veal_stew_with_apples_and_potatoes_(13886150756).jpg',
  },
  'tortellini-in-brodo': {
    autore: 'Nick.mon',
    fonte: 'Wikimedia Commons',
    licenza: 'CC0',
    licenzaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Tortellini_in_brodo_Bologna.jpg',
  },
  'zucchine-ripiene': {
    autore: 'MOs810',
    fonte: 'Wikimedia Commons',
    licenza: 'CC BY 4.0',
    licenzaUrl: 'https://creativecommons.org/licenses/by/4.0/',
    pagina: 'https://commons.wikimedia.org/wiki/File:Zucchini_stuffed_with_vegetables.jpg',
  },
}

export interface FotoPiatto {
  src: string
  credito: CreditoFoto
}

export function fotoDelPiatto(nome: string): FotoPiatto | null {
  const slug = slugPiatto(nome)
  const credito = FOTO_CREDITI[slug]
  return credito ? { src: `/ricette/${slug}.webp`, credito } : null
}
