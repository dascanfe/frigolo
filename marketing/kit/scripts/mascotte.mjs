// Espressioni della mascotte Frigolo, ricavate dall'illustrazione originale
// (assets/mascot.webp, 1254x1254) coprendo occhi e bocca con il colore del corpo
// e ridisegnando i tratti in SVG con gli stessi colori e lo stesso spessore.
//
// Uso: node marketing/kit/scripts/mascotte.mjs
// Output: marketing/kit/mascotte/frigolo-<espressione>.png (1254) e .webp (512)
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SRC = path.join(root, 'assets/mascot.webp')
const OUT = path.join(root, 'marketing/kit/mascotte')
const S = 1254

// Colori campionati dall'illustrazione
const INK = '#04342f' // contorni
const BODY = '#9de0d1' // corpo verde acqua
const TONGUE = '#f9867d'
const SPARK = '#f7a017' // lineette arancioni
const CREAM = '#faf3ec'
const BRICK = '#ce5f36'
const LINE = 15 // spessore dei contorni a 1254 px

// Posizioni dei tratti originali (bounding box misurate sui pixel)
const LEFT_EYE = { cx: 493, cy: 398 }
const RIGHT_EYE = { cx: 760, cy: 405 }

/** Copre occhi e bocca originali con il colore del corpo */
const coverEyes = `
  <rect x="451" y="343" width="86" height="112" rx="34" fill="${BODY}"/>
  <rect x="707" y="370" width="110" height="84" rx="30" fill="${BODY}"/>`
const coverMouth = `<rect x="544" y="418" width="158" height="108" rx="32" fill="${BODY}"/>`

/** Occhio aperto come l'originale: ovale scuro con riflesso bianco */
function eye({ cx, cy }, { rx = 30, ry = 44, hx = -9, hy = -16, hr = 11 } = {}) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}"/>
  <ellipse cx="${cx + hx}" cy="${cy + hy}" rx="${hr}" ry="${hr * 1.15}" fill="#fafafa"/>`
}

const stroke = (d, w = LINE) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

const EXPRESSIONS = {
  // Fine spesa, conferme: occhi chiusi a mezzaluna, sorriso originale
  contenta: {
    clearSparks: false,
    over: `${coverEyes}
      ${stroke(`M452 414 Q493 360 534 414`, 17)}
      ${stroke(`M719 414 Q760 360 801 414`, 17)}
      <g fill="${SPARK}">
        <path d="M1040 170 l14 36 36 14 -36 14 -14 36 -14 -36 -36 -14 36 -14z"/>
        <path d="M1130 300 l9 22 22 9 -22 9 -9 22 -9 -22 -22 -9 22 -9z"/>
      </g>`,
  },
  // Stati vuoti, attese: occhi in alto, sopracciglio alzato, bocca storta, nuvoletta
  pensierosa: {
    clearSparks: true,
    over: `${coverEyes}${coverMouth}
      ${eye({ cx: 498, cy: 392 }, { rx: 28, ry: 40, hx: 8, hy: -18, hr: 10 })}
      ${eye({ cx: 752, cy: 392 }, { rx: 28, ry: 40, hx: 8, hy: -18, hr: 10 })}
      ${stroke(`M718 320 Q752 296 790 312`, 14)}
      ${stroke(`M590 482 Q612 470 632 478 T670 470`, 14)}
      <g fill="${CREAM}" stroke="${INK}" stroke-width="12">
        <circle cx="1035" cy="205" r="17"/>
        <circle cx="1092" cy="138" r="26"/>
        <circle cx="1170" cy="62" r="38"/>
      </g>`,
  },
  // Errori: sopracciglia all'insù al centro, occhi grandi, bocca in giù, goccia
  dispiaciuta: {
    clearSparks: true,
    over: `${coverEyes}${coverMouth}
      ${eye({ cx: 495, cy: 402 }, { rx: 31, ry: 41, hx: -8, hy: -14, hr: 12 })}
      ${eye({ cx: 755, cy: 402 }, { rx: 31, ry: 41, hx: -8, hy: -14, hr: 12 })}
      ${stroke(`M452 338 Q490 334 528 314`, 14)}
      ${stroke(`M722 314 Q760 334 798 338`, 14)}
      ${stroke(`M588 492 Q623 458 658 492`, 15)}
      <path d="M352 262 C352 262 322 302 322 324 a30 30 0 0 0 60 0 C382 302 352 262 352 262z"
        fill="#cfe6ee" stroke="${INK}" stroke-width="11" stroke-linejoin="round"/>`,
  },
  // "Controlla la posta": sorriso originale con occhiolino, busta in mano
  posta: {
    clearSparks: true,
    under: `<g transform="rotate(-12 190 380)">
        <rect x="70" y="290" width="250" height="170" rx="18" fill="${CREAM}" stroke="${INK}" stroke-width="${LINE}"/>
        ${stroke(`M82 304 L195 392 L308 304`, LINE)}
        <circle cx="195" cy="392" r="20" fill="${BRICK}" stroke="${INK}" stroke-width="10"/>
      </g>`,
    over: `<g stroke="${SPARK}" stroke-width="16" stroke-linecap="round">
        <path d="M70 200 L95 235"/><path d="M150 168 L152 210"/><path d="M228 182 L212 220"/>
      </g>`,
  },
}

async function baseMascot(clearSparks) {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (clearSparks) {
    // le lineette arancioni stanno a sinistra della testa, sopra il pollice
    for (let y = 0; y < 482; y++)
      for (let x = 0; x < 300; x++) {
        if (y >= 445 && x >= 175) continue
        data[(y * info.width + x) * 4 + 3] = 0
      }
  }
  return sharp(data, { raw: info }).png().toBuffer()
}

const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${body}</svg>`,
  )

for (const [name, e] of Object.entries(EXPRESSIONS)) {
  const mascot = await baseMascot(e.clearSparks)
  const layers = []
  if (e.under) layers.push({ input: svg(e.under) })
  layers.push({ input: mascot })
  if (e.over) layers.push({ input: svg(e.over) })
  const png = await sharp({
    create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png()
    .toBuffer()
  await sharp(png)
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(path.join(OUT, `frigolo-${name}.png`))
  await sharp(png)
    .resize(512, 512)
    .webp({ quality: 88 })
    .toFile(path.join(OUT, `frigolo-${name}.webp`))
  console.log('ok', name)
}
