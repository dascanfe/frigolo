// C2, carosello "Il cenone si organizza in una lista" (condivisione). Schermate vere: marketing/screenshot/c2-*.png
//   (si rifanno con marketing/video/capture/schermate-inverno.mjs)    node marketing/kit/scripts/caroselli-c2.mjs
import { fmt, esc, piede, mascotte, schermoCrop, pubblica } from './caroselli-lib.mjs'

const CSS = `
.stelle { position:absolute; color:var(--spark); font-size:54px; line-height:1 }
.passo-n { position:absolute; left:80px; top:92px; display:flex; align-items:center; gap:22px; font-weight:900; font-size:30px; letter-spacing:.14em; text-transform:uppercase; color:var(--soft) }
.passo-n span { width:78px; height:78px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-size:50px; letter-spacing:0; display:flex; align-items:center; justify-content:center; padding-bottom:4px }
.inchiostro .passo-n span { background:var(--peach); color:var(--ink) }
.arancio .passo-n span { background:var(--ink); color:var(--cream) }
.persona { display:flex; align-items:center; gap:18px; font-size:34px; font-weight:700; margin-bottom:16px; color:var(--ink) }
.persona i { width:60px; height:60px; border-radius:50%; font-style:normal; color:#fff; font-weight:900; font-size:30px; display:flex; align-items:center; justify-content:center; flex:none }
.persona small { font-weight:400; display:block; font-size:30px; color:var(--ink-soft) }
.fumetto { background:#fffaf2; border-radius:36px; padding:24px 30px; box-shadow:0 8px 0 rgba(58,44,33,.08) }
.disegno { position:absolute; left:80px; right:80px; display:flex; flex-direction:column; gap:30px; align-items:flex-start }
.pillola { display:inline-flex; align-items:center; gap:18px; background:#fffaf2; border:3px solid #ead9c1; border-radius:999px; padding:22px 44px; font-family:var(--font-display); font-weight:700; font-size:78px; color:var(--ink); box-shadow:0 8px 0 rgba(58,44,33,.07) }
.pillola .v { font-size:56px; color:var(--brick) }
.bottone { display:inline-block; background:var(--brick); color:#fff; border-radius:999px; padding:28px 56px; font-weight:900; font-size:48px; box-shadow:0 14px 30px rgba(176,46,80,.3) }
.freccia { font-size:90px; color:var(--brick); line-height:1; padding-left:90px; font-weight:900 }
.col2 { position:absolute; width:370px }
.col2 h1, .col2 p.t { position:static }
`
const stelle = (...p) => p.map(([x, y, s = 54]) => `<span class="stelle" style="left:${x}px;top:${y}px;font-size:${s}px">✦</span>`).join('')
const tot = 7
const passo = (n, sfondo, titolo, testo, schermo, lato, extra = '') => {
  const leftText = lato === 'dx'
  const w = 540
  return { nome: 'passo-' + n, sfondo, extraCss: CSS, body:
    `<div class="passo-n"><span>${n}</span>passo ${n} di 5</div>` +
    `<div class="col2" style="top:230px;${leftText ? 'left:80px' : 'left:620px'}"><h1 style="font-size:${titolo.length > 22 ? 56 : 66}px">${fmt(titolo)}</h1><p class="t" style="font-size:38px;margin-top:26px">${esc(testo)}</p>${extra}</div>` +
    schermoCrop(schermo.file, { left: leftText ? 480 : 40, top: schermo.top ?? 170, width: w, da: schermo.da, a: schermo.a }) +
    stelle(...(schermo.stelle || [])) + piede(n + 1, tot, { destra: leftText ? '' : `${n + 1}/${tot}` }) }
}
const slides = [
  { nome: 'copertina', sfondo: 'arancio', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px;color:var(--cream)">Natale in due, tre, dieci</div>` +
    `<h1 style="top:150px;font-size:118px;text-align:left;right:120px">${fmt('Il *cenone* si organizza in una lista')}</h1>` +
    schermoCrop('c2-3-lista-cenone.png', { left: 90, top: 760, width: 520, da: 0.05, a: 0.82, rot: -3 }) +
    mascotte('contenta', 'width:340px;left:690px;top:960px') + stelle([720, 800, 70], [900, 700, 46], [960, 880, 40], [640, 1110, 42]) +
    `<div style="position:absolute;left:640px;top:770px;width:360px;font-weight:900;font-size:36px;color:var(--cream);line-height:1.25">5 passi.<br>Scorri ${'→'}</div>` },
  { nome: 'passo-1', sfondo: 'crema', extraCss: CSS, body:
    `<div class="passo-n"><span>1</span>passo 1 di 5</div>` +
    `<h1 style="top:210px;font-size:104px">${fmt('Crea una *seconda* lista')}</h1>` +
    `<p class="t" style="top:520px">Una per la casa di tutti i giorni, una per le feste. Ognuno ne ha due.</p>` +
    `<div class="disegno" style="top:740px"><div class="pillola">Casa <span class="v">⌄</span></div><div class="freccia">↓</div><div class="bottone">+ Nuova lista</div></div>` +
    mascotte('pensierosa', 'width:300px;left:700px;top:880px') + stelle([640, 760, 60], [980, 790, 44]) + piede(2, tot) },
  passo(2, 'menta', 'Chiamala *Cenone*', 'Il nome lo scegli tu: Natale, Capodanno, Pranzo dai nonni.', { file: 'c2-1-nuova-lista.png', da: 0.45, a: 0.95, top: 330, stelle: [[480, 250, 50], [60, 190, 40]] }, 'dx'),
  passo(3, 'crema', 'Manda il *link*', 'Un tocco su "Manda l\'invito" e chi lo riceve entra. Fino a 5 persone.', { file: 'c2-2-invito.png', da: 0.12, a: 0.75, top: 270, stelle: [[500, 190, 52]] }, 'sx'),
  passo(4, 'inchiostro', 'Ognuno aggiunge quello che *porta*', 'Ognuno dal suo telefono, e la lista si aggiorna per tutti.', { file: 'c2-3-lista-cenone.png', da: 0.04, a: 0.88, top: 200 }, 'dx',
    `<div style="margin-top:36px">${[['Lele', 'tortellini', '#c2902f'], ['Luca', 'baccalà', '#db6a2e'], ['Marta', 'panettone', '#7e7530']].map(([n, c, col]) => `<div class="persona" style="color:var(--cream)"><i style="background:${col}">${n[0]}</i><span>${n}<small style="color:var(--sand)">porta il ${c}</small></span></div>`).join('')}</div>`),
  passo(5, 'menta', 'Al supermercato si *segna*', 'Un tocco su quello che finisce nel carrello. Gli altri lo vedono subito.', { file: 'c2-4-carrello.png', da: 0.13, a: 0.88, top: 270, stelle: [[500, 190, 52]] }, 'sx'),
  { nome: 'chiusura', sfondo: 'arancio', extraCss: CSS, body:
    `<div class="macchia" style="width:900px;height:900px;left:-300px;bottom:-400px"></div>` +
    `<h1 style="top:190px;font-size:124px;text-align:center">${fmt('Una lista,|tutti a *bordo*')}</h1>` +
    `<p class="t" style="top:560px;text-align:center;font-size:46px;color:var(--cream)">Salva questo post per quando serve.<br>Mandalo a chi porta il dolce.</p>` +
    mascotte('posta', 'width:380px;left:350px;top:790px') + stelle([220, 700, 66], [820, 760, 52], [160, 1000, 44], [900, 1050, 60]) +
    `<div class="pill" style="left:50%;transform:translateX(-50%);top:1170px;background:var(--cream);color:var(--ink);white-space:nowrap">Link nella bio</div>` + piede(7, tot, { destra: '' }) },
]

