// Rende le immagini Instagram di marketing/kit/modelli/instagram.html, copia i video,
// scrive i didascalia.txt e docs/comunicazione/piano-instagram.md dai dati in instagram-dati.mjs.
//   node marketing/kit/scripts/instagram.mjs [--solo S1-02] [--no-piano]
// Cartella di uscita: variabile PACCHETTO (default: Frigolo published/pacchetto-instagram).
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { CONTENUTI, CREDITO } from './instagram-dati.mjs'

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const MODEL = path.join(root, 'marketing/kit/modelli/instagram.html')
const OUT =
  process.env.PACCHETTO ||
  path.join(os.homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Works/Frigolo published/pacchetto-instagram')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if (!existsSync(CHROME)) throw new Error('Chrome non trovato: imposta CHROME')
const SIZE = { p: [1080, 1350], s: [1080, 1920] }

const args = process.argv.slice(2)
const solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null

async function render(cfg, dest) {
  const [w, h] = SIZE[cfg.f]
  const tmp = path.join(os.tmpdir(), `ig-${process.pid}-${Math.random().toString(36).slice(2)}.png`)
  const url = `${pathToFileURL(MODEL).href}?d=${encodeURIComponent(JSON.stringify(cfg))}`
  await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--virtual-time-budget=4000', `--window-size=${w},${h}`, `--screenshot=${tmp}`, url])
  const meta = await sharp(tmp).metadata()
  if (meta.width !== w || meta.height !== h) throw new Error(`${dest}: ${meta.width}x${meta.height}`)
  await sharp(tmp).png({ compressionLevel: 9 }).toFile(dest)
  rmSync(tmp)
}

export const testoDidascalia = (c) =>
  c.didascalia.startsWith('Storie, nessuna') ? c.didascalia : `${c.didascalia}\n\n${c.hashtag}\n`

const jobs = []
for (const c of CONTENUTI) {
  if (solo && !c.id.startsWith(solo)) continue
  const dir = path.join(OUT, c.id)
  mkdirSync(dir, { recursive: true })
  c.immagini.forEach((im, i) => {
    const [name, cfg] = Array.isArray(im) ? im : [`${String(i + 1).padStart(2, '0')}-slide.png`, im]
    jobs.push({ cfg, dest: path.join(dir, name) })
  })
  for (const [src, name] of c.video || []) copyFileSync(path.join(root, src), path.join(dir, name))
  writeFileSync(path.join(dir, 'didascalia.txt'), testoDidascalia(c))
  writeFileSync(path.join(dir, 'testo-alternativo.txt'), c.alt + '\n')
}
// qualche rendering in parallelo
for (let i = 0; i < jobs.length; i += 4) {
  await Promise.all(jobs.slice(i, i + 4).map((j) => render(j.cfg, j.dest)))
  console.log(`${Math.min(i + 4, jobs.length)}/${jobs.length}`)
}

// ---------- piano in Markdown ----------
if (!solo && !args.includes('--no-piano')) {
  const { BIO_LINK, utm, PAGINA } = await import('./instagram-dati.mjs')
  const cal = CONTENUTI.map((c) => `| ${c.sett} | ${c.giorno} ${c.ora} | ${c.id.slice(0, 5)} | ${c.titolo} | ${c.formato} |`).join('\n')
  const sezioni = CONTENUTI.map((c, i) => {
    const files = [...(c.video || []).map(([, n]) => n), ...c.immagini.map((im, k) => (Array.isArray(im) ? im[0] : `${String(k + 1).padStart(2, '0')}-slide.png`))]
    return `### ${i + 1}. ${c.titolo} (${c.id.slice(0, 5)})

- **Quando:** settimana ${c.sett}, ${c.giorno.toLowerCase()} alle ${c.ora}
- **Formato:** ${c.formato}
- **Obiettivo:** ${c.obiettivo}
- **File:** \`pacchetto-instagram/${c.id}/\` (${files.join(', ')})${c.note ? `\n- **Nota:** ${c.note}` : ''}
- **Come pubblicarlo:** ${c.collab}${c.evidenza ? `\n- **In evidenza su ${PAGINA}:** salva la storia di questo contenuto nella raccolta "${c.evidenza}"` : ''}
- **Sticker e storie:** ${c.sticker}

**Didascalia** (uguale a \`didascalia.txt\` nella cartella):

\`\`\`text
${testoDidascalia(c).trimEnd()}
\`\`\`

**Testo alternativo:** ${c.alt}
`
  }).join('\n')

  const md = `# Piano Instagram: le prime 4 settimane

A cura di Paprika (contenuti) e Zenzero (testi). Per il profilo personale di Daniele. Si parte dal
lancio: ogni contenuto è già pronto in \`pacchetto-instagram/\` (fuori dal repo e dal sito, nella
cartella di Frigolo published), con didascalia, testo alternativo e immagini alla misura giusta.
Il tono è quello di [tono.md](tono.md): frasi brevi, tu, una sola emoji e solo dove serve. Il
posizionamento è in [../strategia/posizionamento.md](../strategia/posizionamento.md) e il piano
di lancio in [../strategia/lancio.md](../strategia/lancio.md).

## Come è fatto il piano

- **12 contenuti in 4 settimane**, 3 a settimana: martedì sera, giovedì a pranzo, sabato mattina.
  Gli orari sono un punto di partenza: dopo 2 settimane si guardano le statistiche di Instagram
  (Pubblico, "Quando i tuoi follower sono online") e si spostano.
- **Tra i 12 ci sono:** 2 Reel (lancio e tempo reale), 5 caroselli, 3 post singoli, 1 set di storie
  e 1 post con storie per il feedback.
- **Storie:** una o due al giorno nei giorni di pubblicazione, con gli sticker indicati. Le storie
  senza immagine dedicata condividono il post del giorno.
- **Una cosa per volta, nessun invito a donare fuori dal post del caffè** (tono.md: niente
  richieste di donazione nei flussi o dopo un problema).
- **Dietro le quinte senza esagerare:** Daniele racconta che l'ha fatta da designer con una
  squadra di agenti AI una volta, nella settimana 3. Non si ripete in ogni post.
- **Musica:** i due Reel usano "Fun Day" di AShamaluevMusic. La riga di credito è già in
  didascalia. Prima di pubblicare conferma la licenza (vedi \`marketing/video/musica.md\`).
- **Cosa non promettere** (da posizionamento.md): niente "gratis per sempre", niente risparmio,
  niente funzioni che non ci sono (notifiche, codici a barre, più di 5 persone per lista).

## La pagina ${PAGINA}

Frigolo ha una sua pagina, ma **il motore resta il tuo profilo**: i contenuti si pubblicano da te
come **post in collaborazione** con ${PAGINA}, così compaiono su tutti e due i profili con un solo
lavoro e gli stessi like e commenti. Niente ricondivisioni nel feed: Instagram non le premia e chi
ti segue vedrebbe due volte la stessa cosa.

**Impostazione, una volta sola**

1. L'account ${PAGINA} è già creato (@frigolo era preso). Passalo ad **account professionale** (Creator o Business,
   gratis): servono statistiche e collaborazioni.
2. Immagine del profilo: la mascotte (\`marketing/kit/mascotte/frigolo-contenta.png\`).
3. Bio: \`La lista della spesa sempre in tasca. Per conto tuo o in compagnia. Gratis 💚\` e link
   ${BIO_LINK.replace('utm_content=bio', 'utm_content=bio-pagina')}
4. Raccolte in evidenza: **Installa**, **Come funziona**, **Novità**, **Domande**, **Caffè**. Per
   ogni contenuto qui sotto è indicato cosa salvare e dove.
5. Nel tuo profilo personale aggiungi ${PAGINA} nella bio (per esempio "Sto facendo ${PAGINA} 🧊").

**Cosa fa la pagina da sola:** risponde ai messaggi e ai commenti, ricondivide nelle storie chi
la tagga mentre usa l'app, tiene aggiornate le raccolte in evidenza. Se un giorno la gente comincia
a cercarla e taggarla da sé, avrà un piano suo.

## Bio e link

Testo suggerito (stanno nei 150 caratteri di Instagram):

\`\`\`text
La lista della spesa condivisa.
Gratis, senza pubblicità, open source.
Si apre da un link 👇
\`\`\`

- **Nome:** il tuo (UX/UI designer) e, se vuoi, "Frigolo" nella riga del nome per essere trovato.
- **Link nella bio:** \`${BIO_LINK}\`
- **Sticker link nelle storie:** lo stesso indirizzo con \`utm_content=storie-sN-NN\` (è già
  scritto sotto ogni contenuto).
- Il caffè: nei post si dice "è nella bio". Se vuoi un secondo link, Instagram ne permette più
  d'uno: il primo la landing, il secondo \`https://paypal.me/DanieleScanferlato\`.

## Come misurare

Tutti i link alla landing portano questi parametri:

\`\`\`text
?utm_source=instagram&utm_medium=social&utm_campaign=lancio&utm_content=<dove>
\`\`\`

- \`<dove>\` vale \`bio\` per il link nella bio e \`storie-s1-01\`, \`storie-s2-03\` ecc. per gli
  sticker, così si capisce da quale contenuto arriva chi clicca.
- Si leggono nel cruscotto di Pepe (o nelle analitiche della landing) filtrando
  \`utm_source=instagram\`.
- In Instagram (Statistiche) si guardano per ogni contenuto: **salvataggi e condivisioni** (contano
  più dei like per Frigolo, perché una lista condivisa è un invito), copertura, clic sul link
  nelle storie, visite al profilo.
- **Domanda alla fine della settimana 4:** chi è arrivato da Instagram e si è registrato? E ha
  invitato qualcuno? Se le persone arrivano ma non si registrano si cambia la landing, non i post.

## Calendario

| Sett. | Quando | Codice | Contenuto | Formato |
| ----- | ------ | ------ | --------- | ------- |
${cal}

## I contenuti

${sezioni}
## Prima di pubblicare, ogni volta

- [ ] Didascalia incollata da \`didascalia.txt\` (il credito musicale c'è nei Reel)
- [ ] Testo alternativo inserito (Impostazioni avanzate, Testo alternativo)
- [ ] Link nella bio ancora quello giusto, con i parametri UTM
- [ ] Per i Reel: copertina scelta dal file \`02-copertina-reel.png\`, musica "Fun Day"
- [ ] Solo trattino corto, al massimo una emoji
- [ ] Ho letto i commenti del post precedente e risposto

## Rigenerare i materiali

Immagini, didascalie e questo piano nascono da \`marketing/kit/scripts/instagram-dati.mjs\`
(testi e configurazioni) e dal modello \`marketing/kit/modelli/instagram.html\`:

\`\`\`sh
node marketing/kit/scripts/instagram.mjs            # tutto
node marketing/kit/scripts/instagram.mjs --solo S1-02   # un solo contenuto
\`\`\`

Cartella di uscita: \`PACCHETTO=/percorso\` (default: \`Frigolo published/pacchetto-instagram\`).
`
  mkdirSync(path.join(root, 'docs/comunicazione'), { recursive: true })
  writeFileSync(path.join(root, 'docs/comunicazione/piano-instagram.md'), md)
  console.log('piano scritto')
}
