// Rende le storie dei sondaggi (ST1, ST2) in PACCHETTO/ST1-storie-sondaggio e ST2-storia-risultati.
//   node marketing/kit/scripts/storie-sondaggio.mjs
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const MODEL = path.join(root, 'marketing/kit/modelli/storie-sondaggio.html')
const PAC = process.env.PACCHETTO ||
  path.join(os.homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Works/Frigolo published/pacchetto-instagram')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) throw new Error('Chrome non trovato: imposta CHROME')

const JOBS = [
  ['ST1-storie-sondaggio/01-storia-domanda.png', { tipo: 'domanda' }],
  ['ST1-storie-sondaggio/02-storia-confessione.png', { tipo: 'confessione' }],
  ['ST2-storia-risultati/01-storia-risultati.png', { tipo: 'risultati', schermata: 'marketing/screenshot/n01-home.png' }],
]

for (const [rel, cfg] of JOBS) {
  const dest = path.join(PAC, rel)
  mkdirSync(path.dirname(dest), { recursive: true })
  const tmp = path.join(os.tmpdir(), `ss-${process.pid}-${Math.random().toString(36).slice(2)}.png`)
  const url = `${pathToFileURL(MODEL).href}?d=${encodeURIComponent(JSON.stringify(cfg))}`
  await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--virtual-time-budget=4000', '--window-size=1080,1920', `--screenshot=${tmp}`, url])
  const m = await sharp(tmp).metadata()
  if (m.width !== 1080 || m.height !== 1920) throw new Error(`${rel}: ${m.width}x${m.height}`)
  await sharp(tmp).png({ compressionLevel: 9 }).toFile(dest)
  rmSync(tmp)
  console.log(rel)
}