await pubblica({
  cartella: '2026-12-03-C2-carosello-il-cenone-in-una-lista', slides,
  quando: "Giovedì 3 dicembre 2026 alle 12:30 (piano d'inverno, settimana 5). Carosello 7 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Prepara il terreno per il Reel R6.",
  didascalia: `Il cenone si organizza in una lista 🎄

Chi porta cosa? Chi compra il brodo? Chi si ricorda il ghiaccio? In 5 passi: crea una seconda lista, chiamala Cenone, manda il link, ognuno aggiunge quello che porta, al supermercato si segna quello che finisce nel carrello.

La lista è la stessa per tutti e si aggiorna in tempo reale, fino a 5 persone. E la tua lista di sempre resta dov'è: ognuno ha due liste.

Salvalo e mandalo a chi porta il dolce 🍰

Link nella bio 💚

#frigolo #cenone #natale #cenonedinatale #listadellaspesa #organizzazione #spesa #feste`,
  alt: [
    'Copertina arancione: "Il cenone si organizza in una lista", con la schermata della lista Cenone dell\'app e il frigorifero Frigolo contento.',
    'Passo 1: crea una seconda lista. Si tocca il nome della lista in alto, "Casa", e poi "Nuova lista".',
    'Passo 2: chiamala Cenone. La schermata di Frigolo con il nome della nuova lista scritto nel campo.',
    'Passo 3: manda il link. La sezione "Invita qualcuno" delle impostazioni, con il pulsante "Manda l\'invito" e il codice.',
    'Passo 4: ognuno aggiunge quello che porta. La lista Cenone con tre persone e i prodotti: tortellini, baccalà, panettone, mascarpone.',
    'Passo 5: al supermercato si segna. La lista con quattro prodotti nel carrello, segnati in verde.',
    '"Una lista, tutti a bordo" con Frigolo che regge una lettera, e la scritta Link nella bio.',
  ],
})
