// C4, carosello "Due mesi di Frigolo". I numeri veri stanno in numeri.json, nella cartella del contenuto.
//   Prova (segnaposto "[N]"):    node marketing/kit/scripts/caroselli-c4.mjs
//   Con i numeri veri: modifica numeri.json (persone, liste_condivise, spese_finite) nella cartella
//   1-da-pubblicare/2026-12-17-C4-carosello-due-mesi-di-frigolo/ e rilancia lo stesso comando.
//   Un numero sotto "soglia" (default 10) viene omesso: la slide sparisce e le altre si rinumerano.
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fmt, esc, piede, mascotte, pubblica, DA_PUBBLICARE } from './caroselli-lib.mjs'

const CARTELLA = '2026-12-17-C4-carosello-due-mesi-di-frigolo'
const DIR = path.join(DA_PUBBLICARE, CARTELLA)
const FILE = path.join(DIR, 'numeri.json')
const DEFAULT = {
  nota: 'Numeri del cruscotto per i due mesi (dal 18 ottobre). Sostituisci i "[N]" con i numeri veri, solo interi. Un numero sotto "soglia" viene omesso.',
  persone: '[N]',
  liste_condivise: '[N]',
  spese_finite: '[N]',
  soglia: 10,
  novita: ['Il catalogo quasi raddoppiato', 'Le Ispirazioni del mese', 'Gli ultimi acquisti, in un tocco', 'La lista in ordine di corsia'],
  novita_nota: 'Tieni solo le novità nate davvero dai messaggi che hai ricevuto (3-4 righe brevi).',
}
if (!existsSync(FILE)) { writeFileSync(FILE, JSON.stringify(DEFAULT, null, 2) + '\n') }
const N = { ...DEFAULT, ...JSON.parse(readFileSync(FILE, 'utf8')) }
const valido = (v) => (typeof v === 'string' && /^\[.*\]$/.test(v)) || (Number.isFinite(+v) && +v >= N.soglia)
const mostra = (v) => (typeof v === 'string' && /^\[.*\]$/.test(v) ? v : Number(v).toLocaleString('it-IT'))
const bozza = ['persone', 'liste_condivise', 'spese_finite'].some((k) => typeof N[k] === 'string' && /^\[.*\]$/.test(N[k]))

const CSS = `
.enorme { position:absolute; left:60px; right:60px; text-align:center; font-family:var(--font-display); font-style:italic; font-weight:700; font-size:380px; line-height:1; color:var(--acc) }
.stelle { position:absolute; color:var(--spark); line-height:1 }
.voce { display:flex; align-items:center; gap:28px; background:#fffaf2; border-radius:36px; padding:30px 40px; font-weight:700; font-size:46px; color:var(--ink); box-shadow:0 10px 0 rgba(58,44,33,.08) }
.voce i { flex:none; width:70px; height:70px; border-radius:50%; background:var(--sage); color:#fff; font-style:normal; font-weight:900; font-size:42px; display:flex; align-items:center; justify-content:center }
.bozza { position:absolute; right:80px; top:92px; padding:8px 22px; border-radius:999px; background:#fff3b0; color:#6b5200; font-weight:900; font-size:26px; letter-spacing:.06em }
`
const stelle = (...p) => p.map(([x, y, s = 54]) => `<span class="stelle" style="left:${x}px;top:${y}px;font-size:${s}px">✦</span>`).join('')
const bozzaTag = bozza ? '<div class="bozza">PROVA, NUMERI DA INSERIRE</div>' : ''
const tag = (s) => (s.nome === 'copertina' ? s : { ...s, body: s.body + bozzaTag })

const lista = []
const alt = []
lista.push({ nome: 'copertina', sfondo: 'crema', extraCss: CSS, body:
  `<div class="macchia" style="width:1000px;height:1000px;left:-300px;bottom:-420px"></div>` +
  `<div class="etichetta" style="top:92px">Dal 18 ottobre</div>` +
  `<h1 style="top:170px;font-size:140px;text-align:center">${fmt('Due mesi|di *Frigolo*')}</h1>` +
  `<p class="t" style="top:560px;text-align:center;font-size:46px">Cosa è successo, con i vostri numeri.<br>Scorri ${'→'}</p>` +
  mascotte('contenta', 'width:430px;left:325px;top:800px') + stelle([200, 800, 66], [830, 880, 52], [260, 1100, 44]) })
