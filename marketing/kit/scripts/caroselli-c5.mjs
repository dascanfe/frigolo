// C5, carosello "Che compagno di spesa sei?" (condivisione).   node marketing/kit/scripts/caroselli-c5.mjs
import { fmt, esc, ico, tile, piede, mascotte, pubblica } from './caroselli-lib.mjs'

const CSS = `
.col { position:absolute; left:80px; right:80px; top:150px; bottom:130px; display:flex; flex-direction:column; gap:26px }
.col > h1 { position:static; font-size:112px }
.col > p.t { position:static }
.num { position:absolute; right:80px; top:70px; font-family:var(--font-display); font-style:italic; font-weight:700; font-size:80px; line-height:1; color:var(--acc); opacity:.9 }
.cita { font-family:var(--font-display); font-style:italic; font-weight:700; font-size:50px; line-height:1.15; color:var(--soft) }
.scena { position:relative; flex:1; padding-top:24px; display:flex; align-items:center; justify-content:center; gap:30px }
.cerchio { width:270px; height:270px; border-radius:50%; background:#fffaf2; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 0 rgba(58,44,33,.07) }
.cerchio svg { width:150px; height:150px; stroke-width:1.6; color:var(--brick) }
.striscia { background:var(--cream); color:var(--ink); border-radius:34px; padding:30px 40px; font-size:40px; line-height:1.3; font-weight:400; box-shadow:0 10px 0 rgba(58,44,33,.08) }
.striscia b { display:block; font-family:var(--font-display); font-style:italic; font-weight:700; font-size:44px; color:var(--brick); margin-bottom:6px }
.nota { background:#fffaf2; color:var(--ink); border-radius:12px; padding:34px 44px; font-family:var(--font-display); font-style:italic; font-size:76px; transform:rotate(-3deg); box-shadow:0 14px 34px rgba(58,44,33,.16); line-height:1.1 }
.nota small { display:block; font-family:var(--font-body); font-style:normal; font-size:34px; font-weight:700; color:var(--ink-soft) }
.sc { background:#fffdf8; color:var(--ink); font-weight:700; padding:34px 48px 40px; width:560px; transform:rotate(2deg); box-shadow:0 14px 34px rgba(58,44,33,.16) }
.sc .r { display:flex; justify-content:space-between; font-size:42px; padding:8px 0 }
.sc .tt { display:flex; justify-content:space-between; font-family:var(--font-display); font-size:60px; border-top:4px dashed rgba(58,44,33,.3); margin-top:14px; padding-top:16px }
.offerta { background:var(--brick); color:#fff; border-radius:50%; width:230px; height:230px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:700; font-size:92px; line-height:.9; transform:rotate(-10deg) }
.offerta small { font-family:var(--font-body); font-size:34px; font-weight:900; letter-spacing:.08em }
.mini { display:flex; flex-direction:column; gap:12px }
.vuoto { width:190px; height:170px; border-radius:34px; border:5px dashed rgba(58,44,33,.4); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:60px; color:var(--brick); font-style:italic }
`

const sc = (inner) => `<div class="scena">${inner}</div>`
const cerchio = (n, icona) => `<div class="cerchio">${ico(n, icona)}</div>`
const tipi = [
  { nome: 'Il *doppione*', cita: '"Ma ne avevamo già uno?"', sfondo: 'crema',
    scena: sc(cerchio('Latte fresco') + `<div style="font-family:var(--font-display);font-size:120px;color:var(--brick)">+</div>` + cerchio('Latte fresco')),
    frigolo: 'Il latte è in lista una volta sola e lo spunta chi lo prende: l\'altro lo vede subito.' },
  { nome: 'Quello di *"roba"*', cita: 'In lista scrive: roba.', sfondo: 'menta',
    scena: sc(`<div class="nota">roba<small>(quale? boh)</small></div>`),
    frigolo: 'Si sceglie dal catalogo di quasi 500 prodotti: ognuno ha il suo nome e la sua icona.' },
  { nome: 'Senza *lista*', cita: '"Faccio a memoria, tranquillo."', sfondo: 'crema',
    scena: sc(`<div class="mini" style="flex-direction:row;gap:22px">${tile('Latte fresco', {}).replace('class="tile ', 'style="width:150px;height:170px" class="tile ')}${tile('Uova').replace('class="tile ', 'style="width:150px;height:170px" class="tile ')}${tile('Pomodori', {}).replace('class="tile ', 'style="width:150px;height:170px" class="tile ')}<div class="vuoto">pane?</div></div>`),
    frigolo: 'La lista è già nel telefono, anche senza rete. E il pane lo vedi prima di uscire.' },
  { nome: 'Il *"già che ci sei"*', cita: '"Già che ci sei, prendi anche..."', sfondo: 'arancio',
    scena: sc(`<div style="display:flex;gap:26px;align-items:center">${cerchio('Pane')}${cerchio('Mele')}${cerchio('Uova')}</div>`),
    frigolo: 'Lo aggiunge dal suo telefono e tu lo vedi comparire in lista, mentre sei già in giro.' },
  { nome: 'Quello del *volantino*', cita: '"Era in offerta!"', sfondo: 'crema',
    scena: sc(`<div class="offerta">3x2<small>OFFERTA</small></div><div style="display:flex;flex-direction:column;gap:8px;align-items:center"><div style="display:flex;gap:10px">${cerchio('Yogurt bianco').replace('width:210', '')}</div></div>`),
    frigolo: 'Accanto al prodotto metti la quantità: ne servono 2, non 6.' },
  { nome: 'Entra per il latte, esce con *40 euro*', cita: '"Passavo solo a prendere il latte."', sfondo: 'menta',
    scena: sc(`<div class="sc"><div class="r"><span>Latte</span><span>1,40</span></div><div class="r"><span>Biscotti (3x2)</span><span>6,90</span></div><div class="r"><span>Pizza surgelata</span><span>4,50</span></div><div class="r"><span>Cose varie</span><span>27,20</span></div><div class="tt"><span>Totale</span><span>40,00</span></div></div>`),
    frigolo: 'Hai la lista davanti e tocchi quello che finisce nel carrello. Il resto resta in lista per la prossima volta.' },
  { nome: 'Il *cartografo*', cita: '"Prima la verdura, poi il pane, poi i surgelati."', sfondo: 'crema',
    scena: sc(`<div style="display:flex;gap:18px;align-items:center">${['Mele','Pane','Latte fresco','Piselli surgelati'].map((n, i) => `<div style="display:flex;align-items:center;gap:18px">${tile(n).replace('class="tile ', 'style="width:150px;height:170px" class="tile ')}${i < 3 ? '<span style="font-size:60px;color:var(--brick);font-weight:900">›</span>' : ''}</div>`).join('')}</div>`.replace(/width:150px;height:170px/g, 'width:150px;height:170px')),
    frigolo: 'La lista segue l\'ordine di corsia del tuo supermercato, così non torni mai indietro.' },
]

