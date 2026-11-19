// C3, carosello "Le 7 cose che si dimenticano a Natale" (acquisto).   node marketing/kit/scripts/caroselli-c3.mjs
import { fmt, esc, ico, riga, piede, mascotte, pubblica } from './caroselli-lib.mjs'

const CSS = `
.numero { position:absolute; font-family:var(--font-display); font-style:italic; font-weight:700; font-size:560px; line-height:.8; color:var(--acc); opacity:.22 }
.grande { position:absolute; width:380px; height:380px; border-radius:64px; background:#fffaf2; border:4px solid #ead9c1; display:flex; align-items:center; justify-content:center; box-shadow:0 16px 0 rgba(58,44,33,.08) }
.grande svg { width:220px; height:220px; stroke-width:1.5; color:var(--brick) }
.mini { position:absolute; left:80px; right:80px; background:#fffaf2; border-radius:36px; padding:6px 44px; box-shadow:0 10px 0 rgba(58,44,33,.08); color:var(--ink) }
.mini .riga { border-bottom:0; padding:24px 0 }
.mini .eti { font-family:var(--font-display); font-style:italic; font-size:36px; color:var(--brick); padding-top:22px }
.cerchi { position:absolute; left:80px; right:80px; display:flex; flex-wrap:wrap; gap:28px; justify-content:center }
.cerchi .c { width:200px; height:200px; border-radius:50%; background:#fffaf2; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 0 rgba(58,44,33,.08) }
.cerchi .c svg { width:110px; height:110px; stroke-width:1.6; color:var(--brick) }
.carta .riga { padding:12px 0; font-size:42px }
.stelle { position:absolute; color:var(--spark); line-height:1 }
`
const COSE = [
  { n: 'Il brodo', p: 'per i tortellini', nome: 'Dado da brodo', titolo: 'Il *brodo* per i tortellini', testo: 'Il piatto delle feste non si fa con l\'acqua.', sfondo: 'crema' },
  { n: 'Il ghiaccio', nome: 'Ghiaccio', titolo: 'Il *ghiaccio*', testo: 'Te ne ricordi quando le bibite sono già calde.', sfondo: 'menta' },
  { n: 'I tovaglioli', nome: 'Tovaglioli', titolo: 'I *tovaglioli*', testo: 'Quelli belli, non quelli del compleanno dell\'anno scorso.', sfondo: 'crema' },
  { n: 'Il lievito', nome: 'Lievito per dolci', titolo: 'Il *lievito*', testo: 'Non c\'è mai, proprio il giorno che serve.', sfondo: 'menta' },
  { n: 'La panna', nome: 'Panna da cucina', titolo: 'La *panna*', testo: 'Una confezione in più, che qualcuno la usa sempre.', sfondo: 'crema' },
  { n: 'Le candeline', nome: 'Candeline', titolo: 'Le *candeline*', testo: 'Per la torta o per la tavola: una scatola basta.', sfondo: 'inchiostro' },
  { n: 'Il caricabatterie', nome: 'Caricabatterie', icona: 'Plug', titolo: 'Il *caricabatterie*', testo: 'Per il telefono di zia. Non è nel catalogo, ma lo crei tu: ha anche l\'icona.', sfondo: 'menta', crea: true },
]
const tot = 9
const slides = []
slides.push({ nome: 'copertina', sfondo: 'arancio', extraCss: CSS, body:
  `<div class="macchia" style="width:900px;height:900px;left:-300px;bottom:-400px"></div>` +
  `<div class="etichetta" style="top:92px;color:var(--cream)">Da commentare</div>` +
  `<h1 style="top:150px;font-size:124px;text-align:center">${fmt('Le *7 cose*|che si dimenticano|a Natale')}</h1>` +
  `<div class="cerchi" style="top:700px;gap:24px">${COSE.map((c) => `<div class="c" style="width:190px;height:190px">${ico(c.nome, c.icona)}</div>`).join('')}<div class="c" style="width:190px;height:190px;background:transparent;box-shadow:none;border:5px dashed rgba(250,243,236,.7);color:var(--cream);font-family:var(--font-display);font-size:64px;font-style:italic;white-space:nowrap">e tu?</div></div>` +
  `<div style="position:absolute;left:80px;right:80px;top:1190px;font-weight:900;font-size:38px;color:var(--cream);text-align:center">Quante ne hai dimenticate l'anno scorso? ${'→'}</div>` })
