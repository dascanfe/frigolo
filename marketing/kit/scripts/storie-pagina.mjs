// Rende le storie e le copertine in evidenza della pagina da storie-pagina-dati.mjs.
//   node marketing/kit/scripts/storie-pagina.mjs
// Uscita: PACCHETTO/00-storie-pagina (default: Frigolo published/pacchetto-instagram).
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { RACCOLTE, COPERTINE, LEGGIMI } from './storie-pagina-dati.mjs'

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const MODEL = path.join(root, 'marketing/kit/modelli/storie-pagina.html')
const OUT = path.join(
  process.env.PACCHETTO ||
    path.join(os.homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Works/Frigolo published/pacchetto-instagram'),
  '00-storie-pagina',
)
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) throw new Error('Chrome non trovato: imposta CHROME')

async function render(cfg, dest) {
  const tmp = path.join(os.tmpdir(), `sp-${process.pid}-${Math.random().toString(36).slice(2)}.png`)
  const url = `${pathToFileURL(MODEL).href}?d=${encodeURIComponent(JSON.stringify(cfg))}`
  await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--virtual-time-budget=4000', '--window-size=1080,1920', `--screenshot=${tmp}`, url])
  const meta = await sharp(tmp).metadata()
  if (meta.width !== 1080 || meta.height !== 1920) throw new Error(`${dest}: ${meta.width}x${meta.height}`)
  await sharp(tmp).png({ compressionLevel: 9 }).toFile(dest)
  rmSync(tmp)
}

const jobs = []
mkdirSync(OUT, { recursive: true })
writeFileSync(path.join(OUT, 'LEGGIMI.txt'), LEGGIMI)
for (const r of RACCOLTE) {
  const dir = path.join(OUT, r.cartella)
  mkdirSync(dir, { recursive: true })
  for (const [name, cfg] of r.storie) jobs.push({ cfg, dest: path.join(dir, name) })
  writeFileSync(path.join(dir, 'istruzioni.txt'), r.istruzioni)
}
const cop = path.join(OUT, 'copertine-in-evidenza')
mkdirSync(cop, { recursive: true })
for (const [name, icona] of COPERTINE) jobs.push({ cfg: { tipo: 'icona', icona }, dest: path.join(cop, name) })

for (let i = 0; i < jobs.length; i += 4) {
  await Promise.all(jobs.slice(i, i + 4).map((j) => render(j.cfg, j.dest)))
  console.log(`${Math.min(i + 4, jobs.length)}/${jobs.length}`)
}
