// Landing di Frigolo (dascanfe.com/sub/frigolo): prepara la cartella dist/.
//
//   node landing/build.mjs                 costruisce landing/dist
//   node landing/build.mjs --legal-from <rev>   rigenera privacy e termini da docs/legale
//                                          di quella revisione git (es. origin/aglio/audit-legale)
//   node landing/build.mjs --copy-to <dir> costruisce e copia dist/ nella cartella del sito
//
// Niente framework: copia i sorgenti di src/, i font self-hosted (gli stessi
// dell'app, da @fontsource), le immagini ridimensionate e le pagine legali.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const src = join(here, 'src')
const dist = join(here, 'dist')
const args = process.argv.slice(2)
const argValue = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

rmSync(dist, { recursive: true, force: true })
mkdirSync(join(dist, 'fonts'), { recursive: true })
mkdirSync(join(dist, 'img'), { recursive: true })

// sorgenti (html, css, js)
cpSync(src, dist, { recursive: true, filter: (p) => !p.includes('legal-src') })

// font: solo i sottoinsiemi latini e i pesi usati
const fonts = [
  ['lato', 'lato-latin-400-normal.woff2'],
  ['lato', 'lato-latin-700-normal.woff2'],
  ['lato', 'lato-latin-900-normal.woff2'],
  ['playfair-display', 'playfair-display-latin-700-normal.woff2'],
]
for (const [pkg, file] of fonts) {
  cpSync(join(root, 'node_modules/@fontsource', pkg, 'files', file), join(dist, 'fonts', file))
}

// immagini: mascotte leggera, icone, anteprima dei link (segnaposto di Paprika)
const pub = join(root, 'public')
await sharp(join(pub, 'mascot.png'))
  .resize(320, 320)
  .webp({ quality: 82 })
  .toFile(join(dist, 'img/mascot.webp'))
await sharp(join(pub, 'mascot.png'))
  .resize(160, 160)
  .webp({ quality: 82 })
  .toFile(join(dist, 'img/mascot-small.webp'))
cpSync(join(pub, 'favicon.png'), join(dist, 'favicon.png'))
cpSync(join(pub, 'icons/apple-touch-icon.png'), join(dist, 'apple-touch-icon.png'))
// anteprima dei link: quella definitiva di Paprika (landing/assets), altrimenti il segnaposto dell'app
const ogImage = join(here, 'assets/og-image.png')
cpSync(existsSync(ogImage) ? ogImage : join(pub, 'og-image.png'), join(dist, 'og-image.png'))

// pagine legali: da docs/legale (bozze di Aglio) a HTML con lo stesso stile
const legalSrc = join(src, 'legal-src')
const legalFrom = argValue('--legal-from')
if (legalFrom) {
  mkdirSync(legalSrc, { recursive: true })
  for (const name of ['privacy', 'termini']) {
    const md = execFileSync('git', ['show', `${legalFrom}:docs/legale/${name}.md`], { cwd: root })
    writeFileSync(join(legalSrc, `${name}.md`), md)
  }
}
const template = readFileSync(join(here, 'legal-template.html'), 'utf8')
for (const [name, title] of [
  ['privacy', 'Informativa sulla privacy'],
  ['termini', "Termini d'uso"],
]) {
  const file = join(legalSrc, `${name}.md`)
  if (!existsSync(file)) continue
  // le note per la squadra (blocchi citati) non vanno nella pagina pubblica
  const md = readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !line.startsWith('>'))
    .join('\n')
  const body = marked.parse(md)
  writeFileSync(
    join(dist, `${name}.html`),
    template.replaceAll('{{title}}', title).replace('{{body}}', body).replace('{{page}}', name),
  )
}

const copyTo = argValue('--copy-to')
if (copyTo) {
  cpSync(dist, copyTo, { recursive: true })
  console.log(`copiato in ${copyTo}`)
}
console.log('landing/dist pronta')