COSE.forEach((c, i) => {
  const flip = i % 2 === 1
  const ink = c.sfondo === 'inchiostro'
  slides.push({ nome: 'cosa-' + (i + 1), sfondo: c.sfondo, extraCss: CSS, body:
    `<div class="numero" style="${flip ? 'left:40px' : 'right:40px'};top:20px">${i + 1}</div>` +
    `<div class="grande" style="${flip ? 'right:90px' : 'left:90px'};top:210px;${ink ? 'background:#4a3a2d;border-color:#5b493a' : ''}">${ico(c.nome, c.icona)}</div>` +
    (ink ? `<span class="stelle" style="right:140px;top:190px;font-size:90px">✦</span><span class="stelle" style="left:140px;top:440px;font-size:50px">✦</span>` : '') +
    `<h1 style="top:660px;font-size:${c.titolo.length > 20 ? 96 : 118}px;${flip ? 'text-align:right' : ''}">${fmt(c.titolo)}</h1>` +
    `<p class="t" style="top:${c.titolo.length > 20 ? 900 : 830}px;${flip ? 'text-align:right;' : ''}font-size:44px;${ink ? 'color:var(--cream)' : ''}">${esc(c.testo)}</p>` +
    `<div class="mini" style="top:1120px"><div class="riga" style="color:var(--ink)"><span class="ic">${ico(c.nome, c.icona)}</span><span class="nm">${esc(c.nome)}</span><span class="spunta"></span></div></div>` +
    piede(i + 2, tot) })
})
slides.push({ nome: 'in-lista', sfondo: 'crema', extraCss: CSS, body:
  `<div class="macchia" style="width:900px;height:900px;right:-300px;top:-300px"></div>` +
  `<h1 style="top:130px;font-size:112px;text-align:left;right:260px">${fmt('Mettile in lista *adesso*')}</h1>` +
  `<div class="carta" style="left:80px;right:300px;top:440px;padding:20px 36px"><div style="font-family:var(--font-display);font-style:italic;font-size:36px;color:var(--brick)">Cenone</div>${COSE.map((c) => riga(c.nome, { icona: c.icona })).join('')}</div>` +
  mascotte('pensierosa', 'width:320px;left:740px;top:600px') +
  `<div style="position:absolute;left:80px;right:80px;top:1190px;font-weight:900;font-size:36px;color:var(--ink-soft)">Tu cosa dimentichi sempre? Scrivilo nei commenti.</div>` +
  piede(9, tot, { destra: 'Link nella bio' }) })

await pubblica({
  cartella: '2026-12-10-C3-carosello-7-cose-che-si-dimenticano-a-natale', slides,
  quando: "Giovedì 10 dicembre 2026 alle 12:30 (piano d'inverno, settimana 6). Carosello 9 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Il carosello da commentare: rispondi ai commenti, la domanda è in didascalia.",
  didascalia: `Le 7 cose che si dimenticano a Natale 🎄

Il brodo per i tortellini, il ghiaccio, i tovaglioli, il lievito, la panna, le candeline e il caricabatterie (questo è ironico, ma succede).

Mettile in lista adesso, prima di essere al supermercato con il carrello pieno e la sensazione che manchi qualcosa. Salva il post per la spesa delle feste.

Tu cosa dimentichi sempre? Scrivilo nei commenti 👇

Link nella bio 💚

#frigolo #natale #cenone #listadellaspesa #cosedacomprare #spesa #feste #organizzazione`,
  alt: [
    'Copertina arancione: "Le 7 cose che si dimenticano a Natale", con sette icone dei prodotti e un cerchio tratteggiato con la scritta "e tu?".',
    'Cosa numero 1: il brodo per i tortellini. L\'icona del dado da brodo e il prodotto in lista.',
    'Cosa numero 2: il ghiaccio, con l\'icona di un fiocco di neve.',
    'Cosa numero 3: i tovaglioli.',
    'Cosa numero 4: il lievito.',
    'Cosa numero 5: la panna.',
    'Cosa numero 6: le candeline, su fondo scuro con due stelline.',
    'Cosa numero 7: il caricabatterie, un prodotto che non è nel catalogo ma si può creare.',
    '"Mettile in lista adesso": la lista Cenone con tutte e sette le cose, e Frigolo pensieroso.',
  ],
})
