// Estrae fotogrammi di controllo: node scripts/stills.mjs Frigolo9x16 60,200,350
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const [id, frames, dir = 'out/check'] = process.argv.slice(2)
const out = path.resolve(here, '..', dir)
fs.mkdirSync(out, { recursive: true })
const serveUrl = await bundle({ entryPoint: path.resolve(here, '../src/index.ts'), publicDir: path.resolve(here, '../public') })
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const composition = await selectComposition({ serveUrl, id, browserExecutable: chrome })
for (const f of frames.split(',').map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: path.join(out, `${id}_${String(f).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 85, browserExecutable: chrome })
}
console.log('fatto')
