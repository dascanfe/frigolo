// Rubrica del mese: C1 (novembre) e C6 (dicembre). Dati dalle Ispirazioni dell'app (mesi.ts) e dal catalogo (dati/catalogo.json, da catalogo-esporta.mjs).
//   node marketing/kit/scripts/caroselli-mese.mjs [C1|C6]
import { readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { root, schermoCrop, fmt, esc, tile, riga, ico, piede, mascotte, schermo, renderSlides, scrivi, DA_PUBBLICARE } from './caroselli-lib.mjs'

// Piatti, idee e ingredienti: direttamente dall'app (src/features/inspiration/mesi.ts, Node >= 23.6 toglie i tipi da solo)
const { MESI } = await import(pathToFileURL(path.join(root, 'src/features/inspiration/mesi.ts')).href)
const CATALOGO = JSON.parse(readFileSync(path.join(root, 'marketing/kit/scripts/dati/catalogo.json'), 'utf8'))

const CONF = {
  C1: {
    cartella: '2026-11-24-C1-carosello-novembre-nel-carrello', mese: 11, nome: 'novembre',
    titoli: ['Pasta e *fagioli*', 'Gnocchi al *gorgonzola* e noci', '*Verza* e salsiccia', 'Insalata di *melograno* e finocchi', 'Monte *Bianco*'],
    copertina: ['Fagioli borlotti', 'Gorgonzola', 'Verza', 'Melograno', 'Castagne', 'Noci'],
    frutta: null,
    verdura: ['Zucca', 'Verza', 'Cavolfiore', 'Cavolo nero', 'Cavolini di Bruxelles', 'Broccoli', 'Radicchio', 'Finocchi', 'Porri', 'Topinambur', 'Sedano rapa', 'Funghi porcini'],
    schermata: 'i04-ispirazioni-novembre-comesifa.png',
    layout: ['A', 'B', 'C', 'C', 'A'], sfondi: ['crema', 'menta', 'crema', 'menta', 'crema'],
  },
  C6: {
    cartella: '2026-12-01-C6-carosello-dicembre-nel-carrello', mese: 12, nome: 'dicembre',
    titoli: ['Tortellini in *brodo*', 'Baccalà in *umido*', 'Cotechino con *lenticchie*', 'Insalata di *rinforzo*', 'Tiramisù al *panettone*'],
    copertina: ['Tortellini', 'Baccalà', 'Cotechino', 'Cavolfiore', 'Panettone', 'Mascarpone'],
    frutta: null,
    verdura: ['Cavolfiore', 'Cavolo romanesco', 'Cavolo nero', 'Cavolini di Bruxelles', 'Radicchio', 'Finocchi', 'Porri', 'Zucca', 'Puntarelle', 'Cardi', 'Topinambur', 'Sedano rapa'],
    schermata: 'i05-ispirazioni-dicembre-comesifa.png',
    layout: ['C', 'A', 'A', 'C', 'A'], sfondi: ['menta', 'crema', 'menta', 'crema', 'menta'],
  },
}

function chip(nome) {
  return `<span class="chipP"><span class="ic">${ico(nome)}</span>${esc(nome)}</span>`
}
const CSS_MESE = `
.chipP { display:inline-flex; align-items:center; gap:14px; background:var(--cream); color:var(--ink); font-weight:700; font-size:33px; padding:11px 24px 11px 16px; border-radius:999px; margin:0 12px 14px 0 }
.chipP .ic svg { width:46px; height:46px; stroke-width:1.8; color:var(--brick); display:block }
.grid3 { position:absolute; left:80px; right:80px; display:grid; grid-template-columns:repeat(3,1fr); gap:34px }
.grid3 .tile { height:226px }
.fit .riga { padding:10px 0 }
.scontrino.fit .voce { padding:7px 0; font-size:40px }
.scontrino.fit { padding:26px 50px 44px }
.cop .tile { height:210px }
.nota { position:absolute; left:80px; right:80px; font-weight:700; font-size:38px; color:var(--soft) }
.col { position:absolute; left:80px; right:80px; bottom:130px; display:flex; flex-direction:column; gap:24px }
.col > h1, .col > p.t { position:static }
/* prodotti più piccoli e leggeri (richiesta di Daniele, 19 novembre) */
.riga { font-size:38px; font-weight:400; padding:14px 0 }
.fit .riga { padding:9px 0 }
.riga .ic svg { width:52px; height:52px }
.riga .spunta { width:38px; height:38px; border-width:3px }
.tile .nm { font-size:28px; font-weight:400 }
.tile .ic svg { width:72px; height:72px }
.scontrino .voce { font-size:38px; font-weight:400; padding:10px 0 }
.scontrino.fit .voce { font-size:34px; padding:6px 0 }
.chipP { font-size:28px; font-weight:400; gap:12px; padding:10px 22px 10px 14px }
.chipP .ic svg { width:40px; height:40px }
.fit2 .riga { padding:4px 0; font-size:35px }
.fit2 .riga .ic svg { width:44px; height:44px }
.fit2 .riga .spunta { width:32px; height:32px }
.grid3.s { gap:22px }
.grid3.s .tile { height:170px }
.grid3.s .tile .ic svg { width:58px; height:58px }
.num { position:absolute; right:80px; font-family:var(--font-display); font-style:italic; font-weight:700; font-size:150px; line-height:1; color:var(--acc); opacity:.9 }
`

function slides(c) {
  const mese = MESI[c.mese - 1]
  const tot = 8
  const out = []
  // 1 copertina
  out.push({ nome: 'copertina', sfondo: 'arancio', extraCss: CSS_MESE, body:
    `<div class="macchia" style="width:900px;height:900px;right:-300px;bottom:-330px"></div>` +
    `<div class="etichetta" style="top:92px;color:var(--cream)">La rubrica del mese</div>` +
    `<h1 style="top:150px;font-size:124px;text-align:center">${fmt('Cosa mettere|nel *carrello*|a ' + c.nome)}</h1>` +
    `<div class="grid3 cop" style="top:640px">${c.copertina.map((n) => tile(n)).join('')}</div>` +
    `<div class="nota" style="top:1160px;width:560px;color:var(--cream);line-height:1.25">Salvalo: ti serve alla prossima spesa.<br>Scorri ${'→'}</div>` +
    mascotte('contenta', 'width:290px;left:710px;top:1120px') })
  // 2-6 piatti
  mese.piatti.forEach((p, i) => {
    const L = c.layout[i]
    const sfondo = c.sfondi[i]
    let b = `<div class="etichetta" style="top:92px">Piatto ${i + 1} di 5</div>`
    b += `<div class="num" style="top:60px">${i + 1}</div>`
    if (L === 'A') b += `<div class="macchia" style="width:760px;height:760px;right:-260px;top:-300px"></div>`
    b += `<div class="col" style="top:160px"><h1 style="font-size:104px;margin-right:130px">${fmt(c.titoli[i])}</h1><p class="t">${esc(p.idea)}</p>`
    if (L === 'A') {
      b += `<div class="carta ${p.ingredienti.length > 5 ? 'fit' : ''} ${p.ingredienti.length > 7 ? 'fit2' : ''}" style="position:static;margin-top:16px"><div style="font-family:var(--font-display);font-style:italic;font-size:40px;color:var(--brick)">Da mettere in lista</div>${p.ingredienti.map((n) => riga(n)).join('')}</div>`
    } else if (L === 'B') {
      b += `<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:30px"><img class="mascotte" style="position:static;width:300px;margin-bottom:20px" src="../mascotte/frigolo-pensierosa.png" alt="">`
      b += `<div class="scontrino ${p.ingredienti.length > 4 ? 'fit' : ''}" style="position:static;width:560px;transform:rotate(2.5deg)"><div class="intest">La spesa</div>${p.ingredienti.map((n) => `<div class="voce"><span class="nm">${esc(n)}</span><span class="punti"></span><span>1</span></div>`).join('')}<div class="tot"><span>Piatto</span><span>${esc(p.nome.split(' ')[0])}</span></div></div></div>`
    } else {
      b += `<div class="grid3 ${p.ingredienti.length > 6 ? 's' : ''}" style="position:static;margin-top:26px">${p.ingredienti.map((n) => tile(n)).join('')}</div>`
    }
    b += `<div class="nota" style="position:static;font-size:32px;font-weight:400;margin-top:${L === 'C' ? 18 : 4}px">Il procedimento è nell'app: "Come si fa", per 2 persone.</div>`
    b += `</div>` + piede(i + 2, tot)
    out.push({ nome: 'piatto-' + (i + 1), sfondo, body: b, extraCss: CSS_MESE })
  })
  // 7 stagione
  const frutta = CATALOGO.filter((x) => x.cat === 'frutta' && x.mesi.includes(c.mese) && !['Litchi', 'Alchechengi'].includes(x.nome)).map((x) => x.nome)
  out.push({ nome: 'di-stagione', sfondo: 'inchiostro', extraCss: CSS_MESE, body:
    `<div class="etichetta" style="top:92px">Dal catalogo dell'app</div>` +
    `<div class="col" style="top:150px"><h1 style="font-size:96px">${fmt('Di stagione|a *' + c.nome + '*')}</h1>` +
    `<div style="margin-top:20px"><div class="etichetta" style="position:static;color:var(--peach);margin-bottom:18px">Frutta</div>${frutta.map(chip).join('')}</div>` +
    `<div><div class="etichetta" style="position:static;color:var(--peach);margin-bottom:18px">Verdura</div>${c.verdura.map(chip).join('')}</div></div>` +
    piede(7, tot) })
  // 8 app
  out.push({ nome: 'nellapp', sfondo: 'crema', extraCss: CSS_MESE, body:
    `<div class="macchia" style="width:900px;height:900px;left:-420px;bottom:-300px"></div>` +
    `<h1 style="top:110px;font-size:88px;text-align:left;right:600px">${fmt('Ogni mese, *nell\'app*')}</h1>` +
    `<p class="t" style="top:400px;right:600px;font-size:42px;color:var(--ink)">Un tocco e gli ingredienti sono in lista.</p>` +
    `<div class="pill" style="left:80px;top:700px;background:var(--brick);color:#fff">Link nella bio</div>` +
    mascotte('contenta', 'width:340px;left:80px;top:840px') +
    schermoCrop(c.schermata, { left: 510, top: 190, width: 520, da: 0.125, a: 0.97 }) +
    piede(8, tot, { destra: '' }) })
  return out
}

const TESTI = {
  C1: {
    quando: "Martedì 24 novembre 2026 alle 12:30 (piano d'inverno, settimana 4). Carosello 8 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Fatto per essere salvato.",
    didascalia: `Cosa mettere nel carrello a novembre 🛒

Cinque piatti di stagione, con gli ingredienti già pronti come lista della spesa: pasta e fagioli, gnocchi al gorgonzola e noci, verza e salsiccia, insalata di melograno e finocchi, Monte Bianco. In fondo, la frutta e la verdura di novembre.

Nell'app, in "Ispirazioni", ogni piatto ha anche "Come si fa": il procedimento passo passo, con le dosi per 2 persone. Un tocco e gli ingredienti sono in lista.

Salvalo per la prossima spesa. Quale piatto fai questa settimana? Scrivilo nei commenti 👇

Link nella bio 💚

#frigolo #listadellaspesa #novembre #distagione #cosadicucinare #cucinaitaliana #spesaintelligente #ricetteautunnali`,
    alt: [
      'Copertina arancione: "Cosa mettere nel carrello a novembre", con sei tessere di prodotti (fagioli borlotti, gorgonzola, verza, melograno, castagne, noci) e il frigorifero Frigolo contento.',
      'Pasta e fagioli: una lista della spesa con nove ingredienti (ditalini, fagioli borlotti, pancetta, passata di pomodoro, sedano, carote, cipolle, rosmarino, olio extravergine) e la riga "Il procedimento è nell\'app".',
      'Gnocchi al gorgonzola e noci: uno scontrino con gnocchi, gorgonzola, noci, latte fresco e burro, accanto a Frigolo pensieroso.',
      'Verza e salsiccia: sette tessere dei prodotti da comprare (verza, salsicce, patate, cipolle, vino bianco, salvia, olio extravergine).',
      'Insalata di melograno e finocchi: sei tessere dei prodotti da comprare (finocchi, melograno, arance, rucola, noci, olio extravergine).',
      'Monte Bianco: lista con castagne, latte fresco, zucchero, cacao amaro, panna da montare e zucchero a velo.',
      'Frutta e verdura di novembre dal catalogo dell\'app, in tante piccole etichette con la loro icona.',
      'La pagina Ispirazioni dell\'app con il piatto Pasta e fagioli e il procedimento "Come si fa" aperto, con le dosi per 2 persone; accanto la scritta "Ogni mese, nell\'app" e Frigolo contento.',
    ],
  },
  C6: {
    quando: "Martedì 1 dicembre 2026 alle 12:30 (piano d'inverno, settimana 5). Carosello 8 slide, formato 4:5: tocca l'icona del formato prima di Seleziona più. Fratello di C1: la rubrica del mese.",
    didascalia: `Cosa mettere nel carrello a dicembre 🎄

Cinque piatti delle feste, con gli ingredienti già pronti come lista della spesa: tortellini in brodo, baccalà in umido, cotechino con lenticchie, insalata di rinforzo, tiramisù al panettone. In fondo, la frutta e la verdura di dicembre.

Nell'app, in "Ispirazioni", ogni piatto ha anche "Come si fa": il procedimento passo passo, con le dosi per 2 persone. Un tocco e gli ingredienti sono in lista.

Salvalo per la spesa delle feste. Qual è il piatto che non può mancare a casa tua? Scrivilo nei commenti 👇

Link nella bio 💚

#frigolo #listadellaspesa #dicembre #natale #cenone #cucinaitaliana #spesaintelligente #ricettedinatale`,
    alt: [
      'Copertina arancione: "Cosa mettere nel carrello a dicembre", con sei tessere di prodotti (tortellini, baccalà, cotechino, cavolfiore, panettone, mascarpone) e il frigorifero Frigolo contento.',
      'Tortellini in brodo: sette tessere dei prodotti da comprare (tortellini, carne per brodo, gallina, carote, sedano, cipolle, Parmigiano Reggiano).',
      'Baccalà in umido: una lista della spesa con baccalà, polpa di pomodoro, cipolle, olive, capperi, farina 00, prezzemolo e olio extravergine.',
      'Cotechino con lenticchie: lista con nove ingredienti (cotechino, lenticchie, carote, sedano, cipolle, alloro, rosmarino, brodo vegetale, olio extravergine).',
      'Insalata di rinforzo: sette tessere dei prodotti da comprare (cavolfiore, giardiniera, olive, acciughe sott\'olio, capperi, aceto, olio extravergine).',
      'Tiramisù al panettone: lista con panettone, mascarpone, uova, zucchero, caffè macinato e cacao amaro.',
      'Frutta e verdura di dicembre dal catalogo dell\'app, in tante piccole etichette con la loro icona.',
      'La pagina Ispirazioni dell\'app con il piatto Tortellini in brodo e il procedimento "Come si fa" aperto, con le dosi per 2 persone; accanto la scritta "Ogni mese, nell\'app" e Frigolo contento.',
    ],
  },
}
const quali = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CONF)
for (const k of quali) {
  const c = CONF[k]
  const files = await renderSlides(c.cartella, slides(c))
  console.log(k, files.length)
  const t = TESTI[k]
  scrivi(c.cartella, 'didascalia.txt', t.didascalia)
  scrivi(c.cartella, 'quando.txt', t.quando)
  scrivi(c.cartella, 'testo-alternativo.txt', files.map((f, i) => `${f}: ${t.alt[i]}`).join('\n'))
  rmSync(path.join(DA_PUBBLICARE, c.cartella, 'DA-FARE.txt'), { force: true })
}
