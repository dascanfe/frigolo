// Libreria comune per caroselli (1080x1350) e storie (1080x1920): HTML in Node, Chrome headless, PNG con sharp.
// Le grafiche escono dal kit (Playfair Display, Lato, mascotte, palette Autunno), con layout diversi.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const run = promisify(execFile)
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const PAC =
  process.env.PACCHETTO ||
  path.join(os.homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Works/Frigolo published/pacchetto-instagram')
export const DA_PUBBLICARE = path.join(PAC, '1-da-pubblicare')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) throw new Error('Chrome non trovato: imposta CHROME')
const MODELLI = path.join(root, 'marketing/kit/modelli')
const ICONE = JSON.parse(readFileSync(path.join(root, 'marketing/kit/scripts/dati/icone.json'), 'utf8'))
const CATALOGO = JSON.parse(readFileSync(path.join(root, 'marketing/kit/scripts/dati/catalogo.json'), 'utf8'))
const PER_NOME = new Map(CATALOGO.map((p) => [p.nome.toLowerCase(), p]))

export const FORMATI = { carosello: [1080, 1350], storia: [1080, 1920] }

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
/** *corsivo* e | per andare a capo */
export const fmt = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\|/g, '<br>')

export function prodotto(nome) {
  return PER_NOME.get(nome.toLowerCase())
}
export function svgIcona(nomeIcona) {
  return ICONE[nomeIcona] || ICONE.ShoppingBasket
}
/** Icona di un prodotto del catalogo (per nome), oppure di un'icona data */
export function ico(nome, icona) {
  const p = prodotto(nome)
  if (!icona && !p) throw new Error('Prodotto non in catalogo: ' + nome)
  return svgIcona(icona || p.icona)
}
/** Tessera come nell'app: icona sopra, nome sotto */
export function tile(nome, { icona, cls = '' } = {}) {
  return `<div class="tile ${cls}"><span class="ic">${ico(nome, icona)}</span><span class="nm">${esc(nome)}</span></div>`
}
/** Riga di lista: icona, nome, cerchietto da spuntare */
export function riga(nome, { icona, fatto = false, extra = '' } = {}) {
  return `<div class="riga ${fatto ? 'fatto' : ''}"><span class="ic">${ico(nome, icona)}</span><span class="nm">${esc(nome)}</span>${extra}<span class="spunta"></span></div>`
}

