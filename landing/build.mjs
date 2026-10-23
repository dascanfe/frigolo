// Landing di Frigolo (dascanfe.com/sub/frigolo): prepara la cartella dist/.
//
//   node landing/build.mjs                 costruisce landing/dist
//   node landing/build.mjs --legal-from <rev>   rigenera privacy e termini da docs/legale
//                                          di quella revisione git (es. origin/aglio/audit-legale)
//   node landing/build.mjs --copy-to <dir> costruisce e copia dist/ nella cartella del sito
//
// Bootstrap 5.3 compilato con Sass (solo le parti usate, palette del kit di Paprika), font
// self-hosted (gli stessi dell'app, da @fontsource), screenshot ridimensionati in WebP, pagine
// legali. Niente CDN e niente risorse di terzi.
//
// Screenshot: landing/assets/screens/<codice>-*.png (es. s02-catalogo.png), altrimenti la cartella
// marketing/screenshot di Paprika se esiste, altrimenti segnaposto 390x844 generati qui.
// Video: landing/assets/video/*.mp4 e *.webm (16:9) e un poster, altrimenti il segnaposto.
// Statistiche: FRIGOLO_STATS_KEY sostituisce __STATS_KEY__ in index.html (senza chiave il
// tracciante resta spento).
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import * as sass from 'sass'
import sharp from 'sharp'
import { minify } from 'terser'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const src = join(here, 'src')
const dist = join(here, 'dist')
const BASE = 'https://www.dascanfe.com/sub/frigolo/'
const args = process.argv.slice(2)
const argValue = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

rmSync(dist, { recursive: true, force: true })
for (const d of ['fonts', 'img', 'video']) mkdirSync(join(dist, d), { recursive: true })

// ---------------------------------------------------------------- stile
const css = sass
  .compile(join(src, 'scss/styles.scss'), {
    loadPaths: [join(root, 'node_modules')],
    style: 'compressed',
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
  })
  .css.replace(/^\uFEFF/, '')
writeFileSync(join(dist, 'styles.css'), css)

// sorgenti (js, tracciante, .htaccess); index.html e legali si preparano sotto
cpSync(src, dist, {
  recursive: true,
  filter: (p) => !p.includes('legal-src') && !p.includes('/scss') && !p.endsWith('index.html'),
})

// JavaScript minificato
for (const f of ['main.js', 'track.js']) {
  const out = await minify(readFileSync(join(src, f), 'utf8'), { compress: true, mangle: true })
  writeFileSync(join(dist, f), out.code)
}

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

// ---------------------------------------------------------------- immagini
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
const ogImage = join(here, 'assets/og-image.png')
cpSync(existsSync(ogImage) ? ogImage : join(pub, 'og-image.png'), join(dist, 'og-image.png'))

// screenshot dell'app nei telefoni
const paprika = join(homedir(), 'frigolo-worktrees/paprika/marketing')
const screenDirs = [join(here, 'assets/screens'), join(paprika, 'screenshot')]
const videoDirs = [join(here, 'assets/video'), join(paprika, 'video/out')]
const listImages = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => /\.(png|webp|jpe?g)$/i.test(f)) : []
const SCREENS = {
  's02-catalogo': { kind: 'grid', title: 'Catalogo', sub: 'Frutta e verdura' },
  's03-lista-lele': { kind: 'list', title: 'Casa', sub: 'Da comprare', fresh: true },
  's04-lista-giulia': {
    kind: 'list',
    title: 'Casa',
    sub: 'Al supermercato',
    fresh: true,
    checked: 3,
  },
  's05-corsia': { kind: 'list', title: 'Casa', sub: 'In ordine di corsia', sections: true },
  's06-carrello': { kind: 'list', title: 'Casa', sub: 'Nel carrello', checked: 4 },
  's13-analitiche': { kind: 'chart', title: 'Analitiche', sub: 'Lista Casa' },
  's14-ultimi-acquisti': { kind: 'list', title: 'Casa', sub: 'Suggeriti per te', chips: true },
  's17-offline': { kind: 'list', title: 'Casa', sub: 'Da comprare', banner: 'Offline' },
}
const COLORS = ['#3e7c86', '#ce5f36', '#7e7530', '#c2902f', '#a85641', '#86a79b']
const missing = []

