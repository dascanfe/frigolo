// L1, lancio dello scontrino (app 2.3.0): carosello "Lo scontrino di Frigolo" (6 slide 4:5) e storie STL (3 storie 9:16).
// Usa gli scontrini veri creati dall'app (marketing/video/capture/scontrino.mjs -> marketing/kit/media-scontrino).
//   node marketing/kit/scripts/caroselli-l1.mjs [carosello|storie]
import { fmt, piede, mascotte, pubblica } from './caroselli-lib.mjs'

const M = (f) => `../media-scontrino/${f}`
const quali = process.argv.slice(2)
const vuole = (k) => !quali.length || quali.includes(k)

import { CSS } from './caroselli-scontrino-css.mjs'
const tot = 6
/** scontrino a tutta pagina (1080x1920) in una cornice, anche inclinato */
const sc = (file, left, top, w, rot = 0) =>
  `<div class="sc" style="left:${left}px;top:${top}px;width:${w}px;height:${Math.round((w * 1920) / 1080)}px;transform:rotate(${rot}deg)"><img src="${M(file)}" alt=""></div>`
const phone = (file, left, top, off, extra = '') =>
  `<div class="ph" style="left:${left}px;top:${top}px"><img src="${M(file)}" style="top:${-off}px" alt="">${extra}</div>`

