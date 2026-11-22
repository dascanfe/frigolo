// C7, carosello "Il gruppo Spesa contro Frigolo" (condivisione): la chat di gruppo disegnata, poi la stessa spesa in Frigolo.
//   node marketing/kit/scripts/caroselli-c7.mjs
import { fmt, esc, piede, mascotte, schermoCrop, pubblica } from './caroselli-lib.mjs'

const CSS = `
.chat { position:absolute; inset:0; background:#efe4d6 }
.barra { position:absolute; left:0; right:0; top:0; height:190px; background:var(--ink); color:var(--cream); display:flex; align-items:center; gap:26px; padding:44px 60px 0 }
.barra .gruppo { width:92px; height:92px; border-radius:50%; background:var(--mint); color:var(--mint-deep); font-family:var(--font-display); font-weight:700; font-size:54px; display:flex; align-items:center; justify-content:center }
.barra b { display:block; font-size:50px; font-family:var(--font-display) }
.barra small { font-size:30px; color:var(--sand) }
.msgs { position:absolute; left:50px; right:50px; top:225px; display:flex; flex-direction:column; gap:20px }
.m { max-width:700px; padding:22px 32px 24px; border-radius:36px; font-size:44px; font-weight:700; line-height:1.18; background:#fffaf2; color:var(--ink); box-shadow:0 6px 0 rgba(58,44,33,.08); border-bottom-left-radius:10px; align-self:flex-start }
.m .chi { display:block; font-size:27px; font-weight:900; letter-spacing:.05em; margin-bottom:4px }
.m.io { align-self:flex-end; background:var(--mint); color:var(--mint-deep); border-bottom-left-radius:36px; border-bottom-right-radius:10px }
.m.forte { font-size:56px; letter-spacing:.01em }
.m.agg { background:#f6d3c1 }
.badge47 { position:absolute; right:50px; top:215px; background:var(--brick); color:#fff; border-radius:999px; padding:20px 44px; font-weight:900; font-size:60px; box-shadow:0 12px 0 rgba(58,44,33,.15); transform:rotate(-5deg) }
.col2 { position:absolute; left:80px; width:420px }
.col2 h1, .col2 p.t { position:static }
`
const COL = { Giulia: '#3e7c86', Lele: '#a85641', Luca: '#7e7530', Marta: '#c2902f', Tu: '#04342f' }
const m = (chi, testo, o = {}) => `<div class="m ${chi === 'Tu' ? 'io' : ''} ${o.forte ? 'forte' : ''} ${o.agg ? 'agg' : ''}" style="${o.rot ? `transform:rotate(${o.rot}deg);` : ''}${o.ml ? `margin-left:${o.ml}px;` : ''}${o.mr ? `margin-right:${o.mr}px;` : ''}"><span class="chi" style="color:${COL[chi]}">${chi === 'Tu' ? '' : chi}</span>${esc(testo)}</div>`
const chat = (sub, msgs, extra = '') =>
  `<div class="chat"></div><div class="barra"><div class="gruppo">S</div><div><b>Spesa</b><small>${sub}</small></div></div><div class="msgs">${msgs.join('')}</div>${extra}`
