// Dopo il lancio dello scontrino: ST7 (storie "I vostri scontrini", 11 dicembre) e C9 (carosello "Lo scontrino del 2026", 22 dicembre).
//   node marketing/kit/scripts/caroselli-scontrino-dopo.mjs [st7|c9]
import { fmt, piede, mascotte, pubblica } from './caroselli-lib.mjs'
import { CSS } from './caroselli-scontrino-css.mjs'

const M = (f) => `../media-scontrino/${f}`
const quali = process.argv.slice(2)
const vuole = (k) => !quali.length || quali.includes(k)
const sc = (file, left, top, w, rot = 0) =>
  `<div class="sc" style="left:${left}px;top:${top}px;width:${w}px;height:${Math.round((w * 1920) / 1080)}px;transform:rotate(${rot}deg)"><img src="${M(file)}" alt=""></div>`

if (vuole('st7')) {
  const S = `
.cornice { position:absolute; left:110px; right:110px; border-radius:64px; border:10px dashed var(--brick); background:rgba(255,250,242,.55) }
.cornice.chiara { border-color:var(--cream); background:rgba(255,255,255,.12) }
.mini { position:absolute; opacity:.9 }
`
  const slides = [
    { nome: 'storia-cornice', sfondo: 'crema', extraCss: CSS + S, body:
      `<div class="macchia" style="width:1000px;height:1000px;right:-420px;top:-300px"></div>` +
      `<div class="etichetta" style="top:262px;left:110px">Dalla vostra spesa</div>` +
      `<h1 style="top:320px;left:110px;right:110px;font-size:104px">${fmt('I vostri *scontrini*')}</h1>` +
      `<div class="cornice" style="top:560px;height:960px"></div>` +
      mascotte('contenta', 'width:200px;right:70px;top:1380px') },
    { nome: 'storia-cornice-colori', sfondo: 'arancio', extraCss: CSS + S, body:
      `<div class="macchia" style="width:1000px;height:1000px;left:-420px;bottom:-300px"></div>` +
      `<h1 style="top:262px;left:110px;right:110px;font-size:98px;text-align:center">${fmt('Il vostro *scontrino*')}</h1>` +
      `<p class="t" style="top:400px;text-align:center;font-size:42px;color:var(--cream);font-weight:700">Grazie a chi ci ha taggato 💚</p>` +
      `<div class="cornice chiara" style="top:560px;height:960px"></div>` },
  ]
  await pubblica({
    cartella: '2026-12-11-ST7-storie-i-vostri-scontrini', slides, formato: 'storia',
    quando: 'Venerdì 11 dicembre 2026, anche in più momenti: ogni volta che arriva uno scontrino taggato. Due storie modello, 9:16.',
    alt: [
      'Cornice "I vostri scontrini" su sfondo crema: un grande riquadro tratteggiato dove incollare la storia ricondivisa.',
      'Cornice "Il vostro scontrino" su sfondo arancione, con la scritta "Grazie a chi ci ha taggato" e un riquadro tratteggiato per la storia ricondivisa.',
    ],
    istruzioni: `ST7 - Storie "I vostri scontrini" (modelli per ricondividere)
Sono due sfondi con una cornice vuota: non vanno pubblicati così, servono per ricondividere gli scontrini che le persone ci mandano.

Come si usa (per ogni scontrino taggato)
1. Apri la storia in cui @frigolo.app è menzionato (le trovi in Messaggi, oppure nelle notifiche) e tocca "Aggiungi alla tua storia".
2. Sulla nuova storia scegli lo sfondo: apri uno dei due modelli (01 o 02) dalla galleria del telefono e usalo come sfondo, oppure scegli un colore a tinta unita.
3. Rimpicciolisci la storia ricondivisa con due dita e portala dentro la cornice tratteggiata (la cornice sta tra 560 px e 1520 px dall'alto, fuori dalle fasce libere di 250 px in alto e 340 px in basso).
4. Nessun link obbligatorio: se vuoi, aggiungi lo sticker link a https://www.dascanfe.com/sub/frigolo/?utm_source=instagram&utm_medium=social&utm_campaign=inverno&utm_content=st7 con testo "Provalo".
5. Salvala nella raccolta in evidenza "Scontrini" (copertina: 0-profilo/storie-in-evidenza/copertine-in-evidenza/06-scontrini.png).

Permessi
- Chi ti tagga o ti menziona in una storia sta già dando il permesso di ricondividerla, ma se il profilo è privato scrivi prima in privato e aspetta il sì: un profilo privato non permette la ricondivisione, e va chiesto uno screenshot o l'immagine con il consenso scritto.
- Prima di ricondividere controlla che nello scontrino non ci siano nomi o dati che la persona non vuole mostrare (si possono nascondere dall'app). Se c'è un dubbio, chiedi.
- Niente premi o concorsi promessi. Rispondi a chi partecipa con un cuore o una frase breve.
`,
  })
}

