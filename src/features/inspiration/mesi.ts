/**
 * Contenuti di "Ispirazioni", mese per mese (gennaio è il primo). Idee semplici
 * della tradizione italiana, solo l'essenziale: gli ingredienti sono nomi
 * esatti del catalogo base (li controlla un test su supabase/seed.sql).
 * Frutta, verdura e pesce di stagione non sono qui: arrivano dai mesi di
 * stagione dei prodotti del catalogo.
 */
export interface Piatto {
  nome: string
  /** Una riga: com'è, non la ricetta */
  idea: string
  /** Nomi esatti dei prodotti del catalogo */
  ingredienti: string[]
}

export interface MeseIspirazioni {
  /** Nome del mese, con la maiuscola */
  nome: string
  /** Due frasi al massimo, nel tono di Frigolo */
  intro: string
  piatti: Piatto[]
}

export const MESI: readonly MeseIspirazioni[] = [
  {
    nome: 'Gennaio',
    intro:
      "Fuori fa freddo, dentro si sta bene. È il mese delle zuppe che scaldano e degli agrumi che portano un po' di sole.",
    piatti: [
      {
        nome: 'Pasta e ceci',
        idea: 'Una pentola sola, un rametto di rosmarino e tanta pazienza.',
        ingredienti: [
          'Ceci',
          'Pasta',
          'Rosmarino',
          'Aglio',
          'Passata di pomodoro',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Ribollita',
        idea: 'La zuppa toscana che il giorno dopo è ancora più buona.',
        ingredienti: [
          'Cavolo nero',
          'Fagioli in scatola',
          'Carote',
          'Sedano',
          'Cipolle',
          'Pane',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Risotto al radicchio',
        idea: "Un po' amaro, un po' dolce, con una spolverata di formaggio.",
        ingredienti: [
          'Riso Carnaroli',
          'Radicchio',
          'Cipolle',
          'Burro',
          'Vino rosso',
          'Parmigiano Reggiano',
        ],
      },
      {
        nome: 'Zuppa di porri e patate',
        idea: 'Morbida e semplice, perfetta con il pane tostato.',
        ingredienti: ['Porri', 'Patate', 'Brodo vegetale', 'Parmigiano Reggiano', 'Pane'],
      },
      {
        nome: "Pinzimonio d'inverno",
        idea: "Verdure crude da intingere nell'olio buono.",
        ingredienti: ['Finocchi', 'Carote', 'Sedano', 'Olio extravergine', 'Sale'],
      },
    ],
  },
  {
    nome: 'Febbraio',
    intro:
      'Ancora freddo, ma le giornate si allungano. Cavoli, cime e carciofi sono al meglio, e a Carnevale si frigge qualcosa.',
    piatti: [
      {
        nome: 'Orecchiette con le cime di rapa',
        idea: "Verde, piccante e pronte in mezz'ora.",
        ingredienti: [
          'Orecchiette',
          'Cime di rapa',
          'Aglio',
          "Acciughe sott'olio",
          'Peperoncino',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Frittata di carciofi',
        idea: 'Si prepara in anticipo e si mangia anche fredda.',
        ingredienti: ['Carciofi', 'Uova', 'Parmigiano Reggiano', 'Prezzemolo', 'Limoni'],
      },
      {
        nome: 'Minestrone di stagione',
        idea: "Tutto quello che c'è nel cassetto, tagliato a pezzetti.",
        ingredienti: ['Verza', 'Patate', 'Carote', 'Sedano', 'Cipolle', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Polenta e salsiccia',
        idea: 'Piatto unico da inverno: sugo di pomodoro e un cucchiaio di formaggio.',
        ingredienti: ['Polenta', 'Salsicce', 'Passata di pomodoro', 'Cipolle', 'Pecorino'],
      },
      {
        nome: 'Insalata di arance rosse e finocchi',
        idea: 'Fresca e colorata, con due olive per il contrasto.',
        ingredienti: ['Arance rosse', 'Finocchi', 'Olive', 'Olio extravergine'],
      },
    ],
  },
  {
    nome: 'Marzo',
    intro:
      'Torna la luce e arrivano i primi verdi. Asparagi e carciofi sono pronti, gli spinaci ancora buoni.',
    piatti: [
      {
        nome: 'Risotto agli asparagi',
        idea: 'Le punte alla fine, per tenerle croccanti.',
        ingredienti: [
          'Riso Carnaroli',
          'Asparagi',
          'Cipolle',
          'Burro',
          'Brodo vegetale',
          'Parmigiano Reggiano',
        ],
      },
      {
        nome: 'Carciofi alla romana',
        idea: 'Mentuccia, aglio e tanta pazienza a fuoco basso.',
        ingredienti: ['Carciofi', 'Menta', 'Aglio', 'Prezzemolo', 'Limoni', 'Olio extravergine'],
      },
      {
        nome: 'Spaghetti alle alici',
        idea: 'Pangrattato tostato al posto del formaggio.',
        ingredienti: ['Spaghetti', 'Alici', 'Aglio', 'Pangrattato', 'Prezzemolo', 'Peperoncino'],
      },
      {
        nome: 'Sfoglia di spinaci e ricotta',
        idea: 'Si stende, si riempie, si inforna.',
        ingredienti: ['Pasta sfoglia', 'Spinaci', 'Ricotta', 'Uova', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Agnello al forno con patate',
        idea: 'Il classico di Pasqua, con rosmarino e aglio.',
        ingredienti: ['Agnello', 'Patate', 'Rosmarino', 'Aglio', 'Olio extravergine'],
      },
    ],
  },
  {
    nome: 'Aprile',
    intro:
      "Primavera piena: fave, piselli e le prime fragole. Pasqua e le gite fuori porta sono dietro l'angolo.",
    piatti: [
      {
        nome: 'Vignarola',
        idea: 'Carciofi, fave e piselli stufati insieme: la primavera in un piatto.',
        ingredienti: [
          'Carciofi',
          'Fave',
          'Piselli freschi',
          'Cipollotti',
          'Lattuga',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Fave e pecorino',
        idea: 'Da sgranocchiare con il pane, come si fa a Pasquetta.',
        ingredienti: ['Fave', 'Pecorino', 'Pane', 'Olio extravergine'],
      },
      {
        nome: 'Risotto ai piselli',
        idea: 'Dolce e cremoso, con il brodo tenuto caldo.',
        ingredienti: [
          'Riso Carnaroli',
          'Piselli freschi',
          'Cipolle',
          'Brodo vegetale',
          'Parmigiano Reggiano',
        ],
      },
      {
        nome: 'Frittata alle erbe',
        idea: 'Un trito di erbe fresche e il pranzo è risolto.',
        ingredienti: ['Uova', 'Erba cipollina', 'Menta', 'Prezzemolo', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Fragole, yogurt e miele',
        idea: 'Il dessert che si fa mentre apparecchi.',
        ingredienti: ['Fragole', 'Yogurt greco', 'Miele', 'Limoni'],
      },
    ],
  },
  {
    nome: 'Maggio',
    intro:
      "Verdure tenere, frutta rossa e pranzi all'aperto. Si cucina leggero e si apparecchia dove capita.",
    piatti: [
      {
        nome: 'Bruschette con fave e ricotta',
        idea: 'Pane tostato, crema di fave e una foglia di menta.',
        ingredienti: ['Pane', 'Fave', 'Ricotta', 'Menta', 'Olio extravergine'],
      },
      {
        nome: 'Spaghetti alle zucchine',
        idea: "Le zucchine si sfaldano nell'olio e diventano una crema.",
        ingredienti: ['Spaghetti', 'Zucchine', 'Aglio', 'Basilico', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Patate novelle al forno',
        idea: 'Con la buccia, rosmarino e un pizzico di sale.',
        ingredienti: ['Patate novelle', 'Rosmarino', 'Aglio', 'Olio extravergine', 'Sale'],
      },
      {
        nome: 'Pollo al limone',
        idea: 'Pochi ingredienti, sugo cremoso e profumato.',
        ingredienti: ['Petto di pollo', 'Limoni', 'Prezzemolo', 'Farina 00', 'Burro'],
      },
      {
        nome: 'Rucola, fragole e grana',
        idea: 'Dolce, amaro e sapido insieme, con un filo di balsamico.',
        ingredienti: ['Rucola', 'Fragole', 'Grana Padano', 'Aceto balsamico', 'Olio extravergine'],
      },
    ],
  },
  {
    nome: 'Giugno',
    intro:
      'Le serate si allungano e in cucina si accende poco. Pomodori veri, piatti freddi e frutta dolce.',
    piatti: [
      {
        nome: 'Insalata di riso',
        idea: 'Si prepara la sera prima e il giorno dopo è ancora meglio.',
        ingredienti: ['Riso', 'Tonno in scatola', 'Pomodorini', 'Mais in scatola', 'Olive', 'Uova'],
      },
      {
        nome: 'Caprese',
        idea: 'Quando i pomodori sono buoni, non serve altro.',
        ingredienti: ['Pomodori', 'Mozzarella di bufala', 'Basilico', 'Olio extravergine', 'Sale'],
      },
      {
        nome: 'Pasta fredda con tonno e capperi',
        idea: 'Da portare in ufficio o in spiaggia.',
        ingredienti: ['Fusilli', 'Pomodorini', 'Tonno in scatola', 'Capperi', 'Basilico'],
      },
      {
        nome: 'Parmigiana di melanzane',
        idea: 'Si fa con calma, si mangia in un attimo.',
        ingredienti: [
          'Melanzane',
          'Passata di pomodoro',
          'Mozzarella',
          'Parmigiano Reggiano',
          'Basilico',
        ],
      },
      {
        nome: 'Macedonia di frutta',
        idea: 'Ciliegie, pesche e albicocche con una spremuta di limone.',
        ingredienti: ['Ciliegie', 'Pesche', 'Albicocche', 'Limoni', 'Zucchero'],
      },
    ],
  },
  {
    nome: 'Luglio',
    intro:
      'Caldo vero: meno fornelli, più frutta di stagione e verdure da mangiare crude o appena scottate.',
    piatti: [
      {
        nome: 'Pasta alla Norma',
        idea: 'Melanzane, pomodoro e basilico: un classico siciliano.',
        ingredienti: [
          'Rigatoni',
          'Melanzane',
          'Passata di pomodoro',
          'Basilico',
          'Pecorino',
          'Aglio',
        ],
      },
      {
        nome: 'Peperonata',
        idea: 'Buona calda, tiepida o fredda il giorno dopo.',
        ingredienti: ['Peperoni', 'Cipolle', 'Pomodori', 'Basilico', 'Olio extravergine'],
      },
      {
        nome: 'Insalata di polpo e patate',
        idea: 'Con sedano, prezzemolo e limone.',
        ingredienti: ['Polpo', 'Patate', 'Sedano', 'Prezzemolo', 'Limoni', 'Olio extravergine'],
      },
      {
        nome: 'Panzanella',
        idea: 'Il pane raffermo trova una seconda vita.',
        ingredienti: [
          'Pane',
          'Pomodori',
          'Cetrioli',
          'Cipolle rosse',
          'Basilico',
          'Aceto',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Melone e prosciutto crudo',
        idea: 'Il dolce e il salato, senza accendere niente.',
        ingredienti: ['Melone', 'Prosciutto crudo'],
      },
    ],
  },
  {
    nome: 'Agosto',
    intro:
      'Pomodori al massimo e pochi fornelli. Spesso basta un piatto di pasta con le cose giuste.',
    piatti: [
      {
        nome: 'Spaghetti con i pomodorini freschi',
        idea: 'Il sugo si fa in cinque minuti, il pomodoro resta vivo.',
        ingredienti: ['Spaghetti', 'Pomodorini', 'Aglio', 'Basilico', 'Olio extravergine'],
      },
      {
        nome: 'Zucchine alla scapece',
        idea: 'Fritte e marinate con aceto e menta, da fare in anticipo.',
        ingredienti: ['Zucchine', 'Aceto', 'Menta', 'Aglio', 'Olio extravergine'],
      },
      {
        nome: 'Spaghetti con le mazzancolle',
        idea: 'Pomodorini, prezzemolo e un pizzico di peperoncino.',
        ingredienti: [
          'Spaghetti',
          'Mazzancolle',
          'Pomodorini',
          'Aglio',
          'Prezzemolo',
          'Peperoncino',
        ],
      },
      {
        nome: 'Fichi e prosciutto crudo',
        idea: 'Con qualche foglia di rucola e una goccia di balsamico.',
        ingredienti: ['Fichi', 'Prosciutto crudo', 'Rucola', 'Aceto balsamico'],
      },
      {
        nome: 'Pesche al vino',
        idea: 'Fette di pesca nel vino freddo, da mangiare col cucchiaio.',
        ingredienti: ['Pesche', 'Vino rosso', 'Zucchero', 'Limoni'],
      },
    ],
  },
  {
    nome: 'Settembre',
    intro:
      "Si torna alla routine e arriva il bello: funghi, uva, fichi e le ultime verdure d'estate.",
    piatti: [
      {
        nome: 'Risotto ai porcini',
        idea: 'Profumo di bosco, basta poco altro.',
        ingredienti: [
          'Riso Carnaroli',
          'Funghi porcini',
          'Cipolle',
          'Burro',
          'Prezzemolo',
          'Parmigiano Reggiano',
        ],
      },
      {
        nome: "Schiacciata all'uva",
        idea: 'Un dolce toscano di vendemmia, con rosmarino.',
        ingredienti: ['Uva', 'Farina 00', 'Lievito', 'Zucchero', 'Rosmarino', 'Olio extravergine'],
      },
      {
        nome: 'Fagiolini e patate in umido',
        idea: 'Un contorno che può diventare piatto unico.',
        ingredienti: ['Fagiolini', 'Patate', 'Pomodori', 'Basilico', 'Olio extravergine'],
      },
      {
        nome: 'Zucca al forno',
        idea: 'Spicchi con rosmarino e pepe: la prima zucca della stagione.',
        ingredienti: ['Zucca', 'Rosmarino', 'Aglio', 'Pepe nero', 'Olio extravergine'],
      },
      {
        nome: 'Sugo fresco di pomodoro',
        idea: 'Gli ultimi pomodori buoni, da fare in quantità e congelare.',
        ingredienti: ['Pomodori', 'Cipolle', 'Basilico', 'Olio extravergine', 'Sale'],
      },
    ],
  },
  {
    nome: 'Ottobre',
    intro: 'Le foglie cadono e la cucina si riscalda. Zucca, funghi, castagne e le prime mele.',
    piatti: [
      {
        nome: 'Risotto alla zucca',
        idea: 'Giallo, dolce e cremoso.',
        ingredienti: [
          'Riso Carnaroli',
          'Zucca',
          'Cipolle',
          'Burro',
          'Brodo vegetale',
          'Parmigiano Reggiano',
        ],
      },
      {
        nome: 'Polenta e funghi',
        idea: 'Funghi trifolati sopra una polenta calda.',
        ingredienti: ['Polenta', 'Funghi', 'Aglio', 'Prezzemolo', 'Burro', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Zuppa di zucca e patate',
        idea: "Frullata fine, con un filo d'olio a crudo.",
        ingredienti: [
          'Zucca',
          'Patate',
          'Porri',
          'Rosmarino',
          'Brodo vegetale',
          'Olio extravergine',
        ],
      },
      {
        nome: 'Mele al forno',
        idea: 'Cannella e miele: la casa profuma di dolce.',
        ingredienti: ['Mele', 'Cannella', 'Miele', 'Uvetta', 'Noci'],
      },
      {
        nome: 'Pasta con il cavolfiore',
        idea: 'Il cavolfiore si sfa nel condimento e fa da sugo.',
        ingredienti: [
          'Pasta',
          'Cavolfiore',
          'Aglio',
          'Peperoncino',
          "Acciughe sott'olio",
          'Pecorino',
        ],
      },
    ],
  },
  {
    nome: 'Novembre',
    intro:
      'Giornate corte e pentole sul fuoco. Legumi, cavoli e i primi agrumi: si cucina per scaldarsi.',
    piatti: [
      {
        nome: 'Pasta e fagioli',
        idea: "Densa, con un giro d'olio e pepe appena macinato.",
        ingredienti: ['Pasta', 'Fagioli in scatola', 'Sedano', 'Carote', 'Cipolle', 'Rosmarino'],
      },
      {
        nome: 'Zuppa di lenticchie',
        idea: 'Si cuoce senza ammollo e scalda fino a sera.',
        ingredienti: ['Lenticchie', 'Carote', 'Sedano', 'Cipolle', 'Passata di pomodoro'],
      },
      {
        nome: 'Gnocchi al gorgonzola e noci',
        idea: 'Pronti in dieci minuti, ricchi e cremosi.',
        ingredienti: ['Gnocchi', 'Gorgonzola', 'Noci', 'Burro'],
      },
      {
        nome: 'Insalata di melograno e finocchi',
        idea: "Croccante e fresca, con un po' di arancia.",
        ingredienti: ['Melograno', 'Finocchi', 'Arance', 'Rucola', 'Olio extravergine'],
      },
      {
        nome: 'Verza e salsiccia',
        idea: 'Stufate insieme con un goccio di vino bianco.',
        ingredienti: ['Verza', 'Salsicce', 'Cipolle', 'Vino bianco', 'Olio extravergine'],
      },
    ],
  },
  {
    nome: 'Dicembre',
    intro: 'Aria di festa: tavola lunga, piatti che si fanno in compagnia e agrumi dappertutto.',
    piatti: [
      {
        nome: 'Tortellini in brodo',
        idea: 'Il piatto delle feste, senza troppi pensieri.',
        ingredienti: ['Tortellini', 'Dado da brodo', 'Parmigiano Reggiano'],
      },
      {
        nome: 'Baccalà in umido',
        idea: 'Pomodoro, olive e capperi, come si fa per la vigilia.',
        ingredienti: [
          'Baccalà',
          'Passata di pomodoro',
          'Olive',
          'Capperi',
          'Cipolle',
          'Prezzemolo',
        ],
      },
      {
        nome: 'Cotechino con lenticchie',
        idea: 'Il piatto di Capodanno: le lenticchie portano fortuna.',
        ingredienti: ['Cotechino', 'Lenticchie', 'Sedano', 'Carote', 'Cipolle'],
      },
      {
        nome: 'Insalata di arance e finocchi',
        idea: 'Un contorno fresco in mezzo a tutto il resto.',
        ingredienti: ['Arance', 'Finocchi', 'Olive', 'Olio extravergine'],
      },
      {
        nome: 'Tiramisù al panettone',
        idea: 'Un modo per finire il panettone avanzato.',
        ingredienti: ['Panettone', 'Mascarpone', 'Uova', 'Caffè macinato', 'Zucchero'],
      },
    ],
  },
]
