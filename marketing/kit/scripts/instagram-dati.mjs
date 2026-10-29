// Contenuti del piano Instagram: dati unici da cui si generano le immagini, i
// didascalia.txt e docs/comunicazione/piano-instagram.md. Si usa con instagram.mjs.
const BASE = 'https://www.dascanfe.com/sub/frigolo/'
export const utm = (content) =>
  `${BASE}?utm_source=instagram&utm_medium=social&utm_campaign=lancio&utm_content=${content}`
export const BIO_LINK = utm('bio')
export const CREDITO = 'Musica: Fun Day di AShamaluevMusic'
// nome della pagina Instagram di Frigolo: se @frigolo è già preso, cambialo qui e rigenera
export const PAGINA = '@frigolo.app'
const COLLAB = 'Post in collaborazione: pubblicalo dal tuo profilo e, prima di condividere, Tagga persone > Invita collaboratore > ' + PAGINA + '. Dalla pagina ' + PAGINA + ' accetta l\'invito (Attività o messaggi): il post compare su tutti e due i profili con gli stessi like e commenti.'
const STORIE = 'Storie: pubblicale dal tuo profilo menzionando ' + PAGINA + ' (sticker Menzione). Dalla pagina ' + PAGINA + ' ricondividi la menzione e salvala in evidenza.'

const S = 'marketing/screenshot/'
const P = (o) => ({ f: 'p', tipo: 'phone', ...o })
const C = (o) => ({ f: 'p', tipo: 'cover', ...o })
const T = (o) => ({ f: 'p', tipo: 'testo', ...o })
const ST = (o) => ({ f: 's', ...o })
const nn = (arr) => arr.map((x, i) => ({ ...x, n: `${i + 1}/${arr.length}` }))