const tot = 9
const slides = []
slides.push({ nome: 'copertina', sfondo: 'menta', extraCss: CSS, body:
  `<div class="macchia" style="width:980px;height:980px;left:-260px;bottom:-420px"></div>` +
  `<div class="etichetta" style="top:92px">Quiz da supermercato</div>` +
  `<h1 style="top:170px;font-size:134px;text-align:left">${fmt('Che compagno|di spesa *sei*?')}</h1>` +
  `<p class="t" style="top:520px;right:300px;font-size:46px">7 tipi, tutti affettuosi.<br>Scorri e scopri il tuo.</p>` +
  `<div style="position:absolute;left:80px;right:80px;top:760px;display:flex;gap:26px">${['Latte fresco', 'Pane', 'Uova'].map((n) => tile(n).replace('class="tile ', 'style="flex:1;height:230px" class="tile ')).join('')}</div>` +
  mascotte('contenta', 'width:360px;left:640px;top:1010px') + piede(1, tot, { destra: '' }) })
tipi.forEach((t, i) => {
  slides.push({ nome: 'tipo-' + (i + 1), sfondo: t.sfondo, extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">Compagno di spesa</div><div class="num">${i + 1}/7</div>` +
    `<div class="col"><h1 style="font-size:${t.nome.length > 28 ? 100 : 118}px">${fmt(t.nome)}</h1><div class="cita">${esc(t.cita)}</div>${t.scena}` +
    `<div class="striscia"><b>Con Frigolo:</b>${esc(t.frigolo)}</div></div>` + piede(i + 2, tot) })
})
slides.push({ nome: 'tagga', sfondo: 'crema', extraCss: CSS, body:
  `<div class="macchia" style="width:900px;height:900px;right:-300px;bottom:-300px"></div>` +
  `<h1 style="top:170px;font-size:122px;text-align:center">${fmt('Tagga il tuo|*compagno*|di spesa')}</h1>` +
  `<p class="t" style="top:640px;text-align:center;font-size:46px">E scrivi nei commenti quale dei 7 è.<br>Una lista in due si fa meglio.</p>` +
  mascotte('posta', 'width:400px;left:340px;top:790px') +
  `<div class="pill" style="left:50%;transform:translateX(-50%);top:1170px;background:var(--brick);color:#fff;white-space:nowrap">Link nella bio</div>` + piede(9, tot, { destra: '' }) })

await pubblica({
  cartella: '2026-11-26-C5-carosello-compagni-di-spesa', slides,
  quando: "Martedì 24 novembre 2026 alle 12:30 (piano d'inverno, settimana 4). Carosello 9 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Fatto per essere condiviso e commentato: rispondi ai commenti con il tipo di compagno.",
  didascalia: `Che compagno di spesa sei? 🛒

Il doppione, quello di "roba", quello senza lista, il "già che ci sei", il volantino, il "passavo solo per il latte", il cartografo. Sette tipi, tutti affettuosi. Ognuno ha la sua soluzione in Frigolo.

Tagga il tuo compagno di spesa e scrivi nei commenti quale dei sette è 👇

Link nella bio 💚

#frigolo #listadellaspesa #spesa #coinquilini #vitadicoppia #famiglia #supermercato #humor`,
  alt: [
    'Copertina menta: "Che compagno di spesa sei?", con tre tessere (latte, pane, uova) e il frigorifero Frigolo contento.',
    'Il doppione: due cartoni di latte, "Ma ne avevamo già uno?". Con Frigolo il latte è in lista una volta sola.',
    'Quello di "roba": un biglietto con scritto soltanto "roba". Con Frigolo si sceglie dal catalogo di quasi 500 prodotti.',
    'Senza lista: tessere di latte, uova e pomodori e un riquadro vuoto con "pane?". Con Frigolo la lista è nel telefono, anche senza rete.',
    'Il "già che ci sei": pane, mele e uova su fondo arancione. Con Frigolo il compagno aggiunge dal suo telefono e tu lo vedi comparire.',
    'Quello del volantino: un bollino "3x2 OFFERTA" e uno yogurt. Con Frigolo metti la quantità accanto al prodotto.',
    'Entra per il latte, esce con 40 euro: uno scontrino da 40,00 euro. Con Frigolo il resto resta in lista per la prossima volta.',
    'Il cartografo: quattro tessere in fila (mele, pane, latte, piselli surgelati). Con Frigolo la lista segue l\'ordine di corsia del supermercato.',
    '"Tagga il tuo compagno di spesa" con Frigolo che regge una busta e la scritta Link nella bio.',
  ],
})