const tot = 6
const slides = [
  { nome: 'chat-1', sfondo: 'crema', extraCss: CSS, body: chat('Giulia, Lele, Luca, Marta', [
    m('Lele', 'ragazzi vado a fare la spesa'), m('Giulia', 'prendi il latte?'), m('Lele', 'quale?'), m('Giulia', 'quello senza lattosio'), m('Lele', 'ok'), m('Luca', 'a che ora torni?', { }),
  ]) + `<div class="pill" style="left:50%;transform:translateX(-50%);bottom:90px;background:var(--ink);color:var(--cream);white-space:nowrap">Fin qui tutto bene...</div>` },
  { nome: 'chat-2', sfondo: 'crema', extraCss: CSS, body: chat('Giulia, Lele, Luca, Marta', [
    m('Lele', 'ne ho preso due 🫠', { rot: -1 }), m('Giulia', 'perché due?'), m('Lele', 'era in offerta'), m('Marta', 'io ho già preso il latte ieri'), m('Luca', 'e il pane??', { rot: 1 }), m('Lele', 'quale pane'),
  ]) + `<div class="pill" style="left:50%;transform:translateX(-50%);bottom:90px;background:var(--ink);color:var(--cream);white-space:nowrap">Si complica...</div>` },
  { nome: 'chat-3', sfondo: 'crema', extraCss: CSS, body: chat('Giulia, Lele, Luca, Marta', [
    m('Marta', 'chi ha le uova?', { rot: -1.5 }), m('Giulia', 'la lista è nelle note', { rot: 1 }), m('Luca', 'quale lista', { ml: 40 }), m('Lele', 'sono in corsia 4', { forte: true, rot: -1 }), m('Luca', 'il pane??????', { forte: true, rot: 1.5 }), m('Marta', 'ho scritto sopra 20 messaggi fa', { rot: -1 }), m('Giulia', 'non trovo niente nella chat', { rot: .8 }),
  ]) + `<div class="badge47">47 messaggi</div>` },
  { nome: 'frigolo-1', sfondo: 'menta', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">La stessa spesa, in Frigolo</div>` +
    `<div class="col2" style="top:200px"><h1 style="font-size:84px">${fmt('Il latte è *uno*, e c\'è scritto quale')}</h1><p class="t" style="margin-top:28px;font-size:40px">Tutti vedono la stessa lista, e la nota resta lì.</p></div>` +
    schermoCrop('h02-lista-lele.png', { left: 480, top: 150, width: 560, da: 0.05, a: 0.88 }) +
    mascotte('contenta', 'width:300px;left:80px;top:900px') + piede(5 - 0, tot, { destra: '4/6' }).replace('5/', '4/') },
  { nome: 'frigolo-2', sfondo: 'crema', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">E il pane?</div>` +
    `<div class="col2" style="top:200px;left:610px;width:390px"><h1 style="font-size:78px">${fmt('Nel *carrello*, in verde')}</h1><p class="t" style="margin-top:28px;font-size:40px">Chi lo prende lo tocca, e gli altri lo vedono subito.</p></div>` +
    schermoCrop('h04-carrello.png', { left: 40, top: 150, width: 540, da: 0.04, a: 0.88 }) + piede(5, tot) },
  { nome: 'chiusura', sfondo: 'inchiostro', extraCss: CSS, body:
    `<div class="macchia" style="width:900px;height:900px;right:-340px;bottom:-380px"></div>` +
    `<h1 style="top:190px;font-size:112px;text-align:center">${fmt('Una lista,|non *47* messaggi')}</h1>` +
    `<p class="t" style="top:520px;text-align:center;font-size:48px;color:var(--cream)">Mandalo al tuo gruppo.</p>` +
    mascotte('posta', 'width:400px;left:340px;top:740px') +
    `<div class="pill" style="left:50%;transform:translateX(-50%);top:1170px;background:var(--burnt);color:var(--cream);white-space:nowrap">Link nella bio</div>` + piede(6, tot, { destra: '' }) },
]

await pubblica({
  cartella: '2026-12-09-C7-carosello-gruppo-spesa-contro-frigolo', slides,
  quando: "Mercoledì 9 dicembre 2026 alle 12:30 (piano d'inverno, settimana 6). Carosello 6 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Versione a immagini del vecchio Reel R4. Chiedi nei commenti: \"Com'è la chat della tua spesa?\".",
  didascalia: `Il gruppo "Spesa" contro Frigolo 😅

"Hai preso il latte?" "Quale?" "Quello senza lattosio." "Ne ho preso due." "E il pane??" Poi 47 messaggi e nessuno trova niente.

La stessa spesa in Frigolo: una lista sola, con il latte scritto una volta (e quale), i prodotti nel carrello in verde e tutti che vedono la stessa cosa, in tempo reale. Fino a 5 persone, si entra con un link.

Mandalo al tuo gruppo della spesa e raccontami: com'è la tua chat? 👇

Link nella bio 💚

#frigolo #listadellaspesa #chatdigruppo #coinquilini #famiglia #spesa #humor #organizzazione`,
  alt: [
    'Una chat di gruppo disegnata, chiamata "Spesa": "prendi il latte?", "quale?", "quello senza lattosio". Sotto la scritta "Fin qui tutto bene...".',
    'La chat continua: "ne ho preso due", "perché due?", "era in offerta", "e il pane??". Sotto la scritta "Si complica...".',
    'La chat è caotica, con messaggi storti e maiuscoli, e un bollino "47 messaggi".',
    'La stessa spesa in Frigolo: la lista con il latte e la nota "Quello senza lattosio", accanto a Frigolo contento.',
    'Frigolo con tre prodotti nel carrello, segnati in verde: "Nel carrello, in verde".',
    '"Una lista, non 47 messaggi. Mandalo al tuo gruppo", con Frigolo che regge una lettera e la scritta Link nella bio.',
  ],
})