alt.push('Copertina: "Due mesi di Frigolo", dal 18 ottobre, con Frigolo contento.')
const grandi = [
  ['persone', 'menta', 'persone', 'hanno una lista su Frigolo', 'persone'],
  ['liste_condivise', 'crema', 'liste condivise', 'in cui ci si è messi d\'accordo con un link', 'liste condivise'],
  ['spese_finite', 'arancio', 'spese finite', 'chiuse con un tocco su "Spesa finita"', 'spese finite'],
]
for (const [k, sfondo, titolo, sotto, altn] of grandi) {
  if (!valido(N[k])) continue
  const i = lista.length
  lista.push({ nome: 'numero-' + k.replace('_', '-'), sfondo, extraCss: CSS, body:
    `<div class="etichetta" style="top:92px;${sfondo === 'arancio' ? 'color:var(--cream)' : ''}">In due mesi</div>` +
    `<div class="enorme" style="top:230px;${sfondo === 'arancio' ? 'color:var(--ink)' : ''}">${esc(mostra(N[k]))}</div>` +
    `<h1 style="top:700px;font-size:104px;text-align:center">${fmt('*' + titolo + '*')}</h1>` +
    `<p class="t" style="top:860px;text-align:center;font-size:46px;${sfondo === 'arancio' ? 'color:var(--cream)' : ''}">${esc(sotto)}</p>` +
    (sfondo === 'menta' ? mascotte('contenta', 'width:330px;left:375px;top:1000px') : '') +
    piede(i + 1, '?') })
  alt.push(`${mostra(N[k])} ${altn}: il numero in grande${sfondo === 'arancio' ? ' su fondo arancione' : ''}.`)
}
if (N.novita?.length) {
  lista.push({ nome: 'novita', sfondo: 'crema', extraCss: CSS, body:
    `<div class="etichetta" style="top:92px">In due mesi</div>` +
    `<h1 style="top:150px;font-size:104px">${fmt('Cosa è *cambiato*')}</h1>` +
    `<div style="position:absolute;left:80px;right:80px;top:480px;display:flex;flex-direction:column;gap:24px">${N.novita.slice(0, 4).map((x) => `<div class="voce"><i>✓</i>${esc(x)}</div>`).join('')}</div>` +
    piede(lista.length + 1, '?') })
  alt.push('Le novità nate dai messaggi: ' + N.novita.slice(0, 4).join(', ') + '.')
}
lista.push({ nome: 'auguri', sfondo: 'inchiostro', extraCss: CSS, body:
  `<div class="macchia" style="width:1000px;height:1000px;right:-360px;bottom:-420px"></div>` +
  `<h1 style="top:190px;font-size:128px;text-align:center">${fmt('Grazie, e *buone feste*')}</h1>` +
  `<p class="t" style="top:600px;text-align:center;font-size:46px;color:var(--cream)">Da Frigolo e da chi lo fa.<br>Il resto arriva nel nuovo anno.</p>` +
  mascotte('contenta', 'width:400px;left:340px;top:790px') + stelle([200, 740, 70], [840, 800, 56], [140, 1060, 46], [900, 1100, 62]) +
  `<div class="pill" style="left:50%;transform:translateX(-50%);top:1170px;background:var(--burnt);color:var(--cream);white-space:nowrap">Link nella bio</div>` })
alt.push('"Grazie, e buone feste", con Frigolo contento e delle stelline su fondo scuro.')

const tot = lista.length
// rinumera i piedi "?" e applica il tag prova
const slides = lista.map((s, i) => {
  const b = s.body.replace(/(\d+)\/\?/g, (_, n) => `${n}/${tot}`)
  return tag({ ...s, body: b })
})
// le slide cambiano di numero: ripulisci i vecchi PNG
for (const f of existsSync(DIR) ? readdirSync(DIR) : []) if (/^\d\d-.*\.png$/.test(f)) rmSync(path.join(DIR, f))

await pubblica({
  cartella: CARTELLA, slides, alt,
  quando: `Giovedì 17 dicembre 2026 alle 12:30 (piano d'inverno, settimana 7). Carosello ${tot} slide, formato 4:5: tocca l'icona del formato prima di Seleziona più.
${bozza ? 'ATTENZIONE: questa è la versione di PROVA con i segnaposto [N] e il bollino "PROVA". Non pubblicarla così.\n' : ''}
Come avere i numeri veri (li dà il PM dal cruscotto: persone, liste condivise, spese finite):
  1. Apri numeri.json in questa cartella e sostituisci i "[N]" con i numeri interi. Se un numero è sotto "soglia" (default 10) la slide sparisce da sola. Controlla anche le righe di "novita" e la frase in didascalia sulle novità nate dai messaggi.
  2. Dal repository, lancia:
       node marketing/kit/scripts/caroselli-c4.mjs
     Le immagini si rigenerano qui, senza il bollino PROVA.`,
  didascalia: `Due mesi di Frigolo 🎉

Dal 18 ottobre a oggi: grazie per ogni lista, ogni spesa finita e ogni messaggio. Dimmi cosa vuoi nella prossima versione.

Frigolo è un progetto fatto da una persona sola, e leggere come lo usate è la parte più bella. Buone feste e buona spesa, a tutti 💚

Link nella bio.

#frigolo #listadellaspesa #buonefeste #grazie #buildinpublic #opensource #appitaliane #community`,
})
