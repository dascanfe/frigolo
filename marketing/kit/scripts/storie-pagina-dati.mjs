// Storie in evidenza della pagina @frigolo.app: dati unici da cui si generano le immagini
// (modelli/storie-pagina.html), gli istruzioni.txt e la sezione "Le storie della pagina" del piano.
import { utm, PAGINA } from './instagram-dati.mjs'

const S = 'marketing/screenshot/'
const PAYPAL = 'https://paypal.me/DanieleScanferlato'
const ev = (nome) => utm('evidenza-' + nome)

const passo = (o) => ({ tipo: 'passo', tema: 'chiaro', ...o })
const ph = (o) => ({ tipo: 'phone', ...o })

export const RACCOLTE = [
  {
    cartella: '1-installa',
    nome: 'Installa',
    quando: 'Stasera, domenica 18 ottobre, subito dopo il post di lancio e la storia "Novità" (circa 19:40)',
    storie: [
      ['01-copertina.png', { tipo: 'cover', tema: 'lampone', titolo: 'Installala in *30 secondi* 📱', testo: 'Niente store, si fa dal browser. Promesso', mascotte: 'contenta' }],
      ['02-iphone-1-safari.png', passo({ passo: 'ios-safari', n: 'iPhone 1/3', titolo: 'Apri il link *con Safari*' })],
      ['03-iphone-2-condividi.png', passo({ passo: 'ios-condividi', n: 'iPhone 2/3', titolo: 'Tocca *Condividi*', tema: 'menta' })],
      ['04-iphone-3-aggiungi-a-home.png', passo({ passo: 'ios-home', n: 'iPhone 3/3', titolo: 'Scegli *Aggiungi a Home*' })],
      ['05-android-1-chrome.png', passo({ passo: 'and-chrome', n: 'Android 1/3', titolo: 'Apri il link *con Chrome*', tema: 'menta' })],
      ['06-android-2-installa-app.png', passo({ passo: 'and-menu', n: 'Android 2/3', titolo: 'Dal menu, *Installa app*' })],
      ['07-android-3-fatto.png', passo({ passo: 'and-fatto', n: 'Android 3/3', titolo: 'Fatto: *è nella tua Home*', tema: 'menta' })],
    ],
    istruzioni: `RACCOLTA IN EVIDENZA: Installa
Storie: 7 (01 copertina, 02-04 iPhone, 05-07 Android). Pubblicale dalla pagina ${PAGINA}, nell'ordine dei numeri.
Quando: ${'stasera, domenica 18 ottobre, subito dopo il post di lancio e la storia "Novità"'}.

Cosa aggiungere in Instagram
- Storia 01 (copertina): sticker link "Provala" verso
  ${ev('installa')}
  Mettilo nella fascia bassa, sopra la zona di risposta. Testo dello sticker: "Aprila da qui".
- Storie 02-07: nessuno sticker, solo le immagini. Se vuoi, aggiungi uno sticker GIF o emoji piccolo, ma non coprire i disegni.
- Le immagini hanno la fascia alta (250 px) e bassa (340 px) libera per l'interfaccia di Instagram.

Dopo la pubblicazione
- Salvale tutte nella raccolta "Installa" (Evidenza > Nuova). Copertina della raccolta: copertine-in-evidenza/01-installa.png
- Le storie spariscono dopo 24 ore, la raccolta resta.
- Se i passaggi di iOS o Android cambiano nome, aggiorna i disegni da marketing/kit/scripts/storie-pagina-dati.mjs.
`,
  },
  {
    cartella: '2-come-funziona',
    nome: 'Come funziona',
    quando: 'Stasera, domenica 18 ottobre, dopo la raccolta Installa (circa 19:50)',
    storie: [
      ['01-tocca-e-aggiungi.png', ph({ tema: 'chiaro', n: '1/4', titolo: 'Tocchi un prodotto, *è in lista*', schermata: S + 's02-catalogo-dopo.png' })],
      ['02-lo-vede-subito.png', ph({ tema: 'menta', n: '2/4', titolo: 'Chi è con te *lo vede subito*', schermata: S + 's03-lista-avatar-a.png' })],
      ['03-in-ordine-di-corsia.png', ph({ tema: 'lampone', n: '3/4', titolo: 'In ordine di *corsia*', schermata: S + 's05-lista-corsia.png' })],
      ['04-carrello-e-spesa-finita.png', ph({ tema: 'chiaro', n: '4/4', titolo: 'Nel carrello e *Spesa finita*', schermata: S + 's07-spesa-finita.png' })],
    ],
    istruzioni: `RACCOLTA IN EVIDENZA: Come funziona
Storie: 4, nell'ordine dei numeri. Pubblicale dalla pagina ${PAGINA}.
Quando: stasera, domenica 18 ottobre, dopo la raccolta Installa.

Cosa aggiungere in Instagram
- Storia 01: nessuno sticker.
- Storia 02: sticker emoji reazione (cuore) oppure "Aggiungi il tuo": non serve, lascia pulito.
- Storia 04 (ultima): sticker link "Provala" verso
  ${ev('come-funziona')}
  Mettilo nella fascia bassa, sopra la zona di risposta.
- Il telefono è lo screenshot vero dell'app: non coprirlo con altri sticker.

Dopo la pubblicazione
- Salvale nella raccolta "Come funziona". Copertina: copertine-in-evidenza/02-come-funziona.png
`,
  },
  {
    cartella: '3-novita',
    nome: 'Novità',
    quando: 'Stasera, domenica 18 ottobre, subito dopo il post di lancio (circa 19:35); martedì 20 si aggiunge la ricondivisione del Reel',
    storie: [
      ['01-frigolo-online.png', { tipo: 'testo', tema: 'chiaro', titolo: 'Frigolo è *online* ✨', testo: 'La lista della spesa da condividere. Gratis, senza pubblicità. Vieni a provarla!', mascotte: 'contenta', pos: 'destra' }],
    ],
    istruzioni: `RACCOLTA IN EVIDENZA: Novità
Storia: 1 ("Frigolo è online"). Da pubblicare DOPO il post di lancio (S1-01, stasera domenica 18 ottobre alle 19:30), dalla pagina ${PAGINA}.

Cosa fare
1. Appena il post di lancio è online (circa 19:35), pubblica questa storia con lo sticker link "Provala" verso
   ${ev('novita')}
   Mettilo nella fascia bassa, sotto la scritta, sopra la zona di risposta. Se vuoi, condividi anche il post di lancio nelle storie con lo sticker link a ${utm('storie-s1-01')}.
2. Salva la storia nella raccolta "Novità". Copertina: copertine-in-evidenza/03-novita.png
3. Martedì 20 ottobre, quando esce il Reel di lancio (S1-02, 19:30), ricondividilo nelle storie (icona aereo di carta > Aggiungi alla tua storia) con sticker link a ${utm('storie-s1-02')} e aggiungilo alla stessa raccolta.

Le prossime novità (nuove funzioni, versioni) si aggiungono a questa raccolta.
`,
  },
  {
    cartella: '4-domande',
    nome: 'Domande',
    quando: 'Settimana 4, giovedì 12 novembre (mattina, 8:00), insieme a S4-01 (Feedback "Cosa manca?")',
    storie: [
      ['01-cosa-vorresti.png', { tipo: 'testo', tema: 'menta', titolo: 'Cosa vorresti *in Frigolo?* 👀', testo: 'Scrivilo qui sotto: leggo tutto e rispondo a tutti.', mascotte: 'pensierosa', pos: 'basso' }],
      ['02-faq.png', { tipo: 'faq', tema: 'chiaro', titolo: 'Le tre *domande* più frequenti', voci: [
        ['È gratis?', 'Sì, e lo resta. Senza pubblicità, con il codice pubblico.'],
        ['Servono account?', 'Ti basta un indirizzo email. Chi viene con te entra con un link.'],
        ['Funziona offline?', 'Sì: la lista si apre anche senza rete e si aggiorna appena torna il segnale.'],
      ] }],
    ],
    istruzioni: `RACCOLTA IN EVIDENZA: Domande
Storie: 2. Da pubblicare nella settimana 4 (giovedì 12 novembre al mattino, accanto a S4-01), dalla pagina ${PAGINA}.

Storia 01 "Cosa vorresti in Frigolo?"
- Aggiungi lo sticker DOMANDA (sticker > Domande) con il testo "Cosa vorresti in Frigolo?".
- Posizionalo al centro, nello spazio vuoto sotto il titolo (circa tra 740 e 1180 px di altezza): è lasciato libero apposta.
- Cambia il colore dello sticker su un tono che stacchi dal fondo menta (rosa lampone o crema).
- Nelle 24 ore rispondi alle domande condividendo le risposte nelle storie. Le migliori finiscono nel prossimo post di feedback.

Storia 02 "Le 3 domande più frequenti"
- Nessuno sticker. Se vuoi, mettilo come seconda storia subito dopo la 01.
- Aggiungi lo sticker link verso ${ev('domande')} nella fascia bassa.

Dopo la pubblicazione
- Salva entrambe nella raccolta "Domande". Copertina: copertine-in-evidenza/04-domande.png
- Le risposte alle domande della gente che escono più spesso si possono aggiungere come nuove storie alla raccolta.
`,
  },
  {
    cartella: '5-caffe',
    nome: 'Caffè',
    quando: 'Settimana 5, martedì 17 novembre (mattina, 8:00), insieme a S4-02 (Post "Offrimi un caffè")',
    storie: [
      ['01-offrimi-un-caffe.png', { tipo: 'testo', tema: 'lampone', titolo: 'Offrimi un *caffè* 💚', testo: 'Frigolo è gratis e senza pubblicità. Se ti è utile e ti va, un caffè mi aiuta a tenerlo vivo.', mascotte: 'contenta', pos: 'destra' }],
    ],
    istruzioni: `RACCOLTA IN EVIDENZA: Caffè
Storia: 1. Da pubblicare nella settimana 5, martedì 17 novembre al mattino, insieme al post S4-02 "Offrimi un caffè". Dalla pagina ${PAGINA}.

Cosa aggiungere in Instagram
- Sticker link "Offrimi un caffè" verso
  ${PAYPAL}
  Mettilo nella fascia bassa, sotto il testo, sopra la zona di risposta.
- Un solo invito, garbato: niente altre richieste di donazione nelle altre storie.

Dopo la pubblicazione
- Salvala nella raccolta "Caffè". Copertina: copertine-in-evidenza/05-caffe.png
`,
  },
]

