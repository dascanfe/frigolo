// ST3 (quiz prodotto piu' aggiunto) e ST4 (lista piu' strana).
//   node marketing/kit/scripts/caroselli-storie.mjs [ST3|ST4]
// Con la soluzione vera di ST3: RISPOSTA="Latte" node marketing/kit/scripts/caroselli-storie.mjs ST3
import { fmt, esc, ico, tile, mascotte, pubblica } from './caroselli-lib.mjs'

const CSS = `
.quattro { position:absolute; left:90px; right:90px; display:flex; gap:22px }
.quattro .tile { flex:1; height:230px }
.risp { position:absolute; left:110px; right:110px; background:#fffaf2; border-radius:60px; text-align:center; font-family:var(--font-display); font-weight:700; color:var(--ink); box-shadow:0 18px 0 rgba(58,44,33,.1); padding:70px 30px }
.risp small { display:block; font-family:var(--font-body); font-size:36px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:24px }
.lista-strana { position:absolute; left:130px; right:130px; background:#fffdf8; color:var(--ink); padding:50px 60px 60px; transform:rotate(-2deg); box-shadow:0 22px 50px rgba(58,44,33,.2); font-weight:700; font-size:50px; line-height:1.25 }
.lista-strana h3 { font-family:var(--font-display); font-style:italic; font-size:56px; color:var(--brick); margin-bottom:18px }
.lista-strana div { padding:12px 0; border-bottom:3px dashed rgba(58,44,33,.2) }
.lista-strana div:last-child { border-bottom:0 }
`

async function st3() {
  const risposta = process.env.RISPOSTA || '[RISPOSTA]'
  const s1 = { nome: 'storia-quiz', sfondo: 'menta', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;right:-340px;bottom:-300px"></div>` +
    `<h1 style="top:290px;left:70px;right:70px;font-size:96px;text-align:center">${fmt('Qual è il prodotto|*più aggiunto*|su Frigolo?')}</h1>` +
    `<div class="quattro" style="top:1330px">${['Latte fresco', 'Pane', 'Uova', 'Banane'].map((n) => tile(n)).join('')}</div>` }
  const s2 = { nome: 'storia-soluzione', sfondo: 'crema', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;left:-320px;bottom:-300px"></div>` +
    `<h1 style="top:290px;font-size:104px;text-align:center">${fmt('Il più aggiunto è...')}</h1>` +
    `<div class="risp" style="top:640px"><small>La risposta</small><span style="font-size:${risposta.length <= 8 ? 150 : risposta.length <= 12 ? 108 : 84}px;line-height:1.05;color:var(--brick)">${esc(risposta)}</span></div>` +
    mascotte('contenta', 'width:380px;left:350px;top:1180px') }
  await pubblica({
    cartella: '2026-11-27-ST3-storie-quiz-prodotto-piu-aggiunto', formato: 'storia', slides: [s1, s2],
    quando: "Venerdì 27 novembre 2026 alle 8:00 (piano d'inverno, settimana 4). Due storie: il quiz al mattino e la soluzione la sera stessa (il quiz dura 24 ore, ma la soluzione si può pubblicare appena ci sono voti). Prima di pubblicare la storia 02 serve il dato vero (vedi istruzioni.txt).",
    alt: ['Quattro tessere di prodotti (latte, pane, uova, banane) sotto la domanda "Qual è il prodotto più aggiunto su Frigolo?". Al centro c\'è lo spazio per il quiz.', `Frigolo contento sotto la scritta "Il più aggiunto è..." e la risposta${process.env.RISPOSTA ? ': ' + process.env.RISPOSTA : ' (da compilare)'}.`],
    istruzioni: `ST3 - Quiz "Qual è il prodotto più aggiunto su Frigolo?"
Pubblicale dal profilo di @frigolo.app, nell'ordine dei numeri. Fasce libere: 250 px in alto e 340 px in basso.

Storia 01 (01-storia-quiz.png)
- Sticker QUIZ, nello spazio libero al centro (tra il titolo e le tessere in basso).
  Domanda dello sticker: Qual è il prodotto più aggiunto su Frigolo?
  Risposte (4, in quest'ordine): Latte / Pane / Uova / Banane
  La risposta giusta da segnare nel quiz: quella vera, vedi sotto.
- Sticker MENZIONE @frigolo.app: piccolo, nella fascia bassa, sotto le tessere.
- Nessun link.

Storia 02 (02-storia-soluzione.png)
- Il file ha il segnaposto "[RISPOSTA]". Per averlo con la risposta vera, il PM (o Paprika) rigenera l'immagine con questo comando, dalla cartella del repository:
    RISPOSTA="Latte" node marketing/kit/scripts/caroselli-storie.mjs ST3
  (al posto di Latte la risposta vera; l'immagine si sovrascrive in questa cartella).
- In alternativa, in Instagram: sovrascrivi "[RISPOSTA]" con una scritta nello stesso colore del fondo della scheda (crema chiaro) e scrivi sopra la risposta.
- Un'aggiunta facoltativa: sticker REAZIONE o EMOJI SLIDER con "Te lo aspettavi?".

IL DATO VERO (importante)
- Il dato lo dà il PM dal cruscotto: il prodotto più aggiunto alle liste, contando SOLO i prodotti del catalogo base. Mai i prodotti creati dagli utenti, come promesso nell'informativa.
- Se il più aggiunto non è tra Latte, Pane, Uova e Banane, cambia le quattro risposte con le prime tre più aggiunte più un'altra, oppure aspetta il dato: il quiz deve avere la risposta giusta tra le quattro.
- Non pubblicare numeri sotto una soglia ridicola: dì solo "il più aggiunto è...", senza cifre, a meno che il PM dica che si può.`,
  })
}

