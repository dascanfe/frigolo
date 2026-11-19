// ST5 e ST6: due storie ciascuna per la catena con lo sticker "Aggiungi il tuo".   node marketing/kit/scripts/caroselli-catene.mjs [ST5|ST6]
import { fmt, esc, ico, mascotte, pubblica } from './caroselli-lib.mjs'

const CSS = `
.passo { position:absolute; left:90px; right:90px; background:#fffaf2; border-radius:44px; padding:36px 44px; display:flex; align-items:center; gap:36px; box-shadow:0 12px 0 rgba(58,44,33,.08); color:var(--ink) }
.passo .n { flex:none; width:104px; height:104px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-weight:700; font-size:68px; display:flex; align-items:center; justify-content:center }
.passo .tx { font-size:48px; font-weight:700; line-height:1.18 }
.passo .tx small { display:block; font-size:36px; font-weight:400; color:var(--ink-soft); margin-top:6px }
.passo .ic svg { width:88px; height:88px; stroke-width:1.6; color:var(--brick) }
.passo .ic { flex:none; margin-left:auto }
.stella { position:absolute; color:var(--spark); font-size:60px }
`
const CONF = {
  ST5: {
    cartella: '2026-11-25-ST5-storie-aggiungi-il-tuo',
    s1: { sfondo: 'crema', titolo: 'Il prodotto che a|casa tua finisce|*sempre*', mascotte: 'pensierosa' },
    s2: { sfondo: 'menta', titolo: 'Come *partecipare*', passi: [
      ['Tocca "Aggiungi il tuo"', 'Lo trovi nella storia di @frigolo.app', 'Hand'],
      ['Fai una foto', 'Del tuo frigo o del prodotto che finisce sempre', 'Camera'],
      ['Menziona @frigolo.app', 'Le risposte più belle le ricondivido io', 'Refrigerator'],
    ] },
    quando: "Mercoledì 25 novembre 2026 alle 8:00 (piano d'inverno, settimana 4). Due storie una dopo l'altra: la prima lancia la catena con lo sticker, la seconda spiega come partecipare.",
    sticker: { testo: 'Il prodotto che a casa tua finisce SEMPRE', risposta: 'Il latte. Ovviamente 🥛', foto: 'una foto di un cartone di latte (o del frigo con il ripiano del latte vuoto)' },
    titoloIst: 'ST5 - Catena "Il prodotto che a casa tua finisce sempre"',
    alt: ['Il frigorifero Frigolo pensieroso sotto la scritta "Il prodotto che a casa tua finisce sempre". Al centro c\'è lo spazio per lo sticker Aggiungi il tuo.', 'Come partecipare, in 3 passi: tocca "Aggiungi il tuo", fai una foto del tuo frigo o del prodotto, menziona @frigolo.app.'],
  },
  ST6: {
    cartella: '2026-12-16-ST6-storie-aggiungi-il-tuo-feste',
    s1: { sfondo: 'arancio', titolo: 'Il piatto delle feste|che a casa tua|non può *mancare*', mascotte: 'contenta' },
    s2: { sfondo: 'crema', titolo: 'Come *partecipare*', passi: [
      ['Tocca "Aggiungi il tuo"', 'Lo trovi nella storia di @frigolo.app', 'Hand'],
      ['Fai una foto del piatto', 'Anche solo la tavola apparecchiata o la pentola', 'Camera'],
      ['Menziona @frigolo.app', 'Le tavole più belle le ricondivido io', 'PartyPopper'],
    ] },
    quando: "Mercoledì 16 dicembre 2026 alle 8:00 (piano d'inverno, settimana 6). Seconda catena con lo sticker \"Aggiungi il tuo\", stesso schema di ST5. Due storie una dopo l'altra.",
    sticker: { testo: 'Il piatto delle feste che a casa tua non può mancare', risposta: 'I tortellini in brodo 🥣', foto: 'una foto di una pentola di brodo con i tortellini (o di una tavola delle feste)' },
    titoloIst: 'ST6 - Catena "Il piatto delle feste che a casa tua non può mancare"',
    alt: ['Il frigorifero Frigolo contento su fondo arancione sotto la scritta "Il piatto delle feste che a casa tua non può mancare". Al centro c\'è lo spazio per lo sticker Aggiungi il tuo.', 'Come partecipare, in 3 passi: tocca "Aggiungi il tuo", fai una foto del piatto, menziona @frigolo.app.'],
  },
}

for (const k of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CONF)) {
  const c = CONF[k]
  const s1 = { nome: 'storia-catena', sfondo: c.s1.sfondo, extraCss: CSS, body:
    `<div class="macchia" style="width:1000px;height:1000px;left:-300px;bottom:-330px"></div>` +
    `<h1 style="top:300px;font-size:116px;text-align:center">${fmt(c.s1.titolo)}</h1>` +
    mascotte(c.s1.mascotte, 'width:360px;left:360px;top:1230px') }
  const passi = c.s2.passi.map(([t, sub, ic], i) =>
    `<div class="passo" style="top:${640 + i * 300}px"><span class="n">${i + 1}</span><span class="tx">${esc(t)}<small>${esc(sub)}</small></span><span class="ic">${ico('x', ic)}</span></div>`).join('')
  const s2 = { nome: 'storia-come-si-fa', sfondo: c.s2.sfondo, extraCss: CSS, body:
    `<div class="macchia" style="width:900px;height:900px;right:-300px;top:-200px"></div>` +
    `<h1 style="top:310px;font-size:120px;text-align:center">${fmt(c.s2.titolo)}</h1>` + passi +
    `<div style="position:absolute;left:90px;right:90px;top:1560px;text-align:center;font-weight:900;font-size:36px;letter-spacing:.04em;color:var(--soft)">@frigolo.app</div>` }
  await pubblica({
    cartella: c.cartella, formato: 'storia', slides: [s1, s2], quando: c.quando, alt: c.alt,
    istruzioni: `${c.titoloIst}
Pubblicale dal profilo di @frigolo.app, nell'ordine dei numeri, una subito dopo l'altra.
Fasce libere: 250 px in alto e 340 px in basso, niente testi importanti lì.

Storia 01 (01-storia-catena.png)
- Sticker "AGGIUNGI IL TUO" (si trova nel menu degli sticker, quello con l'icona della fotocamera), nello spazio libero al centro, tra il titolo e la mascotte.
  Testo esatto dello sticker: ${c.sticker.testo}
- Aggiungi tu per primo la risposta di esempio, con ${c.sticker.foto}.
  Risposta di esempio: ${c.sticker.risposta}
- Nessun link, nessuna promozione. Niente sticker menzione qui: serve nella storia 02.

Storia 02 (02-storia-come-si-fa.png)
- Sticker MENZIONE @frigolo.app, piccolo, nella fascia bassa sopra la zona di risposta (circa a 400 px dal fondo), sotto l'ultimo passo.
- Nessun link.

Dopo la pubblicazione
- @frigolo.app ricondivide nelle proprie storie le risposte più belle: controlla ogni giorno le risposte allo sticker e le menzioni, e ricondividi solo quelle di chi ha partecipato (chi ti menziona ti sta già dando il permesso di ricondividere).
- Rispondi a chi partecipa con un cuore o una frase breve, nel tono di Frigolo.
- Niente "gratis per sempre", niente premi o concorsi promessi.`,
  })
}