export const COPERTINE = [
  ['01-installa.png', 'installa'],
  ['02-come-funziona.png', 'funziona'],
  ['03-novita.png', 'novita'],
  ['04-domande.png', 'domande'],
  ['05-caffe.png', 'caffe'],
]

export const LEGGIMI = `STORIE DELLA PAGINA ${PAGINA}: come usarle

Cinque raccolte in evidenza. In ogni cartella ci sono le storie numerate nell'ordine di
pubblicazione e un istruzioni.txt (sticker, link, cosa scrivere). Le copertine delle raccolte
sono in copertine-in-evidenza/ (5 immagini da 1080x1920: carica ognuna come copertina e ritaglia
il cerchio al centro).

Ordine di pubblicazione
1. Domenica 18 ottobre 2026, 19:30: post di lancio (S1-01) in collaborazione con ${PAGINA}.
2. Subito dopo (circa 19:35): 3-novita
3. Poi (circa 19:40): 1-installa
4. Poi (circa 19:50): 2-come-funziona
5. Martedì 20 ottobre, 19:30: Reel di lancio (S1-02), da ricondividere e aggiungere a Novità.
6. Giovedì 12 novembre, mattina: 4-domande (con S4-01)
7. Martedì 17 novembre, mattina: 5-caffe (con S4-02)

Zone sicure: nelle storie la fascia alta (250 px) e bassa (340 px) è libera per l'interfaccia
di Instagram: lì vanno gli sticker.
`