async function st4() {
  const s1 = { nome: 'storia-domanda', sfondo: 'arancio', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;left:-300px;bottom:-320px"></div>` +
    `<h1 style="top:290px;font-size:112px;text-align:center">${fmt('Mostrami la tua|*lista* più strana')}</h1>` +
    mascotte('pensierosa', 'width:360px;left:360px;top:1230px') }
  const s2 = { nome: 'storia-esempio', sfondo: 'crema', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;right:-360px;top:-200px"></div>` +
    `<h1 style="top:290px;font-size:88px;text-align:center">${fmt('Questa è quella di *Lele*')}</h1>` +
    `<div class="lista-strana" style="top:560px"><h3>Spesa di sabato</h3><div>latte (forse)</div><div>quella roba per il bagno</div><div>il pane di ieri ma più buono</div><div>qualcosa di dolce, tu sai</div><div>pomodori, ma non quelli</div></div>` +
    mascotte('contenta', 'width:300px;left:700px;top:1290px') }
  await pubblica({
    cartella: '2026-12-02-ST4-storie-lista-piu-strana', formato: 'storia', slides: [s1, s2],
    quando: "Mercoledì 2 dicembre 2026 alle 8:00 (piano d'inverno, settimana 5). Due storie una dopo l'altra. Nei giorni dopo ricondividi le risposte più divertenti, solo con il permesso di chi le ha mandate.",
    alt: ['Il frigorifero Frigolo pensieroso sotto la scritta "Mostrami la tua lista più strana". Al centro c\'è lo spazio per lo sticker domande.', 'Una lista della spesa scritta a mano, di Lele: latte (forse), quella roba per il bagno, il pane di ieri ma più buono, qualcosa di dolce, pomodori ma non quelli.'],
    istruzioni: `ST4 - "Mostrami la tua lista più strana"
Pubblicale dal profilo di @frigolo.app, nell'ordine dei numeri. Fasce libere: 250 px in alto e 340 px in basso.

Storia 01 (01-storia-domanda.png)
- Sticker DOMANDE, nello spazio libero al centro, tra il titolo e la mascotte.
  Testo dello sticker: Mostrami la tua lista della spesa più strana
- Nessun link.

Storia 02 (02-storia-esempio.png)
- Serve a rompere il ghiaccio: è un esempio inventato (Lele è un personaggio demo), non una risposta vera. Non serve nessuno sticker.
- Sticker MENZIONE @frigolo.app: piccolo, in basso a sinistra, sotto la lista.

Nei giorni dopo (ricondivisione)
- Leggi le risposte allo sticker (tocca "Domande" nell'attività della storia).
- Scegli le 3-5 più divertenti. Scrivi a chi le ha mandate: "Posso ricondividerla nelle storie di @frigolo.app?" e aspetta il sì. Senza risposta, non si pubblica.
- Per ricondividere: nell'elenco delle risposte tocca "Rispondi" sulla risposta, che appare come sticker su una nuova storia. Aggiungi tu, a mano, una riga breve e affettuosa, nel tono di Frigolo (niente prese in giro).
- Evita risposte con nomi di persone o negozi riconoscibili, a meno che chi scrive voglia comparire.`,
  })
}

const quali = process.argv.slice(2).length ? process.argv.slice(2) : ['ST3', 'ST4']
if (quali.includes('ST3')) await st3()
if (quali.includes('ST4')) await st4()
