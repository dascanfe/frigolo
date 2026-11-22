// C8, carosello "A Natale installala ai tuoi" (altro): passaggi iPhone e Android disegnati, stile delle storie "Installa".
//   node marketing/kit/scripts/caroselli-c8.mjs
import { fmt, esc, piede, mascotte, pubblica } from './caroselli-lib.mjs'

const CSS = `
.tre { position:absolute; left:50px; right:50px; display:flex; gap:30px; justify-content:center }
.passo { width:310px; display:flex; flex-direction:column; align-items:center; gap:26px }
.mt { position:relative; width:310px; height:700px; border:13px solid #2a1219; border-radius:54px; background:#faf3ec; overflow:hidden; box-shadow:0 22px 40px rgba(40,10,20,.25) }
.mt .notch { position:absolute; top:14px; left:50%; transform:translateX(-50%); width:90px; height:22px; border-radius:12px; background:#2a1219 }
.mt .url { position:absolute; left:18px; right:18px; top:56px; height:48px; border-radius:24px; background:#efe3d8; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:22px; color:#6b5844 }
.mt .corpo { position:absolute; left:0; right:0; top:190px; text-align:center }
.mt .corpo img { width:100px; height:100px; border-radius:50%; background:var(--mint) }
.mt .corpo b { display:block; font-family:var(--font-display); font-size:36px; margin:8px 0 14px; color:var(--ink) }
.mt .riga-g { height:12px; border-radius:6px; background:#e9d9d6; margin:8px auto }
.mt .btn { display:inline-block; margin-top:22px; background:var(--brick); color:#fff; font-weight:900; font-size:22px; padding:12px 28px; border-radius:30px }
.mt .barra { position:absolute; left:0; right:0; bottom:0; height:86px; background:#efe3d8; display:flex; align-items:center; justify-content:space-around; padding:0 10px }
.mt .barra svg { width:34px; height:34px; stroke:#6b5844; fill:none; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round }
.mt .evid { position:relative; width:78px; height:78px; border-radius:50%; background:rgba(176,46,80,.18); display:flex; align-items:center; justify-content:center; outline:5px solid var(--brick) }
.mt .evid svg { stroke:var(--brick) }
.mt .foglio { position:absolute; left:0; right:0; bottom:0; background:#fffaf2; border-radius:30px 30px 0 0; padding:20px 18px 26px; box-shadow:0 -10px 24px rgba(0,0,0,.14) }
.mt .foglio .r { display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:23px; color:var(--ink); padding:15px 14px; border-bottom:2px solid #eadfd4 }
.mt .foglio .r:last-child { border-bottom:0 }
.mt .foglio .r.sel, .mt .menu .r.sel { background:var(--brick); color:#fff; border-radius:18px; border-bottom:0 }
.mt .foglio .r svg { width:28px; height:28px; stroke:currentColor; fill:none; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round }
.mt .menu { position:absolute; right:14px; top:112px; width:240px; background:#fffaf2; border-radius:22px; box-shadow:0 10px 30px rgba(0,0,0,.22); padding:8px }
.mt .menu .r { font-weight:700; font-size:23px; color:var(--ink); padding:15px 16px }
.mt .puntini { position:absolute; right:14px; top:56px; width:48px; height:48px; border-radius:50%; background:rgba(176,46,80,.18); outline:4px solid var(--brick); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:30px; color:var(--brick) }
.mt .home { position:absolute; left:20px; right:20px; top:110px; display:grid; grid-template-columns:repeat(3,1fr); gap:30px 12px }
.mt .home .ap { display:flex; flex-direction:column; align-items:center; gap:8px; font-weight:700; font-size:18px; color:var(--ink-soft) }
.mt .home .ap i { width:72px; height:72px; border-radius:20px; background:#ecdfd2; display:block }
.mt .home .ap.nuova i { background:var(--mint) url(../../../public/mascot-avatar.webp) center/cover; outline:5px solid var(--brick) }
.mt .home .ap.nuova { color:var(--brick); font-weight:900 }
.cap { text-align:center; font-weight:900; font-size:36px; line-height:1.2; color:var(--ink) }
.cap em { font-family:var(--font-display); font-style:italic; color:var(--brick) }
.cap .n { display:inline-flex; width:46px; height:46px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-size:30px; align-items:center; justify-content:center; margin-right:10px; vertical-align:middle }
.avatars { position:absolute; left:80px; right:80px; display:flex; gap:26px; justify-content:center }
.av { width:150px; height:150px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:700; font-size:80px; color:#fff; box-shadow:0 10px 0 rgba(58,44,33,.12) }
.linkbox { position:absolute; left:120px; right:120px; background:#fffaf2; border-radius:999px; padding:30px 50px; display:flex; align-items:center; gap:24px; font-weight:900; font-size:44px; color:var(--brick); box-shadow:0 10px 0 rgba(58,44,33,.1) }
.linkbox svg { width:56px; height:56px; stroke:var(--brick); fill:none; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round }
`
const SH = '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>'
const BK = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>'
const FW = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
const BX = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>'
const PL = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>'
const corpo = (btn = true) => `<div class="corpo"><img src="../../../public/mascot-avatar.webp" alt=""><b>Frigolo</b><div class="riga-g" style="width:170px"></div><div class="riga-g" style="width:120px"></div>${btn ? '<span class="btn">Apri l\'app</span>' : ''}</div>`
const tel = (inner) => `<div class="mt"><div class="notch"></div>${inner}</div>`
const passo = (n, cap, tele) => `<div class="passo">${tele}<div class="cap"><span class="n">${n}</span>${fmt(cap)}</div></div>`