// sezione per il piano
export const SEZIONE_STORIE = `## Le storie della pagina

Oltre ai 12 contenuti, la pagina ${PAGINA} ha **5 raccolte in evidenza** già pronte in
\`pacchetto-instagram/00-storie-pagina/\`: 1080x1920, tema lampone con la mascotte, schermate vere
dell'app, fasce alta (250 px) e bassa (340 px) libere per l'interfaccia di Instagram. Ogni
cartella ha le storie numerate nell'ordine di pubblicazione e un \`istruzioni.txt\` con sticker e
link. Si pubblicano dalla pagina ${PAGINA}, poi si salvano in evidenza. Le cinque copertine
rotonde sono in \`copertine-in-evidenza/\`.

| Raccolta | Quando | Storie | Sticker principale |
| -------- | ------ | ------ | ------------------ |
${RACCOLTE.map((r) => `| ${r.nome} (\`${r.cartella}\`) | ${r.quando} | ${r.storie.length} | ${r.cartella === '4-domande' ? 'Domanda "Cosa vorresti in Frigolo?" + link' : r.cartella === '5-caffe' ? 'Link PayPal' : 'Link alla landing'} |`).join('\n')}

**Sera del lancio, domenica 18 ottobre, in ordine**

1. 19:30 Post di lancio (S1-01), carosello in collaborazione con ${PAGINA}.
2. 19:35 Pubblica "Frigolo è online" (\`3-novita\`) con sticker link, e se vuoi condividi il post nelle storie.
3. 19:40 Pubblica le 7 storie di \`1-installa\`, poi le 4 di \`2-come-funziona\`.
4. Salva ogni gruppo nella sua raccolta in evidenza, con la copertina da \`copertine-in-evidenza/\`.

**Più avanti:** martedì 20 ottobre il Reel di lancio (S1-02) si ricondivide e si aggiunge a \`3-novita\`; \`4-domande\` giovedì 12 novembre (mattina) insieme a S4-01, \`5-caffe\` martedì 17 novembre (mattina)
insieme a S4-02 (è l'unico invito a donare, in linea con il tono).

`
