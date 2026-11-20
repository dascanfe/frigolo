// Scontrini veri dall'app 2.3.0 (dev server locale, account demo): salva i PNG 1080x1920 dell'anteprima e le schermate per il carosello.
// Uso: BASE=http://localhost:5180 node capture/scontrino.mjs
// Non modifica i dati: apre solo Analitiche e "Crea lo scontrino".
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { newCtx, BASE, close, login, here } from './lib.mjs'

const PAC = path.join(os.homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Works/Frigolo published/pacchetto-instagram')
const PROVA = path.join(PAC, '0-profilo/scontrini-di-prova')
const SHOT = path.resolve(here, '../../screenshot')
const MEDIA = path.resolve(here, '../../kit/media-scontrino')
fs.mkdirSync(MEDIA, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stato = {}
for (const u of ['giulia', 'marta']) stato[u] = await login(u)

/** apre le analitiche, sceglie periodo, sfondo e nomi, salva il PNG dell'anteprima */
async function scontrino({ user, periodo, sfondo, nomi = true, dest, tema = 'autunno', schermate, lista }) {
  const ctx = await newCtx(stato[user], tema)
  if (lista) await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v) } catch {} }, [`frigolo:current-list:${lista[0]}`, lista[1]])
  const page = await ctx.newPage()
  await page.goto(BASE + '/analitiche')
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
  await page.getByRole('radio', { name: periodo }).click()
  await sleep(400)
  if (schermate) {
    await page.screenshot({ path: path.join(MEDIA, schermate + '-scheda.png') })
  }
  await page.getByRole('button', { name: /Crea lo scontrino/ }).tap()
  await sleep(1500)
  if (sfondo) { await page.getByRole('radio', { name: sfondo, exact: true }).click(); await sleep(800) }
  if (!nomi) { await page.getByRole('switch').click(); await sleep(800) }
  await page.waitForFunction(() => [...document.images].some((i) => i.src.startsWith('blob:') && i.naturalWidth === 1080), null, { timeout: 15000 })
  await sleep(600)
  if (schermate) await page.screenshot({ path: path.join(MEDIA, schermate + '-foglio.png') })
  const b64 = await page.evaluate(async () => {
    const img = [...document.images].find((i) => i.src.startsWith('blob:') && i.naturalWidth === 1080)
    const blob = await (await fetch(img.src)).blob()
    return await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result.split(',')[1]); f.readAsDataURL(blob) })
  })
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'))
  console.log(path.relative(PAC, dest))
  await ctx.close()
}

const J = (f) => path.join(PROVA, f)
const quali = process.argv.slice(2)
const vuole = (k) => !quali.length || quali.includes(k)
if (vuole('prova')) {
  for (const f of fs.readdirSync(PROVA)) if (f.endsWith('.png')) fs.rmSync(J(f))
  await scontrino({ user: 'giulia', periodo: /Novembre/, sfondo: 'Autunno', dest: J('1-novembre-casa-con-nomi-autunno.png'), schermate: 'giulia' })
  await scontrino({ user: 'giulia', periodo: /Novembre/, sfondo: 'Mare', dest: J('2-novembre-casa-mare.png') })
  await scontrino({ user: 'giulia', periodo: /Tutto il 2026/, sfondo: 'Lampone', dest: J('3-anno-2026-casa-lampone.png'), schermate: 'anno' })
  await scontrino({ user: 'marta', lista: ['d0000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003'], periodo: /Novembre/, sfondo: 'Basilico', nomi: false, dest: J('4-lista-da-sola-senza-nomi-basilico.png') })
}
if (vuole('extra')) {
  for (const t of ['Autunno', 'Basilico', 'Mare', 'Prugna', 'Lampone', 'Liquirizia'])
    await scontrino({ user: 'giulia', periodo: /Novembre/, sfondo: t, dest: path.join(MEDIA, `nov-${t.toLowerCase()}.png`) })
  await scontrino({ user: 'giulia', periodo: /Novembre/, sfondo: 'Autunno', nomi: false, dest: path.join(MEDIA, 'nov-autunno-senza-nomi.png') })
  await scontrino({ user: 'giulia', periodo: /Tutto il 2026/, sfondo: 'Autunno', dest: path.join(MEDIA, 'anno-autunno.png') })
  await scontrino({ user: 'giulia', periodo: /Tutto il 2026/, sfondo: 'Mare', dest: path.join(MEDIA, 'anno-mare.png') })
}
await close()