if (vuole('carosello')) {
  // carta di uno scontrino ritagliata alle righe (x 131-949 del PNG 1080x1920)
  const SCALA = 1
  const Y0 = 586
  const TOP2 = 440
  const cartaRighe = `<div class="cr" style="left:130px;top:${TOP2}px;width:820px;height:540px"><img src="${M('nov-autunno.png')}" style="width:1080px;left:-130px;top:${-Y0}px" alt=""></div>`
  const riga = (yImg) => yImg - Y0 + TOP2
  const marker = (n, yImg) => `<div class="evid" data-n="${n}" style="left:140px;right:150px;top:${riga(yImg) - 28}px;height:56px"></div>`
  const slides = [
    { nome: 'copertina', sfondo: 'crema', extraCss: CSS, body:
      `<div class="macchia" style="width:900px;height:900px;left:-380px;top:-320px"></div>` +
      `<div class="etichetta" style="top:92px">Novità di Frigolo 2.3</div>` +
      `<h1 style="top:150px;font-size:112px;text-align:left;right:360px">${fmt('La tua spesa ha uno *scontrino*')}</h1>` +
      `<p class="t" style="top:760px;left:80px;right:auto;width:400px;font-size:42px">Il riepilogo di quello che avete messo in lista, da salvare o pubblicare nelle storie!</p>` +
      sc('nov-autunno.png', 560, 330, 520, 6) +
      `<div class="pill" style="left:80px;top:1130px;background:var(--brick);color:#fff">Scorri ${'→'}</div>` + piede(1, tot, { destra: '' }) },
    { nome: 'cosa-ce-dentro', sfondo: 'arancio', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:90px;text-align:center">${fmt('Cosa c\'è *dentro*')}</h2>` + cartaRighe +
      marker(1, 749) + marker(2, 813) + marker(3, 875) + marker(4, 1048) +
      piede(2, tot) },
    { nome: 'sei-colori', sfondo: 'menta', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:96px;text-align:center">${fmt('Sei colori, *scegli il tuo*')}</h2>` +
      ['autunno', 'basilico', 'mare', 'prugna', 'lampone', 'liquirizia'].map((t, i) => {
        const x = 50 + (i % 3) * 335, y = 300 + Math.floor(i / 3) * 425
        return `<div class="tile6" style="left:${x}px;top:${y}px"><img src="${M('nov-' + t + '.png')}" alt=""><span>${t[0].toUpperCase() + t.slice(1)}</span></div>`
      }).join('') +
      `<p class="t" style="top:1170px;text-align:center;font-size:38px;color:var(--mint-deep)">Lo sfondo parte dal tema della tua app.</p>` + piede(3, tot) },
    { nome: 'nomi', sfondo: 'inchiostro', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:98px;text-align:center">${fmt('I nomi li *nascondi tu*')}</h2>` +
      `<p class="t" style="top:330px;text-align:center;font-size:38px;color:var(--cream)">Un interruttore e spariscono le persone e il nome della lista.</p>` +
      `<div class="tile6" style="left:110px;top:480px;width:380px;height:640px"><img src="${M('nov-autunno.png')}" alt=""></div>` +
      `<div class="tile6" style="left:590px;top:480px;width:380px;height:640px"><img src="${M('nov-autunno-senza-nomi.png')}" alt=""></div>` +
      `<div class="pillb" style="left:195px;top:1100px">Con i nomi</div><div class="pillb" style="left:665px;top:1100px">Senza nomi</div>` + piede(4, tot) },
    { nome: 'tre-passi', sfondo: 'crema', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:104px;text-align:center">${fmt('Si fa in *3 passi*')}</h2>` +
      phone('home.png', 60, 330, 0, '<div class="hl" style="left:160px;top:4px;width:100px;height:66px"><i></i></div>') +
      phone('giulia-scheda.png', 395, 330, 50, '<div class="hl" style="left:72px;top:130px;width:172px;height:58px"><i></i></div>') +
      phone('giulia-foglio.png', 730, 330, 80, '<div class="hl" style="left:6px;top:394px;width:258px;height:62px"><i></i></div>') +
      `<div class="cap" style="left:55px;top:900px"><span class="n">1</span>${fmt('Tocca gli *avatar* in alto')}</div>` +
      `<div class="cap" style="left:390px;top:900px"><span class="n">2</span>${fmt('In *Lo scontrino* scegli il periodo e tocca Crea')}</div>` +
      `<div class="cap" style="left:725px;top:900px"><span class="n">3</span>${fmt('Scegli lo sfondo, poi *Salva o condividi*')}</div>` +
      `<p class="t" style="top:1150px;text-align:center;font-size:34px;left:60px;right:60px">L'immagine si crea sul tuo telefono: non passa da nessun server.</p>` + piede(5, tot) },
    { nome: 'chiusura', sfondo: 'arancio', extraCss: CSS, body:
      `<div class="macchia" style="width:1000px;height:1000px;left:-420px;bottom:-440px"></div>` +
      `<h1 style="top:110px;font-size:84px;text-align:left;right:520px">${fmt('Fai il tuo, mettilo *nelle storie*')}</h1>` +
      `<p class="t" style="top:640px;left:80px;right:auto;width:440px;font-size:42px;color:var(--cream)">Taggaci con <b style="color:var(--ink)">@frigolo.app</b>: li ricondividiamo tutti!</p>` +
      sc('nov-mare.png', 590, 150, 420, -5) +
      mascotte('contenta', 'width:300px;left:100px;top:960px') +
      `<div class="pill" style="left:420px;top:1140px;background:var(--ink);color:var(--cream);white-space:nowrap">Link nella bio</div>` + piede(6, tot, { destra: '' }) },
  ]
  await pubblica({
    cartella: '2026-11-20-L1-carosello-lo-scontrino', slides,
    quando: 'Venerdì 20 novembre 2026 alle 19:00, dopo che la 2.3.0 è online. Carosello 6 slide, formato 4:5: tocca l\'icona del formato prima di Seleziona più. Fatto per essere salvato.',
    didascalia: `La tua spesa ora ha uno scontrino 🧾

Da oggi in Frigolo trovi "Lo scontrino": un'immagine a forma di scontrino con la spesa della tua lista. Spese chiuse, prodotti presi, il "Re del mese", chi ha messo più cose, il record. E il totale, ovviamente, è 0,00.

Si fa in tre passi: tocca gli avatar per aprire le Analitiche, in "Lo scontrino" scegli il periodo (questo mese, il mese scorso, tutto il 2026) e tocca "Crea lo scontrino". Scegli il colore dello sfondo tra sei, nascondi i nomi se vuoi e tocca "Salva o condividi": lo metti in Foto, nelle storie o in chat.

L'immagine si crea sul tuo telefono e non passa da nessun server.

Fai il tuo, mettilo nelle storie e taggaci con @frigolo.app: li ricondividiamo tutti 💚

Link nella bio.

#frigolo #listadellaspesa #scontrino #spesa #app #appitaliane #spesaintelligente #storieinstagram`,
    alt: [
      'Copertina: "La tua spesa ha uno scontrino", con uno scontrino di Frigolo inclinato su sfondo arancione e la scritta Scorri.',
      '"Cosa c\'è dentro": un pezzo di scontrino con quattro righe evidenziate: Re del mese, chi ha messo più cose, il record e il totale app, sempre 0,00.',
      '"Sei colori, scegli il tuo": sei scontrini affiancati con sfondo Autunno, Basilico, Mare, Prugna, Lampone e Liquirizia.',
      '"I nomi li nascondi tu": due scontrini a confronto, uno con i nomi e uno senza.',
      '"Si fa in 3 passi": tre schermate dell\'app. 1 tocca gli avatar in alto, 2 in Lo scontrino scegli il periodo e tocca Crea, 3 scegli lo sfondo, poi Salva o condividi.',
      '"Fai il tuo, mettilo nelle storie": uno scontrino con sfondo blu, Frigolo contento, l\'invito a taggare @frigolo.app e la scritta Link nella bio.',
    ],
  })
}