if (vuole('c9')) {
  const Y0 = 586
  const carta = `<div class="cr" style="left:130px;top:330px;width:820px;height:540px"><img src="${M('anno-autunno.png')}" style="width:1080px;left:-130px;top:${-Y0}px" alt=""></div>`
  const riga = (y) => y - Y0 + 330
  const marker = (n, y) => `<div class="evid" style="left:140px;right:150px;top:${riga(y) - 28}px;height:56px"></div><div class="badge" style="left:50px;top:${riga(y) - 29}px">${n}</div>`
  const av = (l, c, x, y) => `<div style="position:absolute;left:${x}px;top:${y}px;width:170px;height:170px;border-radius:50%;background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:92px;box-shadow:0 10px 0 rgba(0,0,0,.14)">${l}</div>`
  const tot = 5
  const slides = [
    { nome: 'copertina', sfondo: 'inchiostro', extraCss: CSS, body:
      `<div class="macchia" style="width:1000px;height:1000px;left:-420px;top:-380px"></div>` +
      `<div class="etichetta" style="top:92px">Fine anno</div>` +
      `<h1 style="top:150px;font-size:92px;text-align:left;right:520px">${fmt('Lo scontrino del *2026*')}</h1>` +
      `<p class="t" style="top:640px;left:80px;right:auto;width:400px;font-size:42px">Tutto l'anno della tua lista, in un solo foglio.</p>` +
      sc('anno-autunno.png', 560, 300, 520, 6) +
      `<div class="pill" style="left:80px;top:1130px;background:var(--brick);color:#fff">Scorri ${'→'}</div>` + piede(1, tot, { destra: '' }) },
    { nome: 'un-anno-in-un-foglio', sfondo: 'arancio', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:90px;text-align:center">${fmt('Un anno in *un foglio*')}</h2>` + carta +
      marker(1, 627) + marker(2, 749) + marker(3, 813) + marker(4, 875) +
      `<div class="chip" style="top:905px;left:140px"><span class="n">1</span>Quante spese avete chiuso</div>` +
      `<div class="chip" style="top:990px;left:140px"><span class="n">2</span>Il re dell'anno <small>il più preso</small></div>` +
      `<div class="chip" style="top:1075px;left:140px"><span class="n">3</span>Chi ha messo più cose</div>` +
      `<div class="chip" style="top:1160px;left:140px"><span class="n">4</span>Il record dell'anno</div>` + piede(2, tot) },
    { nome: 'prima-di-natale', sfondo: 'crema', extraCss: CSS, body:
      `<h2 style="top:80px;font-size:96px;text-align:center">${fmt('Fallo *prima di Natale*')}</h2>` +
      `<div class="ph" style="left:100px;top:330px;width:330px;height:760px"><img src="${M('anno-scheda.png')}" style="top:-40px" alt=""></div>` +
      `<div class="ph" style="left:650px;top:380px;width:330px;height:760px;transform:rotate(3deg)"><img src="${M('anno-foglio.png')}" style="top:-60px" alt=""></div>` +
      `<div class="pillb" style="left:130px;top:1120px;background:var(--brick);color:#fff">Tutto il 2026</div>` +
      `<div class="pillb" style="left:600px;top:1170px;background:var(--brick);color:#fff">Salva o condividi</div>` + piede(3, tot) },
    { nome: 'insieme', sfondo: 'menta', extraCss: CSS, body:
      `<h2 style="top:90px;font-size:100px;text-align:center">${fmt('Fatelo *insieme*')}</h2>` +
      `<p class="t" style="top:340px;text-align:center;font-size:44px;color:var(--mint-deep)">Con la lista in comune lo scontrino racconta anche chi ha messo più cose.</p>` +
      av('G', '#a85641', 190, 640) + av('L', '#3e7c86', 455, 640) + av('M', '#c2902f', 720, 640) +
      mascotte('contenta', 'width:330px;left:375px;top:850px') +
      `<p class="t" style="top:1190px;text-align:center;font-size:40px;font-weight:900;color:var(--ink)">Chi sarà il re della spesa?</p>` + piede(4, tot) },
    { nome: 'chiusura', sfondo: 'arancio', extraCss: CSS, body:
      `<div class="macchia" style="width:1000px;height:1000px;left:-420px;bottom:-440px"></div>` +
      `<h1 style="top:110px;font-size:84px;text-align:left;right:520px">${fmt('Fai il tuo e mettilo *nelle storie*')}</h1>` +
      `<p class="t" style="top:640px;left:80px;right:auto;width:440px;font-size:42px;color:var(--cream)">Taggaci con <b style="color:var(--ink)">@frigolo.app</b> e buone feste.</p>` +
      sc('anno-mare.png', 590, 150, 420, -5) +
      mascotte('posta', 'width:300px;left:100px;top:960px') +
      `<div class="pill" style="left:420px;top:1140px;background:var(--ink);color:var(--cream);white-space:nowrap">Link nella bio</div>` + piede(5, tot, { destra: '' }) },
  ]
  await pubblica({
    cartella: '2026-12-22-C9-carosello-lo-scontrino-del-2026', slides,
    quando: 'Martedì 22 dicembre 2026 alle 19:00 (prima di Natale). Carosello 5 slide, formato 4:5: tocca l\'icona del formato prima di Seleziona più.',
    didascalia: `Lo scontrino del 2026 🧾

Prima di Natale, fai lo scontrino di tutto l'anno della tua lista. In Frigolo, nelle Analitiche (si aprono toccando gli avatar), nel riquadro "Lo scontrino" scegli "Tutto il 2026" e tocca "Crea lo scontrino". Dentro trovi le spese chiuse, i prodotti presi, il "Re dell'anno", chi ha messo più cose e il record. Il totale, come sempre, è 0,00.

Fallo con chi fa la spesa con te: con la lista in comune lo scontrino è ancora più divertente. Scegli il colore dello sfondo, nascondi i nomi se preferisci e tocca "Salva o condividi". L'immagine si crea sul tuo telefono.

Mettilo nelle storie e taggaci con @frigolo.app: li ricondividiamo tutti. Buone feste 💚

Link nella bio.

#frigolo #listadellaspesa #scontrino #riepilogo2026 #natale #spesa #appitaliane #spesaintelligente`,
    alt: [
      'Copertina: "Lo scontrino del 2026", con uno scontrino di Frigolo inclinato su sfondo scuro.',
      '"Un anno in un foglio": un pezzo dello scontrino annuale con quattro righe evidenziate: spese chiuse, re dell\'anno, chi ha messo più cose, il record.',
      '"Fallo prima di Natale": due schermate dell\'app, la scheda "Lo scontrino" con "Tutto il 2026" e il foglio con il tasto Salva o condividi.',
      '"Fatelo insieme": tre avatar e Frigolo contento, con la domanda "Chi sarà il re della spesa?".',
      '"Fai il tuo e mettilo nelle storie": uno scontrino con sfondo blu, Frigolo che regge una lettera, l\'invito a taggare @frigolo.app e Link nella bio.',
    ],
  })
}