function placeholderSvg(code, o) {
  const W = 780
  const H = 1688
  let body = ''
  if (o.kind === 'grid') {
    for (let i = 0; i < 12; i++) {
      const x = 48 + (i % 3) * 232
      const y = 330 + Math.floor(i / 3) * 250
      const on = [1, 5, 6, 10].includes(i)
      body += `<rect x="${x}" y="${y}" width="210" height="226" rx="34" fill="${on ? '#db6a2e' : '#faf3ec'}" stroke="#ebd5b3" stroke-width="3"/>`
      body += `<circle cx="${x + 105}" cy="${y + 95}" r="52" fill="${COLORS[i % 6]}" opacity="0.8"/>`
      body += `<rect x="${x + 40}" y="${y + 170}" width="130" height="18" rx="9" fill="${on ? '#faf3ec' : '#3a2c21'}" opacity="0.5"/>`
    }
  } else if (o.kind === 'chart') {
    body += `<rect x="48" y="320" width="684" height="460" rx="40" fill="#faf3ec" stroke="#ebd5b3" stroke-width="3"/>`
    body += `<path d="M80 700 C 170 600 230 690 320 560 S 480 520 560 600 S 650 470 700 500 L700 740 L80 740 Z" fill="#db6a2e" opacity="0.28"/>`
    body += `<path d="M80 700 C 170 600 230 690 320 560 S 480 520 560 600 S 650 470 700 500" fill="none" stroke="#ce5f36" stroke-width="10" stroke-linecap="round"/>`
    for (let i = 0; i < 5; i++) {
      const y = 850 + i * 130
      body += `<circle cx="100" cy="${y + 40}" r="34" fill="${COLORS[i]}"/>`
      body += `<rect x="160" y="${y + 20}" width="${460 - i * 60}" height="26" rx="13" fill="#3a2c21" opacity="0.55"/>`
      body += `<rect x="160" y="${y + 60}" width="${300 - i * 30}" height="16" rx="8" fill="#6b5844" opacity="0.35"/>`
    }
  } else {
    let y = o.banner ? 360 : 290
    if (o.banner) {
      body += `<rect x="48" y="${y - 70}" width="684" height="60" rx="30" fill="#3a2c21"/><text x="390" y="${y - 28}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="30" fill="#faf3ec">${o.banner}</text>`
    }
    if (o.chips) {
      for (let i = 0; i < 3; i++) {
        body += `<rect x="${48 + i * 230}" y="${y}" width="210" height="76" rx="38" fill="#e5987a" opacity="0.7"/>`
      }
      y += 120
    }
    const rows = 8
    for (let i = 0; i < rows; i++) {
      if (o.sections && i % 3 === 0) {
        body += `<rect x="48" y="${y + 8}" width="220" height="26" rx="13" fill="#3a2c21" opacity="0.5"/>`
        y += 56
      }
      const done = o.checked && i >= rows - o.checked
      const fresh = o.fresh && i === 0
      body += `<rect x="48" y="${y}" width="684" height="118" rx="34" fill="${fresh ? '#ffffff' : '#faf3ec'}" stroke="${fresh ? '#db6a2e' : '#ebd5b3'}" stroke-width="${fresh ? 5 : 3}"/>`
      body += `<circle cx="116" cy="${y + 59}" r="34" fill="${done ? '#86a79b' : COLORS[i % 6]}" opacity="0.9"/>`
      body += `<rect x="176" y="${y + 36}" width="${300 - (i % 3) * 50}" height="24" rx="12" fill="#3a2c21" opacity="${done ? 0.3 : 0.6}"/>`
      body += `<rect x="176" y="${y + 74}" width="${150 + (i % 2) * 60}" height="16" rx="8" fill="#6b5844" opacity="0.3"/>`
      y += 140
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#f4ece2"/>
<text x="48" y="190" font-family="Georgia, serif" font-weight="700" font-size="76" fill="#3a2c21">${o.title}</text>
<text x="48" y="248" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#6b5844">${o.sub}</text>
${body}
<rect y="1548" width="${W}" height="140" fill="#faf3ec"/><line x1="0" x2="${W}" y1="1548" y2="1548" stroke="#ebd5b3" stroke-width="3"/>
<circle cx="195" cy="1618" r="26" fill="#db6a2e"/><circle cx="390" cy="1618" r="26" fill="#ebd5b3"/><circle cx="585" cy="1618" r="26" fill="#ebd5b3"/>
<g transform="rotate(-16 390 900)"><rect x="140" y="840" width="500" height="120" rx="60" fill="#04342f" opacity="0.88"/>
<text x="390" y="915" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="44" fill="#9de0d1">SEGNAPOSTO ${code.toUpperCase()}</text></g>
</svg>`
}

for (const [slug, opts] of Object.entries(SCREENS)) {
  const code = slug.split('-')[0]
  let file
  for (const dir of screenDirs) {
    const found = listImages(dir).find(
      (f) => f.toLowerCase().startsWith(`${code}-`) || f.toLowerCase().startsWith(`${code}.`),
    )
    if (found) {
      file = join(dir, found)
      break
    }
  }
  if (!file) missing.push(slug)
  const input = file ?? Buffer.from(placeholderSvg(code, opts))
  for (const w of [390, 520, 780]) {
    await sharp(input)
      .resize(w, Math.round((w * 844) / 390), { fit: 'cover', position: 'top' })
      .webp({ quality: 80 })
      .toFile(join(dist, `img/${slug}-${w}.webp`))
  }
}

// video e poster
let videoFiles = null
for (const dir of videoDirs) {
  if (!existsSync(dir)) continue
  const all = readdirSync(dir)
  const pick = (re) => {
    const list = all.filter((f) => re.test(f))
    return list.find((f) => /16[x:_-]?9|landscape|orizz/i.test(f)) ?? list[0]
  }
  const mp4 = pick(/\.mp4$/i)
  const webm = pick(/\.webm$/i)
  if (mp4 && webm) {
    videoFiles = { dir, mp4, webm }
    break
  }
}
const hasVideo = Boolean(videoFiles)
if (hasVideo) {
  cpSync(join(videoFiles.dir, videoFiles.mp4), join(dist, 'video/frigolo.mp4'))
  cpSync(join(videoFiles.dir, videoFiles.webm), join(dist, 'video/frigolo.webm'))
} else {
  rmSync(join(dist, 'video'), { recursive: true, force: true })
}
let posterSrc
for (const dir of videoDirs) {
  const found = listImages(dir).find((f) => /poster|copertina|thumb/i.test(f))
  if (found) {
    posterSrc = join(dir, found)
    break
  }
}
if (!posterSrc) {
  const mascot = await sharp(join(pub, 'mascot.png')).resize(420, 420).toBuffer()
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9de0d1"/><stop offset="1" stop-color="#f4ece2"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="820" cy="360" r="110" fill="#04342f" opacity="0.9"/><path d="M795 305 L795 415 L890 360 Z" fill="#f4ece2"/></svg>`,
  )
  posterSrc = await sharp(bg)
    .composite([{ input: mascot, left: 220, top: 150 }])
    .png()
    .toBuffer()
}
for (const w of [640, 1280]) {
  await sharp(posterSrc)
    .resize(w, Math.round((w * 9) / 16), { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(join(dist, `img/video-poster-${w}.webp`))
}

// ---------------------------------------------------------------- index.html
const textOf = (h) =>
  h
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
let html = readFileSync(join(src, 'index.html'), 'utf8')
// stile in linea: niente richiesta che blocca il primo disegno (le pagine legali usano styles.css)
html = html.replace('<!--css-->', `<style>${css}</style>`)

// <shot slug="..." alt="..." sizes="..." lazy|eager class="..."></shot> -> <img> con srcset
html = html.replace(/<shot\s+([^>]*?)><\/shot>/g, (_m, attrs) => {
  const a = Object.fromEntries(
    [...attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]),
  )
  const eager = a.eager === true
  return (
    `<img src="img/${a.slug}-390.webp" srcset="img/${a.slug}-390.webp 390w, img/${a.slug}-520.webp 520w, img/${a.slug}-780.webp 780w" ` +
    `sizes="${a.sizes}" width="390" height="844" alt="${a.alt ?? ''}" decoding="async" ` +
    (eager ? 'fetchpriority="high" ' : 'loading="lazy" ') +
    (a.class ? `class="${a.class}" ` : '') +
    '/>'
  )
})

// video vero oppure segnaposto
html = html.replace(
  /<!--video:on-->([\s\S]*?)<!--video:off-->([\s\S]*?)<!--video:end-->/,
  (_m, on, off) => (hasVideo ? on : off),
)

// dati strutturati
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`
const shots = ['s06-carrello', 's02-catalogo', 's04-lista-giulia', 's13-analitiche'].map(
  (s) => `${BASE}img/${s}-780.webp`,
)
const app = ld({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Frigolo',
  url: BASE,
  description:
    "Lista della spesa condivisa, gratuita e open source: si aggiorna su tutti i telefoni, funziona anche senza rete e segue l'ordine di corsia del supermercato.",
  applicationCategory: 'ShoppingApplication',
  operatingSystem: 'Web, iOS, Android',
  browserRequirements: 'Richiede un browser moderno (Safari, Chrome, Firefox, Edge)',
  inLanguage: 'it',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  image: `${BASE}og-image.png`,
  screenshot: shots,
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  codeRepository: 'https://github.com/dascanfe/frigolo',
  author: { '@type': 'Person', name: 'Daniele Scanferlato', url: 'https://www.dascanfe.com' },
})
const faqItems = [
  ...html.matchAll(
    /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g,
  ),
].map((m) => ({
  '@type': 'Question',
  name: textOf(m[1]),
  acceptedAnswer: { '@type': 'Answer', text: textOf(m[2]) },
}))
const faq = ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems })
const video = hasVideo
  ? ld({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Frigolo in 40 secondi',
      description:
        'La spesa raccontata dall\'inizio alla fine: dalla lista condivisa a "Spesa finita".',
      thumbnailUrl: [`${BASE}img/video-poster-1280.webp`],
      uploadDate: '2026-10-11',
      duration: 'PT40S',
      contentUrl: `${BASE}video/frigolo.mp4`,
      inLanguage: 'it',
    })
  : ''
html = html
  .replace('<!--jsonld:app-->', app)
  .replace('<!--jsonld:faq-->', faq)
  .replace('<!--jsonld:video-->', video)

// statistiche: la chiave non sta nel repo
const statsKey = process.env.FRIGOLO_STATS_KEY
if (statsKey) html = html.replace('__STATS_KEY__', statsKey)
writeFileSync(join(dist, 'index.html'), html)

// ---------------------------------------------------------------- pagine legali
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

// ---------------------------------------------------------------- cruscotto delle statistiche
// landing/statistiche/ -> dist/<id casuale>/, non indicizzato e senza link dalla landing.
// La chiave pubblica del progetto delle statistiche arriva da STATS_SUPABASE_ANON_KEY:
// senza, resta il segnaposto e il cruscotto non si collega (nessun errore di build).
const STATS_DIR = '70ab0c479107f71a'
const statsOut = join(dist, STATS_DIR)
cpSync(join(here, 'statistiche'), statsOut, { recursive: true })
mkdirSync(join(statsOut, 'fonts'), { recursive: true })
mkdirSync(join(statsOut, 'lib'), { recursive: true })
for (const [pkg, file] of [
  ['lato', 'lato-latin-400-normal.woff2'],
  ['lato', 'lato-latin-700-normal.woff2'],
  ['lato', 'lato-latin-900-normal.woff2'],
  ['playfair-display', 'playfair-display-latin-700-normal.woff2'],
  ['playfair-display', 'playfair-display-latin-700-italic.woff2'],
]) {
  cpSync(join(root, 'node_modules/@fontsource', pkg, 'files', file), join(statsOut, 'fonts', file))
}
cpSync(
  join(root, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'),
  join(statsOut, 'lib/supabase.js'),
)
const statsKeys = { __STATS_ANON_KEY__: process.env.STATS_SUPABASE_ANON_KEY }
let statsConfig = readFileSync(join(statsOut, 'config.js'), 'utf8')
for (const [segnaposto, valore] of Object.entries(statsKeys)) {
  if (valore) statsConfig = statsConfig.replace(segnaposto, valore)
  else console.log(`cruscotto: manca la chiave ${segnaposto}, resta il segnaposto`)
}
writeFileSync(join(statsOut, 'config.js'), statsConfig)

const copyTo = argValue('--copy-to')
if (copyTo) {
  cpSync(dist, copyTo, { recursive: true })
  console.log(`copiato in ${copyTo}`)
}
console.log(
  `landing/dist pronta (${faqItems.length} domande, video: ${hasVideo ? 'sì' : 'segnaposto'})`,
)
if (missing.length) console.log(`screenshot ancora segnaposto: ${missing.join(', ')}`)