const ios = [
  passo(1, 'Apri il link con *Safari*', tel(`<div class="url">Safari</div>${corpo()}`)),
  passo(2, 'Tocca *Condividi*', tel(`${corpo()}<div class="barra">${BK}${FW}<div class="evid">${SH}</div>${BX}${BX}</div>`)),
  passo(3, 'Scegli *Aggiungi a Home*', tel(`${corpo(false)}<div class="foglio"><div class="r">Copia ${BX}</div><div class="r">Aggiungi ai preferiti ${BX}</div><div class="r sel">Aggiungi a Home ${PL}</div></div>`)),
]
const and = [
  passo(1, 'Apri il link con *Chrome*', tel(`<div class="url">Chrome</div>${corpo()}`)),
  passo(2, 'Dal menu, *Installa app*', tel(`<div class="url" style="right:80px">Chrome</div><div class="puntini">⋮</div>${corpo(false)}<div class="menu"><div class="r">Nuova scheda</div><div class="r">Condividi</div><div class="r sel">Installa app</div></div>`)),
  passo(3, 'Fatto: è nella tua *Home*', tel(`<div class="home">${'<div class="ap"><i></i></div>'.repeat(4)}<div class="ap nuova"><i></i>Frigolo</div>${'<div class="ap"><i></i></div>'.repeat(4)}</div>`)),
]
const tot = 5
const slides = [
  { nome: 'copertina', sfondo: 'arancio', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;right:-340px;bottom:-380px"></div>` +
    `<div class="etichetta" style="top:92px;color:var(--cream)">Per le feste</div>` +
    `<h1 style="top:150px;font-size:112px;text-align:left">${fmt('A Natale tornano tutti a casa:')}</h1>` +
    `<h1 style="top:520px;font-size:112px;text-align:left;color:var(--cream)">${fmt('installa *Frigolo* anche ai tuoi')}</h1>` +
    mascotte('contenta', 'width:420px;left:560px;top:930px') +
    `<div style="position:absolute;left:80px;top:1140px;width:440px;font-weight:900;font-size:38px;color:var(--cream);line-height:1.25">Si fa in 30 secondi.<br>Scorri ${'→'}</div>` },
  { nome: 'iphone', sfondo: 'menta', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">Passaggi per</div>` +
    `<h1 style="top:140px;font-size:128px">${fmt('iPhone')}</h1>` +
    `<div class="tre" style="top:360px">${ios.join('')}</div>` + piede(2, tot) },
  { nome: 'android', sfondo: 'crema', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">Passaggi per</div>` +
    `<h1 style="top:140px;font-size:128px">${fmt('*Android*')}</h1>` +
    `<div class="tre" style="top:360px">${and.join('')}</div>` + piede(3, tot) },
  { nome: 'link', sfondo: 'inchiostro', extraCss: CSS, body:
    `<div class="macchia" style="width:900px;height:900px;left:-300px;bottom:-400px"></div>` +
    `<h1 style="top:150px;font-size:112px;text-align:center">${fmt('Si invitano|con un *link*')}</h1>` +
    `<div class="avatars" style="top:560px">${[['N', '#c2902f'], ['Z', '#3e7c86'], ['M', '#a85641'], ['P', '#7e7530']].map(([l, c]) => `<div class="av" style="background:${c}">${l}</div>`).join('')}</div>` +
    `<div class="linkbox" style="top:800px"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>Manda l'invito</div>` +
    `<p class="t" style="top:1010px;text-align:center;font-size:44px;color:var(--cream)">Una lista in comune, fino a 5 persone.<br>Chi riceve il link entra e la vede.</p>` + piede(4, tot) },
  { nome: 'chiusura', sfondo: 'crema', extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;right:-360px;top:-360px"></div>` +
    `<h1 style="top:200px;font-size:112px;text-align:center">${fmt('Mandalo a chi torna *a casa*')}</h1>` +
    `<p class="t" style="top:640px;text-align:center;font-size:46px">Salva il post: a Natale ti serve.</p>` +
    mascotte('posta', 'width:400px;left:340px;top:790px') +
    `<div class="pill" style="left:50%;transform:translateX(-50%);top:1180px;background:var(--brick);color:#fff;white-space:nowrap">Link nella bio</div>` + piede(5, tot, { destra: '' }) },
]

await pubblica({
  cartella: '2026-12-15-C8-carosello-a-natale-installala-ai-tuoi', slides,
  quando: "Martedì 15 dicembre 2026 alle 12:30 (piano d'inverno, settimana 7). Carosello 5 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Fatto per essere salvato e inoltrato.",
  didascalia: `A Natale tornano tutti a casa. Installa Frigolo anche ai tuoi 🏠

Si fa dal browser, in 30 secondi, senza store. Su iPhone: apri il link con Safari, tocca Condividi, scegli "Aggiungi a Home". Su Android: apri il link con Chrome e dal menu scegli "Installa app".

E poi si invitano con un link: una lista in comune, fino a 5 persone. Chi lo riceve entra e vede la stessa lista.

Salvalo e mandalo a chi torna a casa per le feste 💚

Link nella bio.

#frigolo #natale #famiglia #listadellaspesa #installa #pwa #cenone #appitaliane`,
  alt: [
    'Copertina arancione: "A Natale tornano tutti a casa: installa Frigolo anche ai tuoi", con Frigolo contento.',
    'Tre passaggi per iPhone, disegnati: apri il link con Safari, tocca Condividi, scegli "Aggiungi a Home".',
    'Tre passaggi per Android, disegnati: apri il link con Chrome, dal menu scegli "Installa app", fatto: Frigolo è nella Home.',
    '"Si invitano con un link": quattro persone, il pulsante "Manda l\'invito" e il testo "Una lista in comune, fino a 5 persone".',
    '"Mandalo a chi torna a casa", con Frigolo che regge una lettera e la scritta Link nella bio.',
  ],
})