export const CSS = `
body { background:#000; }
.canvas { position:relative; width:var(--w); height:var(--h); overflow:hidden; }
.canvas.crema { background:var(--bg); color:var(--ink); --acc:#ce5f36; --soft:var(--ink-soft); }
.canvas.menta { background:var(--mint); color:var(--mint-deep); --acc:#ce5f36; --soft:#1e5a52; }
.canvas.arancio { background:var(--burnt); color:var(--cream); --acc:var(--ink); --soft:var(--cream); }
.canvas.inchiostro { background:var(--ink); color:var(--cream); --acc:var(--peach); --soft:var(--sand); }
.macchia { position:absolute; border-radius:50%; }
.crema .macchia { background:var(--sand); opacity:.6 }
.menta .macchia { background:var(--cream); opacity:.45 }
.arancio .macchia { background:var(--cream); opacity:.16 }
.inchiostro .macchia { background:var(--cream); opacity:.07 }
h1,h2 { position:absolute; left:80px; right:80px; font-family:var(--font-display); font-weight:700; line-height:1.07; letter-spacing:-.01em; text-wrap:balance; }
h1 em,h2 em,.corsivo { color:var(--acc); font-style:italic; font-family:var(--font-display); font-weight:700 }
p.t { position:absolute; left:80px; right:80px; font-size:44px; line-height:1.32; color:var(--soft); font-weight:400; text-wrap:pretty }
.etichetta { position:absolute; left:80px; font-weight:900; font-size:30px; letter-spacing:.14em; text-transform:uppercase; color:var(--soft) }
.pill { position:absolute; display:inline-block; font-weight:900; font-size:32px; letter-spacing:.02em; padding:16px 34px; border-radius:999px; background:var(--cream); color:var(--ink) }
.mascotte { position:absolute; object-fit:contain }
.foot { position:absolute; left:80px; right:80px; bottom:46px; display:flex; align-items:center; justify-content:space-between; font-weight:900; font-size:30px; color:var(--soft) }
.foot .marchio { display:flex; align-items:center; gap:14px; font-family:var(--font-display); font-weight:700; font-size:34px; color:inherit }
.foot img { width:54px; height:54px; border-radius:50%; background:var(--mint) }
.tile { background:var(--cream); border:3px solid #ead9c1; border-radius:34px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:20px 12px; color:var(--ink); text-align:center; box-shadow:0 8px 0 rgba(58,44,33,.06) }
.tile .ic svg { width:84px; height:84px; stroke-width:1.7; display:block }
.tile .nm { font-weight:700; font-size:34px; line-height:1.12 }
.tile.sage { background:var(--sage); border-color:var(--sage); color:#fff }
.tile.brick { background:var(--brick); border-color:var(--brick); color:#fff }
.riga { display:flex; align-items:center; gap:26px; padding:18px 0; border-bottom:3px dashed rgba(58,44,33,.18); font-weight:700; font-size:50px; color:var(--ink) }
.riga:last-child { border-bottom:0 }
.riga .ic svg { width:64px; height:64px; stroke-width:1.8; display:block; color:var(--brick) }
.riga .nm { flex:1 }
.riga .spunta { width:46px; height:46px; border-radius:50%; border:4px solid var(--sage); flex:none }
.riga.fatto .nm { text-decoration:line-through; opacity:.55 }
.riga.fatto .spunta { background:var(--sage) }
.carta { position:absolute; background:#fffaf2; border-radius:30px; padding:30px 48px; box-shadow:0 22px 50px rgba(58,44,33,.16); color:var(--ink) }
.scontrino { position:absolute; background:#fffdf8; padding:34px 54px 54px; color:var(--ink); box-shadow:0 22px 50px rgba(58,44,33,.18); font-weight:700 }
.scontrino:after { content:''; position:absolute; left:0; right:0; bottom:-26px; height:26px; background:linear-gradient(135deg,#fffdf8 50%,transparent 50%) 0 0/36px 26px, linear-gradient(225deg,#fffdf8 50%,transparent 50%) 0 0/36px 26px }
.scontrino .intest { text-align:center; font-family:var(--font-display); font-size:46px; border-bottom:4px dashed rgba(58,44,33,.3); padding-bottom:22px; margin-bottom:12px }
.scontrino .voce { display:flex; align-items:baseline; gap:12px; font-size:46px; padding:13px 0 }
.scontrino .voce .nm { white-space:nowrap }
.scontrino .voce .punti { flex:1; border-bottom:4px dotted rgba(58,44,33,.35); transform:translateY(-8px) }
.scontrino .tot { border-top:4px dashed rgba(58,44,33,.3); margin-top:14px; padding-top:20px; display:flex; justify-content:space-between; font-size:38px; font-family:var(--font-display) }
.telefono { position:absolute; padding:14px; border-radius:66px; background:#2a1219; box-shadow:0 26px 60px rgba(40,10,20,.32) }
.telefono img { display:block; width:100%; height:100%; object-fit:cover; object-position:top; border-radius:52px }
.bolla { position:absolute; max-width:640px; padding:24px 34px; border-radius:38px; font-size:42px; font-weight:700; line-height:1.2; box-shadow:0 6px 0 rgba(58,44,33,.08) }
.bolla .chi { display:block; font-size:26px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; opacity:.75 }
.bolla.altri { background:#fffaf2; color:var(--ink); border-bottom-left-radius:10px }
.bolla.io { background:var(--mint); color:var(--mint-deep); border-bottom-right-radius:10px }
`

