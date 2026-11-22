// Copia in public/ i font, le schermate e la mascotte usati dal video.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../..')
const pub = path.resolve(here, '../public')
fs.mkdirSync(path.join(pub, 'fonts'), { recursive: true })
fs.mkdirSync(path.join(pub, 'img'), { recursive: true })

const fonts = {
  'lato-400.woff2': '@fontsource/lato/files/lato-latin-400-normal.woff2',
  'lato-700.woff2': '@fontsource/lato/files/lato-latin-700-normal.woff2',
  'lato-900.woff2': '@fontsource/lato/files/lato-latin-900-normal.woff2',
  'playfair-700.woff2': '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2',
  'playfair-700i.woff2': '@fontsource/playfair-display/files/playfair-display-latin-700-italic.woff2',
}
for (const [dst, src] of Object.entries(fonts)) {
  fs.copyFileSync(path.join(root, 'node_modules', src), path.join(pub, 'fonts', dst))
}

const shots = fs.readdirSync(path.join(root, 'marketing/screenshot')).filter((f) => f.endsWith('.png'))
for (const f of shots) fs.copyFileSync(path.join(root, 'marketing/screenshot', f), path.join(pub, 'img', f))

const masc = {
  classica: path.join(root, 'assets/mascot.webp'),
  contenta: path.join(root, 'marketing/kit/mascotte/frigolo-contenta.png'),
  pensierosa: path.join(root, 'marketing/kit/mascotte/frigolo-pensierosa.png'),
  posta: path.join(root, 'marketing/kit/mascotte/frigolo-posta.png'),
}
for (const [n, p] of Object.entries(masc)) {
  await sharp(p).resize(800).png({ compressionLevel: 9 }).toFile(path.join(pub, 'img', `frigolo-${n}.png`))
}
fs.copyFileSync(path.join(root, 'public/mascot-avatar.webp'), path.join(pub, 'img/mascot-avatar.webp'))
console.log('assets pronti')
