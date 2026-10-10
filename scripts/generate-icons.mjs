/**
 * Genera icone PWA, favicon, apple-touch-icon, splash iOS e la mascotte in
 * app a partire da assets/mascot.webp (frigo sorridente con la busta della
 * spesa, sfondo trasparente).
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BG = '#F4ECE2'
const INK = '#3A2C21'
const MASCOT = path.resolve('assets/mascot.webp')

function roundedRectSvg(size, radius, fill) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${fill}"/></svg>`,
  )
}

/** Mascotte centrata su fondo crema; glyphScale = quanto del lato occupa */
async function icon(size, { glyphScale, radius, transparent = false }, outFile) {
  const glyph = Math.round(size * glyphScale)
  const mascot = await sharp(MASCOT)
    .resize(glyph, glyph, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  const base = transparent
    ? sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
    : sharp(roundedRectSvg(size, radius, BG))
  await base
    .composite([{ input: mascot, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(outFile)
  console.log('scritto', path.relative(process.cwd(), outFile))
}

async function splash(width, height, outFile) {
  const badge = Math.round(Math.min(width, height) * 0.42)
  const mascot = await sharp(MASCOT)
    .resize(badge, badge, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  const fontSize = Math.round(badge * 0.22)
  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${fontSize * 2}"><text x="50%" y="${fontSize * 1.3}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${fontSize}" fill="${INK}">Frigolo</text></svg>`,
  )
  const top = Math.round(height / 2 - badge * 0.65)
  await sharp({ create: { width, height, channels: 4, background: BG } })
    .composite([
      { input: mascot, top, left: Math.round((width - badge) / 2) },
      { input: text, top: top + badge + Math.round(badge * 0.05), left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outFile)
  console.log('scritto', path.relative(process.cwd(), outFile))
}

const iconsDir = path.resolve('public/icons')
const splashDir = path.resolve('public/splash')
await mkdir(iconsDir, { recursive: true })
await mkdir(splashDir, { recursive: true })

// icone "any": angoli arrotondati, mascotte grande
await icon(192, { glyphScale: 0.86, radius: 42 }, path.join(iconsDir, 'icon-192.png'))
await icon(512, { glyphScale: 0.86, radius: 112 }, path.join(iconsDir, 'icon-512.png'))
// maskable: fondo pieno, mascotte nella safe zone (80% del lato)
await icon(512, { glyphScale: 0.68, radius: 0 }, path.join(iconsDir, 'icon-512-maskable.png'))
// apple touch icon: iOS arrotonda da solo
await icon(180, { glyphScale: 0.84, radius: 0 }, path.join(iconsDir, 'apple-touch-icon.png'))
// favicon
await icon(64, { glyphScale: 1, radius: 0, transparent: true }, path.resolve('public/favicon.png'))
// mascotte per l'interfaccia (accesso, splash, stati vuoti)
await icon(512, { glyphScale: 1, radius: 0, transparent: true }, path.resolve('public/mascot.png'))

// splash iOS (portrait) per i formati piu' diffusi
const SPLASH = [
  [1290, 2796, '430x932'],
  [1179, 2556, '393x852'],
  [1170, 2532, '390x844'],
  [1125, 2436, '375x812'],
  [828, 1792, '414x896'],
  [750, 1334, '375x667'],
]
for (const [w, h, name] of SPLASH) {
  await splash(w, h, path.join(splashDir, `splash-${name}.png`))
}