let contatore = 0
/** Crea un PNG da un corpo HTML. fmt: 'carosello' | 'storia' */
export async function renderHtml({ formato = 'carosello', sfondo = 'crema', body, dest, extraCss = '' }) {
  const [w, h] = FORMATI[formato]
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="kit.css"><style>:root{--w:${w}px;--h:${h}px}${CSS}${extraCss}</style></head><body><div class="canvas ${sfondo}">${body}</div></body></html>`
  mkdirSync(path.dirname(dest), { recursive: true })
  const id = `${process.pid}-${contatore++}-${Math.random().toString(36).slice(2, 6)}`
  const file = path.join(MODELLI, `.tmp-${id}.html`)
  const tmp = path.join(os.tmpdir(), `car-${id}.png`)
  writeFileSync(file, html)
  try {
    await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
      '--force-device-scale-factor=1', '--virtual-time-budget=4000', `--window-size=${w},${h + 160}`, `--screenshot=${tmp}`, 'file://' + file])
    const m = await sharp(tmp).metadata()
    let img = sharp(tmp)
    if (m.width !== w || m.height !== h) {
      if (m.width >= w && m.height >= h) img = img.extract({ left: 0, top: 0, width: w, height: h })
      else throw new Error(`${dest}: ${m.width}x${m.height}`)
    }
    await img.png({ compressionLevel: 9 }).toFile(dest)
  } finally {
    rmSync(file, { force: true })
    rmSync(tmp, { force: true })
  }
  console.log(path.relative(PAC, dest))
}

/** Piede della slide: marchio a sinistra, "n/N" o "Scorri" a destra */
export function piede(n, tot, { destra } = {}) {
  return `<div class="foot"><span class="marchio"><img src="../../../public/mascot-avatar.webp" alt="">Frigolo</span><span>${destra ?? `${n}/${tot}`}</span></div>`
}
export const mascotte = (nome, stile) => `<img class="mascotte" src="../mascotte/frigolo-${nome}.png" style="${stile}" alt="">`
export const schermo = (file, stile) =>
  `<div class="telefono" style="${stile}"><img src="../../screenshot/${file}" alt=""></div>`

/** Esegue i render di una lista di slide a gruppi di 3 */
export async function renderSlides(cartella, slides, { formato = 'carosello', prefisso = '' } = {}) {
  const dir = path.join(DA_PUBBLICARE, cartella)
  const jobs = slides.map((s, i) => ({
    ...s, formato, dest: path.join(dir, `${String(i + 1).padStart(2, '0')}-${s.nome}.png`),
  }))
  for (let i = 0; i < jobs.length; i += 3) await Promise.all(jobs.slice(i, i + 3).map(renderHtml))
  return jobs.map((j) => path.basename(j.dest))
}
export function scrivi(cartella, nomeFile, testo) {
  const f = path.join(DA_PUBBLICARE, cartella, nomeFile)
  mkdirSync(path.dirname(f), { recursive: true })
  writeFileSync(f, testo.endsWith('\n') ? testo : testo + '\n')
}
export function slugCartella(prefix) {
  const { readdirSync } = require_fs()
  return readdirSync(DA_PUBBLICARE).find((d) => d.includes(`-${prefix}-`))
}
import * as fsAll from 'node:fs'
const require_fs = () => fsAll

/** Rende le slide e scrive i testi di una cartella (quando, didascalia, alt, istruzioni). */
export async function pubblica({ cartella, slides, formato = 'carosello', quando, didascalia, alt, istruzioni, extra = {} }) {
  const files = await renderSlides(cartella, slides, { formato })
  scrivi(cartella, 'quando.txt', quando)
  if (didascalia) scrivi(cartella, 'didascalia.txt', didascalia)
  if (alt) scrivi(cartella, 'testo-alternativo.txt', files.map((f, i) => `${f}: ${alt[i]}`).join('\n'))
  if (istruzioni) scrivi(cartella, 'istruzioni.txt', istruzioni)
  for (const [nome, testo] of Object.entries(extra)) scrivi(cartella, nome, testo)
  fsAll.rmSync(path.join(DA_PUBBLICARE, cartella, 'DA-FARE.txt'), { force: true })
  console.log(cartella, files.length, 'immagini')
  return files
}

const RAPPORTO = 2532 / 1170
/** Telefono con una porzione di schermata (da/a = frazioni dell'altezza) */
export function schermoCrop(file, { left = 'auto', right = 'auto', top, width, da = 0, a = 1, extra = '', rot = 0 }) {
  const w = width - 28
  const imgH = w * RAPPORTO
  const boxH = (a - da) * imgH
  return `<div class="telefono" style="left:${left}px;top:${top}px;width:${width}px;${rot ? `transform:rotate(${rot}deg);` : ''}${extra}"><div style="width:${w}px;height:${boxH}px;overflow:hidden;border-radius:52px"><img style="width:${w}px;height:${imgH}px;margin-top:${-da * imgH}px;object-fit:fill;border-radius:0" src="../../screenshot/${file}" alt=""></div></div>`
}