export const CONTENUTI = [
  {
    id: 'S1-01-post-lancio',
    collab: COLLAB,
    evidenza: 'Novità',
    sett: 1,
    giorno: 'Domenica',
    ora: '19:30',
    data: '2026-10-18',
    titolo: 'Post di lancio',
    formato: 'Carosello 4:5, 4 slide',
    obiettivo: 'Annunciare che Frigolo è online e portare le prime prove dalla rete di Daniele.',
    immagini: nn([
      T({ tema: 'chiaro', titolo: 'Frigolo è *online*', testo: 'La lista della spesa da condividere.', mascotte: 'contenta', swipe: true }),
      P({ tema: 'menta', titolo: 'Tocchi, è *in lista*', testo: 'Sul telefono di tutti, in ordine di corsia.', schermata: S + 's05-lista-corsia.png' }),
      P({ tema: 'chiaro', titolo: 'Per conto tuo o *in compagnia*', testo: 'Si invita con un link, fino a 5 persone.', schermata: S + 's09-lista-coinquilini.png' }),
      C({ tema: 'lampone', titolo: 'Provala, *è gratis* ✨', testo: 'Si installa dal browser, senza store.', mascotte: 'contenta', chip: 'Link nella bio' }),
    ]),
    didascalia: `Frigolo è online! 🎉

L'ho fatta io: una lista della spesa da condividere. Tocchi un prodotto ed è in lista sul telefono di tutti, in ordine di corsia 🛒 Per conto tuo o con chi fa la spesa con te.

Si apre da un link e si installa dal browser, senza store 📱 È gratis, senza pubblicità e il codice è pubblico.

Provala: link nella bio. Poi scrivimi cosa ne pensi, leggo tutto 💚`,
    hashtag: '#frigolo #listadellaspesa #appitaliane #spesa #opensource #vitainsieme #coinquilini #uxdesign',
    alt: 'Carosello di 4 slide: Frigolo che festeggia con la scritta "Frigolo è online", la lista in ordine di corsia, la lista condivisa con i coinquilini e l\'invito a provarla dal link nella bio.',
    sticker: 'Subito dopo, in storia: pubblica "Frigolo è online" della raccolta Novità (00-storie-pagina/3-novita) con lo sticker link a ' + utm('storie-s1-01') + ', poi le raccolte Installa e Come funziona.',
    note: 'Stile e grafica delle storie di presentazione (S1-04), in formato post 4:5. Il Reel di lancio segue martedì 20.',
  },
  {
    id: 'S1-02-reel-lancio',
    collab: COLLAB,
    evidenza: 'Novità',
    sett: 1,
    giorno: 'Martedì',
    ora: '19:30',
    data: '2026-10-20',
    titolo: 'Reel di lancio',
    formato: 'Reel 9:16 (44 secondi)',
    obiettivo: 'Far conoscere Frigolo e portare le prime registrazioni dalla rete di Daniele.',
    video: [['marketing/video/out/frigolo-lancio-9x16.mp4', '01-reel-lancio.mp4']],
    immagini: [
      ['02-copertina-reel.png', ST({ tipo: 'cover', tema: 'chiaro', titolo: 'Chi compra *il latte?*', mascotte: 'pensierosa' })],
    ],
    didascalia: `Chi compra il latte? Da oggi si sa 🥛

Ho fatto Frigolo: una lista della spesa da condividere. Tocchi un prodotto ed è in lista sul telefono di tutti, in ordine di corsia.

📱 Si apre da un link e si installa dal browser, senza store
💚 È gratis, senza pubblicità, con il codice pubblico

Il bello arriva quando la condividi: invita chi fa la spesa con te 🛒 Uno aggiunge, l'altro lo vede subito sul suo telefono. Basta un link dalla lista, fino a 5 persone 🙌

Provala: link nella bio ✨

${CREDITO}`,
    hashtag: '#frigolo #listadellaspesa #appitaliane #spesa #opensource #vitainsieme #coinquilini #uxdesign',
    alt: 'Copertina del Reel: il frigorifero verde acqua Frigolo con una nuvoletta di dubbio e la scritta "Chi compra il latte?".',
    sticker: 'Nessuno nel Reel. Subito dopo, in storia, condividi il Reel con lo sticker link a ' + utm('storie-s1-02') + '.',
    note: 'Usa la copertina come immagine del Reel e scegli come musica "Fun Day" (è già nel video). Il video ha i sottotitoli disegnati dentro.',
  },
  {
    id: 'S1-03-carosello-come-funziona',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    evidenza: 'Come funziona',
    sett: 2,
    giorno: 'Martedì',
    ora: '12:30',
    data: '2026-10-27',
    titolo: 'Carosello "Come funziona"',
    formato: 'Carosello 4:5, 7 slide',
    obiettivo: 'Spiegare in un minuto cosa fa Frigolo. Salvataggi e invii a chi fa la spesa con te.',
    immagini: nn([
      C({ tema: 'lampone', titolo: 'Come funziona *Frigolo*', testo: 'In 6 passi, dalla lista alla cassa.', mascotte: 'classica', swipe: true }),
      P({ tema: 'chiaro', titolo: 'Tocchi un prodotto, *è in lista*', schermata: S + 's02-catalogo-dopo.png' }),
      P({ tema: 'menta', titolo: 'Si entra con *un link*', testo: 'Mandalo su WhatsApp, basta un tocco.', schermata: S + 's12-invito.png' }),
      P({ tema: 'chiaro', titolo: 'Lo vedono *tutti*, subito', testo: 'Anche se sono già al supermercato.', schermata: S + 's03-lista-avatar-a.png' }),
      P({ tema: 'menta', titolo: 'In ordine di *corsia*', testo: 'Frutta e verdura prima, surgelati alla fine.', schermata: S + 's05-lista-corsia.png' }),
      P({ tema: 'chiaro', titolo: 'Spesa *finita*', testo: 'Tutto nel carrello, si chiude con un tocco.', schermata: S + 's07-spesa-finita.png' }),
      C({ tema: 'lampone', titolo: 'Provala, *è gratis* ✨', testo: 'Senza pubblicità, il codice è pubblico.', mascotte: 'contenta', chip: 'Link nella bio' }),
    ]),
    didascalia: `Frigolo in 6 passi 🛒

1. Tocchi un prodotto nel catalogo
2. Inviti chi fa la spesa con te, con un link
3. Quello che aggiungi compare sul telefono di tutti
4. La lista segue le corsie del supermercato
5. Metti nel carrello quello che hai preso
6. Tocchi "Spesa finita" e il giro è chiuso ✨

Si usa per conto tuo o in compagnia, fino a 5 persone per lista. Gratis, senza pubblicità 💚

Salvalo per quando ti serve e mandalo a chi fa la spesa con te. Link nella bio.`,
    hashtag: '#frigolo #listadellaspesa #appitaliane #spesa #comefunziona #coppie #coinquilini #opensource',
    alt: 'Carosello di 7 slide con le schermate di Frigolo: catalogo, invito, lista condivisa, ordine di corsia, spesa finita e invito a provarla.',
    sticker: 'Storia del giorno: condividi la slide 4 con uno sticker Domanda "Chi fa la spesa a casa tua?" e, nella storia dopo, lo sticker link a ' + utm('storie-s1-03') + '.',
  },
  {
    id: 'S1-04-storie-weekend',
    collab: STORIE,
    evidenza: 'Installa',
    sett: 3,
    giorno: 'Mercoledì',
    ora: '08:00',
    data: '2026-11-04',
    titolo: 'Storie di presentazione (3)',
    formato: 'Storie 9:16, 3 immagini',
    obiettivo: 'Sondaggio leggero per far parlare chi ci segue e portare visite alla landing con lo sticker link.',
    immagini: [
      ['01-storia-online.png', ST({ tipo: 'testo', tema: 'chiaro', titolo: 'Frigolo è *online*', testo: 'La lista della spesa da condividere.', mascotte: 'contenta' })],
      ['02-storia-sondaggio.png', ST({ tipo: 'phone', tema: 'menta', titolo: 'Chi fa la spesa *a casa tua?*', schermata: S + 's09-lista-coinquilini.png', ty: 700 })],
      ['03-storia-link.png', ST({ tipo: 'phone', tema: 'lampone', titolo: 'Provala, *è gratis*', testo: 'Si installa dal browser.', schermata: S + 's06-carrello.png' })],
    ],
    didascalia: `Storie, nessuna didascalia. Testi degli sticker qui sotto.

Storia 1: nessuno sticker, serve a presentare Frigolo.
Storia 2: sondaggio "Chi fa la spesa a casa tua? 🛒" con le risposte "Io" e "Un po' tutti".
Storia 3: sticker link "Provala" verso ${utm('storie-s1-04')}.`,
    hashtag: '(le storie non usano hashtag)',
    alt: 'Tre storie: Frigolo che festeggia, la lista dei coinquilini con un sondaggio, la lista con i prodotti nel carrello e il link.',
    sticker: 'Storia 2: Sondaggio "Chi fa la spesa a casa tua?" (Io / Un po\' tutti), da mettere nella fascia bassa sopra il telefono. Storia 3: Link "Provala" verso ' + utm('storie-s1-04') + ' (sticker nella fascia bassa, sopra la zona di risposta).',
  },
  {
    id: 'S2-01-carosello-per-chi-e',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    sett: 3,
    giorno: 'Martedì',
    ora: '12:30',
    data: '2026-11-03',
    titolo: 'Carosello "Per chi è"',
    formato: 'Carosello 4:5, 6 slide',
    obiettivo: 'Far riconoscere ogni persona nel suo caso e spingere a girare il post: il condividere è il motore di Frigolo.',
    immagini: nn([
      C({ tema: 'menta', titolo: 'Frigolo è *per chi*...', testo: 'Fa la spesa in autonomia o in compagnia.', mascotte: 'classica', swipe: true }),
      P({ tema: 'chiaro', titolo: 'Per chi fa *in autonomia*', testo: 'Gli ultimi acquisti: un tocco e li rimetti in lista.', schermata: S + 's14-ultimi-acquisti.png' }),
      P({ tema: 'menta', titolo: 'Per chi la fa *in due*', testo: `Niente più "l'avevo scritto in chat".`, schermata: S + 's03-lista-avatar-a.png' }),
      P({ tema: 'chiaro', titolo: 'Per i *coinquilini*', testo: 'Una lista per la casa, la vedono tutti.', schermata: S + 's09-lista-coinquilini.png' }),
      P({ tema: 'menta', titolo: 'Per chi ha *una famiglia*', testo: 'Fino a 5 persone per lista, con un link.', schermata: S + 's12-invito.png' }),
      C({ tema: 'lampone', titolo: 'Manda questo post *a chi fa la spesa con te*', mascotte: 'posta', chip: 'Link nella bio' }),
    ]),
    didascalia: `Frigolo è per chi fa la spesa. Punto 🛒

✨ In autonomia: un tocco per aggiungere, e negli ultimi acquisti ritrovi quello che compri di solito: un tocco e lo rimetti in lista.
👀 In due: quello che aggiunge l'altra persona compare subito, anche se sei già a metà scaffale.
🍋 Con i coinquilini: una lista per la casa, la vedono tutti, nessuno deve pagare o scaricare niente dallo store.
💚 In famiglia: fino a 5 persone per lista, si entra con un link.

Mandalo a chi fa la spesa con te. Link nella bio.`,
    hashtag: '#frigolo #listadellaspesa #coinquilini #coppie #famiglia #vitadacoinquilini #appitaliane #spesa',
    alt: 'Carosello di 6 slide: Frigolo per chi fa la spesa in autonomia, in due, con i coinquilini o in famiglia, con le schermate dell\'app.',
    sticker: 'Storia: condividi il post con lo sticker Quiz "Quante persone in casa tua?" (1 / 2 / 3 / 4 o più) e lo sticker link a ' + utm('storie-s2-01') + '.',
  },
  {
    id: 'S2-02-post-ordine-corsia',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    sett: 2,
    giorno: 'Giovedì',
    ora: '12:30',
    data: '2026-10-29',
    titolo: 'Post "Ordine di corsia"',
    formato: 'Post singolo 4:5',
    obiettivo: 'Mostrare la funzione più concreta e visiva di Frigolo.',
    immagini: [
      ['01-ordine-di-corsia.png', P({ tema: 'menta', titolo: 'Frutta e verdura prima, *surgelati alla fine*', testo: 'La lista segue il percorso del supermercato.', schermata: S + 's05-lista-corsia.png', ty: 560, pw: 500 })],
    ],
    didascalia: `Il trucco che ho voluto per primo: la lista in ordine di corsia 🥑

Scegli il supermercato e Frigolo mette in cima frutta e verdura e in fondo i surgelati 🧊 Niente più giri avanti e indietro tra gli scaffali (i tuoi passi ringraziano).

L'ordine lo regoli tu, supermercato per supermercato ✨

Link nella bio.`,
    hashtag: '#frigolo #listadellaspesa #supermercato #spesa #trucchi #organizzazione #appitaliane #vitaquotidiana',
    alt: 'La lista di Frigolo sul telefono, divisa per sezioni nell\'ordine del supermercato, con la scritta "Frutta e verdura prima, surgelati alla fine".',
    sticker: 'Storia: condividi il post con lo sticker Sondaggio "Giri per il supermercato a caso?" (Sì / No, ho un ordine).',
  },
  {
    id: 'S2-03-reel-tempo-reale',
    collab: COLLAB,
    evidenza: 'Come funziona',
    sett: 2,
    giorno: 'Mercoledì',
    ora: '20:00',
    data: '2026-10-28',
    titolo: 'Reel breve "Tempo reale"',
    formato: 'Reel 9:16 (15 secondi)',
    obiettivo: 'Mostrare in 15 secondi il momento che fa capire Frigolo: aggiungi e compare sul telefono dell\'altra persona.',
    video: [['marketing/video/out/frigolo-lancio-15s.mp4', '01-reel-15s.mp4']],
    immagini: [
      ['02-copertina-reel.png', ST({ tipo: 'cover', tema: 'menta', titolo: 'Lo aggiungi *tu*, lo vedono *tutti*', mascotte: 'contenta' })],
    ],
    didascalia: `Io sono già al supermercato. Qualcuno ha appena aggiunto l'ananas 👀

Succede in tempo reale: aggiungi un prodotto e compare sul telefono di tutte le persone della lista. Te ne accorgi prima della cassa 🛒

Link nella bio ✨

${CREDITO}`,
    hashtag: '#frigolo #listadellaspesa #temporeale #spesa #appitaliane #opensource #coppie #coinquilini',
    alt: 'Copertina del Reel: Frigolo contento con la scritta "Lo aggiungi tu, lo vedono tutti".',
    sticker: 'Storia: condividi il Reel con lo sticker Emoji slider "Quanto ti succede?" e il link a ' + utm('storie-s2-03') + '.',
  },
  {
    id: 'S3-01-carosello-dietro-le-quinte',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    sett: 4,
    giorno: 'Martedì',
    ora: '12:30',
    data: '2026-11-10',
    titolo: 'Carosello "Dietro le quinte"',
    formato: 'Carosello 4:5, 6 slide',
    obiettivo: 'Raccontare il progetto con la voce di un UX/UI designer: design, mascotte, perché è gratis e open source.',
    immagini: nn([
      C({ tema: 'inchiostro', titolo: 'Dietro le quinte di *Frigolo*', testo: 'Come è nata e perché è così.', mascotte: 'classica', swipe: true }),
      T({ tema: 'chiaro', titolo: 'Parte da *un problema*', testo: 'Il latte che non arriva mai in lista. Da designer, mi sono messo a disegnarlo.', mascotte: 'pensierosa' }),
      P({ tema: 'menta', titolo: 'Pochi tocchi, *poche parole*', testo: 'Ogni schermata fa una cosa sola.', schermata: S + 's15-temi.png' }),
      T({ tema: 'menta', titolo: 'Il frigorifero *ha un nome*', testo: 'Si chiama Frigolo, come l\'app. Parla poco e fa un sorriso ogni tanto.', mascotte: 'contenta' }),
      T({ tema: 'inchiostro', titolo: 'Fatta con *una squadra di agenti AI*', testo: 'Io decido e disegno, loro scrivono il codice, i testi e il resto. Io rivedo tutto.', mascotte: 'classica' }),
      C({ tema: 'lampone', titolo: 'Gratis, senza pubblicità, *codice pubblico*', testo: 'Se ti è utile, il caffè lo offri tu.', mascotte: 'contenta', chip: 'Link nella bio' }),
    ]),
    didascalia: `Come è nata Frigolo ✨

Sono un UX/UI designer e mi dava fastidio una cosa piccola: la lista della spesa condivisa in chat, dove il latte si perde sempre 🥛 Così l'ho disegnata io.

Il frigorifero verde acqua è la mascotte e ha un nome: Frigolo 🧊 Parla poco, come l'app.

Il progetto l'ho fatto con una squadra di agenti AI: io decido, disegno e rivedo, loro scrivono codice e testi. Non è un segreto, è il bello 🙌

Perché è gratis e il codice è pubblico? Perché una lista della spesa non dovrebbe avere pubblicità né abbonamenti. Se ti piace, il caffè lo offri tu: c'è il link nella bio 💚`,
    hashtag: '#frigolo #uxdesign #uidesign #dietrolequinte #opensource #buildinpublic #designer #appitaliane',
    alt: 'Carosello di 6 slide sul progetto: il problema, il design, la mascotte Frigolo, la squadra di agenti AI e perché è gratis e open source.',
    sticker: 'Storia: sticker Domande "Cosa vuoi sapere di come è fatta?" e un secondo sticker con link al repository pubblico (https://github.com/dascanfe/frigolo).',
  },
  {
    id: 'S3-02-post-offline',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    evidenza: 'Come funziona',
    sett: 3,
    giorno: 'Giovedì',
    ora: '12:30',
    data: '2026-11-05',
    titolo: 'Post "Anche senza rete"',
    formato: 'Post singolo 4:5',
    obiettivo: 'Rispondere al dubbio "e se in negozio non prende?". Funzione che toglie un freno.',
    immagini: [
      ['01-offline.png', P({ tema: 'chiaro', titolo: 'In cantina il segnale *non c\'è?*', testo: 'La lista resta aperta. Le modifiche partono appena torna la rete.', schermata: S + 's17-offline.png', ty: 540, pw: 500 })],
    ],
    didascalia: `Il supermercato con il segnale che va e viene. Lo conosci 📱

Con Frigolo la lista resta aperta anche senza rete. Aggiungi, togli, metti nel carrello: le modifiche aspettano e partono appena torna il segnale ✨ In alto vedi quante ne sono in attesa.

Link nella bio 🛒`,
    hashtag: '#frigolo #listadellaspesa #offline #pwa #spesa #appitaliane #supermercato #opensource',
    alt: 'La lista di Frigolo con un avviso in alto: una modifica in attesa di rete. Titolo: la lista resta aperta anche senza segnale.',
    sticker: 'Storia: condividi il post con lo sticker Sondaggio "Il segnale nel tuo supermercato?" (Ottimo / A volte sparisce).',
  },
  {
    id: 'S3-03-carosello-analitiche-temi',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    sett: 4,
    giorno: 'Mercoledì',
    ora: '12:30',
    data: '2026-11-11',
    titolo: 'Carosello "Analitiche e temi"',
    formato: 'Carosello 4:5, 4 slide',
    obiettivo: 'Mostrare la profondità: cosa compri, chi mette in lista, e i colori da scegliere.',
    immagini: nn([
      P({ tema: 'chiaro', titolo: 'Cosa compri, *quanto spesso*', testo: 'Le analitiche contano prodotti e spese.', schermata: S + 's13-analitiche.png' }),
      P({ tema: 'menta', titolo: 'Come cambia *nel tempo*', testo: 'L\'andamento è a colpo d\'occhio.', schermata: S + 's13c-analitiche-andamento.png' }),
      P({ tema: 'chiaro', titolo: 'Gli ultimi acquisti *a un tocco*', testo: 'Quello che hai già comprato lo rimetti in lista subito.', schermata: S + 's14-ultimi-acquisti.png' }),
      P({ tema: 'lampone', titolo: 'Sei *temi* a scelta', testo: 'Lampone, Basilico, Mare e gli altri.', schermata: S + 's15-temi.png' }),
    ]),
    didascalia: `Frigolo è semplice, ma sotto c'è altro ✨

📊 Le analitiche mostrano cosa compri più spesso, chi mette cosa in lista e l'andamento delle spese nel tempo
🥑 Gli ultimi acquisti ti fanno rimettere in lista i soliti prodotti con un tocco
🎨 Il colore lo scegli tu: ci sono sei temi

Niente cookie, niente pubblicità, il codice è pubblico 💚 Link nella bio.`,
    hashtag: '#frigolo #listadellaspesa #design #temi #analitiche #uxdesign #appitaliane #opensource',
    alt: 'Carosello di 4 slide: le analitiche di Frigolo, l\'andamento nel tempo, gli ultimi acquisti e i sei temi di colore.',
    sticker: 'Storia: condividi la slide 4 con uno sticker Sondaggio "Quale tema?" (Lampone / Basilico / Mare / Altro).',
  },
  {
    id: 'S4-01-feedback',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    evidenza: 'Domande',
    sett: 4,
    giorno: 'Giovedì',
    ora: '12:30',
    data: '2026-11-12',
    titolo: 'Feedback "Cosa manca?"',
    formato: 'Post singolo 4:5 + 2 storie',
    obiettivo: 'Raccogliere idee e problemi veri. Le risposte alimentano la roadmap.',
    immagini: [
      ['01-post-cosa-manca.png', T({ tema: 'menta', titolo: 'Cosa *manca* a Frigolo?', testo: 'Dimmelo nei commenti: leggo tutto.', mascotte: 'pensierosa' })],
      ['02-storia-domanda.png', ST({ tipo: 'testo', tema: 'chiaro', titolo: 'Cosa vorresti *in più?*', testo: 'Rispondi qui, leggo tutto.', mascotte: 'pensierosa' })],
      ['03-storia-sondaggio.png', ST({ tipo: 'testo', tema: 'lampone', titolo: 'La *usi* ancora?', testo: 'Rispondi con sincerità.', mascotte: 'classica' })],
    ],
    didascalia: `Frigolo ha quasi un mese di vita e ho bisogno di te 👀

Cosa manca? Cosa ti ha fatto storcere il naso? C'è qualcosa che hai cercato e non hai trovato?

Scrivimelo nei commenti o in messaggio. Leggo tutto e rispondo appena posso: è un progetto fatto da una persona sola 🙌

Link nella bio 💚`,
    hashtag: '#frigolo #feedback #listadellaspesa #appitaliane #opensource #buildinpublic #uxdesign #community',
    alt: 'Il frigorifero Frigolo con la nuvoletta del dubbio e la domanda "Cosa manca a Frigolo?".',
    sticker: 'Storia 1: sticker Domande "Cosa vorresti in più?". Storia 2: Sondaggio "La usi ancora?" (Sì, spesso / A volte / No). Link a ' + utm('storie-s4-01') + ' nella storia dopo.',
  },
  {
    id: 'S4-02-offrimi-un-caffe',
    note: 'Formato 4:5: prima di "Seleziona più" tocca l\'icona del formato per passare a verticale.',
    collab: COLLAB,
    evidenza: 'Caffè',
    sett: 5,
    giorno: 'Martedì',
    ora: '12:30',
    data: '2026-11-17',
    titolo: 'Post "Offrimi un caffè"',
    formato: 'Post singolo 4:5',
    obiettivo: 'Dire come si regge Frigolo e dare, con garbo, un modo per ringraziare. Nessuna insistenza.',
    immagini: [
      ['01-offrimi-un-caffe.png', T({ tema: 'lampone', titolo: 'Frigolo è gratis *e lo resta*', testo: 'Se ti è utile, il caffè lo offri tu.', mascotte: 'contenta', chip: 'Offrimi un caffè 💚' })],
    ],
    didascalia: `Come si regge Frigolo? ☕

Non ha pubblicità, non ha abbonamenti e non vendo i tuoi dati. Server e dominio però qualche costo ce l'hanno, e quel poco lo copro io.

Frigolo è gratis e lo resta. Se ti è utile e ti va, puoi offrirmi un caffè: "Offrimi un caffè 💚" è nella bio. Dopo non si sblocca niente: chi offre e chi no usa la stessa app.

Grazie lo stesso a chi la usa 🙌`,
    hashtag: '#frigolo #opensource #sostenibilita #indie #buildinpublic #appitaliane #listadellaspesa #caffe',
    alt: 'Frigolo contento con la scritta "Frigolo è gratis e lo resta. Se ti è utile, il caffè lo offri tu".',
    sticker: 'Storia: condividi il post con lo sticker link a https://paypal.me/DanieleScanferlato (testo del bottone "Offrimi un caffè"). Una sola storia, senza ripeterla.',
  },
  {
    id: 'S4-03-riepilogo-mese',
    collab: COLLAB,
    sett: 5,
    giorno: 'Giovedì',
    ora: '12:30',
    data: '2026-11-19',
    titolo: 'Riepilogo del mese',
    formato: 'Carosello 4:5, 3 slide',
    obiettivo: 'Chiudere il ciclo, ringraziare e dire cosa succede dopo. I numeri veri si scrivono in didascalia.',
    immagini: nn([
      C({ tema: 'lampone', titolo: 'Un mese di *Frigolo*', testo: 'Grazie a chi l\'ha provata.', mascotte: 'contenta', swipe: true }),
      P({ tema: 'chiaro', titolo: 'Cosa *c\'è* adesso', testo: 'Liste condivise, ordine di corsia, offline, analitiche, temi.', schermata: S + 's13-analitiche.png' }),
      C({ tema: 'menta', titolo: 'Si *continua*', testo: 'Dimmi cosa vuoi nella prossima versione.', mascotte: 'classica', chip: 'Link nella bio' }),
    ]),
    didascalia: `Un mese di Frigolo 🎉

Fatti e numeri veri, da riempire prima di pubblicare:
🛒 Persone registrate: [N]
📱 Liste condivise: [N]
✨ Spese finite: [N]

Quello che è cambiato dopo i vostri messaggi: [una riga, per esempio una correzione o una novità fatta su richiesta].

Grazie a chi l'ha provata e a chi l'ha mandata a qualcun altro 💚 Frigolo resta gratis, senza pubblicità e con il codice pubblico. Dimmi cosa vuoi nella prossima versione.

Link nella bio.`,
    hashtag: '#frigolo #riepilogo #listadellaspesa #buildinpublic #opensource #appitaliane #grazie #uxdesign',
    alt: 'Carosello di 3 slide: "Un mese di Frigolo", cosa c\'è adesso nell\'app e invito a dire cosa vorresti.',
    sticker: 'Storia: condividi il post con lo sticker Domande "Cosa vuoi nella prossima versione?" e il link a ' + utm('storie-s4-03') + '.',
    note: 'Prima di pubblicare, riempire i segnaposto [N] della didascalia con i numeri del cruscotto di Pepe. Se un numero è troppo piccolo, meglio ometterlo.',
  },
]