if (vuole('storie')) {
  const cartella = '2026-11-20-STL-storie-lo-scontrino'
  const S = `
.num { position:absolute; left:80px; width:110px; height:110px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-weight:700; font-size:70px; display:flex; align-items:center; justify-content:center }
.passo { position:absolute; left:230px; right:80px; font-weight:900; font-size:62px; line-height:1.12; color:var(--ink) }
.passo em { font-family:var(--font-display); font-style:italic; color:var(--brick) }
.passo small { display:block; margin-top:8px; font-weight:700; font-size:38px; color:var(--ink-soft) }
`
  const slides = [
    { nome: 'storia-novita', sfondo: 'inchiostro', extraCss: CSS + S, body:
      `<div class="macchia" style="width:1100px;height:1100px;left:-400px;top:700px"></div>` +
      `<div class="pill" style="left:80px;top:260px;background:var(--brick);color:#fff">Novità</div>` +
      `<h1 style="top:350px;font-size:92px;right:80px">${fmt('Lo scontrino della tua *spesa*')}</h1>` +
      sc('nov-autunno.png', 260, 600, 560, 4) },
    { nome: 'storia-fai-il-tuo', sfondo: 'crema', extraCss: CSS + S, body:
      `<div class="macchia" style="width:1000px;height:1000px;right:-400px;top:-300px"></div>` +
      `<h1 style="top:260px;font-size:112px">${fmt('Fai il *tuo*')}</h1>` +
      `<div class="num" style="top:520px">1</div><div class="passo" style="top:520px">Tocca gli <em>avatar</em><small>si aprono le Analitiche</small></div>` +
      `<div class="num" style="top:730px">2</div><div class="passo" style="top:730px"><em>Lo scontrino</em><small>scegli il periodo e il colore</small></div>` +
      `<div class="num" style="top:940px">3</div><div class="passo" style="top:940px"><em>Salva o condividi</em><small>in Foto, nelle storie o in chat</small></div>` +
      mascotte('contenta', 'width:260px;right:70px;top:1190px') },
    { nome: 'storia-mandacelo', sfondo: 'arancio', extraCss: CSS + S, body:
      `<div class="macchia" style="width:1000px;height:1000px;left:-300px;bottom:-300px"></div>` +
      `<h1 style="top:260px;font-size:110px;text-align:center">${fmt('*Mandacelo*')}</h1>` +
      `<p class="t" style="top:430px;text-align:center;font-size:50px;color:var(--cream);font-weight:700">Menziona <b style="color:var(--ink)">@frigolo.app</b><br>e lo ricondividiamo.</p>` +
      sc('nov-mare.png', 60, 740, 320, -7) + sc('anno-autunno.png', 380, 700, 320, 0) + sc('nov-lampone.png', 700, 740, 320, 7) },
  ]
  await pubblica({
    cartella, slides, formato: 'storia',
    quando: 'Venerdì 20 novembre 2026, subito dopo il carosello L1 delle 19:00 (stesso giorno, 2.3.0 online). Tre storie 9:16, una dopo l\'altra.',
    alt: [
      'Novità: "Lo scontrino della tua spesa", con uno scontrino di Frigolo grande e un po\' inclinato.',
      '"Fai il tuo" in tre passi: 1 tocca gli avatar, 2 Lo scontrino (scegli il periodo e il colore), 3 Salva o condividi.',
      '"Mandacelo": menziona @frigolo.app e lo ricondividiamo, con tre scontrini di colori diversi.',
    ],
    istruzioni: `STL - Storie "Lo scontrino" (lancio 2.3.0)
Pubblicale dal profilo di @frigolo.app, nell'ordine dei numeri, una subito dopo l'altra, venerdì 20 novembre dopo il carosello delle 19:00.
Fasce libere: 250 px in alto e 340 px in basso, niente testi importanti lì.

Storia 01 (01-storia-novita.png)
- Nessuno sticker obbligatorio. Se vuoi, aggiungi lo sticker link come nella storia 02.

Storia 02 (02-storia-fai-il-tuo.png)
- Sticker LINK verso https://www.dascanfe.com/sub/frigolo/?utm_source=instagram&utm_medium=social&utm_campaign=inverno&utm_content=l1
  Testo dello sticker: Provalo
  Posizionalo nello spazio libero in basso, sotto i tre passi (circa tra 1280 e 1500 px dall'alto).

Storia 03 (03-storia-mandacelo.png)
- Sticker MENZIONE @frigolo.app, nello spazio libero in basso, sotto i tre scontrini (circa a 400 px dal fondo).
- Sticker link opzionale, come nella storia 02.

Dopo la pubblicazione
- Salvale in una nuova raccolta in evidenza chiamata "Scontrini". Copertina: 0-profilo/storie-in-evidenza/copertine-in-evidenza/06-scontrini.png
- Controlla ogni giorno le menzioni: chi ti menziona con il suo scontrino ti dà già il permesso di ricondividerlo (se il profilo è privato, chiedi prima).
- Niente premi o concorsi promessi.
`,
  })
}
