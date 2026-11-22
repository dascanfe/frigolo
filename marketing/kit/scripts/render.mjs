// Rende in PNG le immagini del kit a partire da marketing/kit/modelli/modello.html,
// con Chrome in modalità headless (nessuna dipendenza in più), poi le comprime con sharp.
//
// Uso:
//   node marketing/kit/scripts/render.mjs                 tutte le immagini qui sotto
//   node marketing/kit/scripts/render.mjs og post-1x1     solo alcune (per nome)
// Chrome: si cerca in /Applications; altrimenti impostare CHROME=/percorso/del/binario
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import os from 'node:os'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const MODEL = path.join(root, 'marketing/kit/modelli/modello.html')

const CHROME =
  process.env.CHROME ||
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].find(existsSync)
if (!CHROME) throw new Error('Chrome non trovato: imposta la variabile CHROME')

const SIZE = {
  post: [1080, 1080],
  post45: [1080, 1350],
  storia: [1080, 1920],
  copertina: [1500, 500],
  og: [1200, 630],
}

const OG = 'La lista della spesa sempre in tasca. Per conto tuo o in compagnia.'

/** name -> { out (relativo alla radice), params } */
export const IMAGES = {
  og: {
    out: ['public/og-image.png', 'marketing/og/og-image.png'],
    params: {
      formato: 'og',
      sfondo: 'crema',
      mascotte: 'classica',
      titolo: 'La lista della spesa *sempre in tasca*',
      testo: 'Per conto tuo o in compagnia.',
    },
  },
  'og-invito': {
    out: ['public/og-invito.png', 'marketing/og/og-invito.png'],
    params: {
      formato: 'og',
      sfondo: 'crema',
      mascotte: 'posta',
      nome: 'no',
      titolo: 'Ti invitano in una lista su *Frigolo*',
      testo: 'Tocca il link per entrare.',
    },
  },
  'post-1x1': {
    out: ['marketing/kit/esempi/post-1x1.png'],
    params: {
      formato: 'post',
      sfondo: 'crema',
      mascotte: 'classica',
      titolo: 'La lista della spesa *sempre in tasca*',
      testo: 'Per conto tuo o in compagnia.',
    },
  },
  'post-1x1-arancio': {
    out: ['marketing/kit/esempi/post-1x1-arancio.png'],
    params: {
      formato: 'post',
      sfondo: 'arancio',
      mascotte: 'contenta',
      titolo: 'Spesa *finita*',
      testo: 'Tutto preso, si torna a casa.',
    },
  },
  'post-4x5': {
    out: ['marketing/kit/esempi/post-4x5.png'],
    params: {
      formato: 'post45',
      sfondo: 'menta',
      mascotte: 'classica',
      titolo: 'Frutta e verdura prima, *surgelati alla fine*',
      testo: 'Frigolo mette la lista in ordine di corsia.',
    },
  },
  'storia-9x16': {
    out: ['marketing/kit/esempi/storia-9x16.png'],
    params: {
      formato: 'storia',
      sfondo: 'crema',
      mascotte: 'contenta',
      titolo: 'Gratis, senza pubblicità, *il codice è pubblico*',
      testo: 'Si installa dal browser, in un minuto.',
    },
  },
  'copertina-3x1': {
    out: ['marketing/kit/esempi/copertina-3x1.png'],
    params: {
      formato: 'copertina',
      sfondo: 'crema',
      mascotte: 'classica',
      titolo: 'La lista della spesa *sempre in tasca*',
      testo: 'Per conto tuo o in compagnia.',
    },
  },
}

function render(name) {
  const { out, params } = IMAGES[name]
  const [w, h] = SIZE[params.formato]
  const url = `${pathToFileURL(MODEL).href}?${new URLSearchParams(params)}`
  const tmp = path.join(os.tmpdir(), `frigolo-${name}-${process.pid}.png`)
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      '--virtual-time-budget=4000',
      `--window-size=${w},${h}`,
      `--screenshot=${tmp}`,
      url,
    ],
    { stdio: 'ignore' },
  )
  return { tmp, out, w, h }
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(IMAGES)
for (const name of names) {
  if (!IMAGES[name]) throw new Error(`Immagine sconosciuta: ${name}`)
  const { tmp, out, w, h } = render(name)
  const img = sharp(tmp)
  const meta = await img.metadata()
  if (meta.width !== w || meta.height !== h)
    throw new Error(`${name}: ${meta.width}x${meta.height}, attesi ${w}x${h}`)
  // PNG a palette: le immagini sono illustrazioni a colori piatti, il peso scende molto
  const buf = await img
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toBuffer()
  for (const o of out) {
    const dest = path.join(root, o)
    mkdirSync(path.dirname(dest), { recursive: true })
    await sharp(buf).toFile(dest)
  }
  rmSync(tmp)
  console.log(
    `${name}: ${w}x${h}, ${Math.round(statSync(path.join(root, out[0])).size / 1024)} KB -> ${out.join(', ')}`,
  )
}
