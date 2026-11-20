// Schermate di Ispirazioni con "Come si fa" aperto (app 2.4.0), per i caroselli C1 e C6. Sola lettura: non tocca i dati.
// Uso: BASE=http://127.0.0.1:5180 node schermate-comesifa.mjs  (serve .state-giulia.json, creato da lib.login)
import path from 'node:path'
import { newCtx, BASE, close, here } from './lib.mjs'
import { compose } from './overlay.mjs'
import { sleep, scrollTo } from './rec.mjs'

const OUT = path.resolve(here, '../../screenshot')
const state = path.join(here, '.state-giulia.json')
for (const [mese, nome, piatto] of [
  [11, 'i04-ispirazioni-novembre-comesifa', 'Pasta e fagioli'],
  [12, 'i05-ispirazioni-dicembre-comesifa', 'Tortellini in brodo'],
]) {
  const ctx = await newCtx(state)
  await ctx.addInitScript((m) => { Date.prototype.getMonth = () => m }, mese - 1)
  const page = await ctx.newPage()
  await page.goto(BASE + '/ispirazioni')
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
  const y = await page.evaluate((t) => { const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.trim().startsWith(t)); return h ? h.getBoundingClientRect().top + scrollY : null }, piatto)
  await scrollTo(page, y - 125, 500)
  await page.getByRole('button', { name: new RegExp('Come si fa.*' + piatto) }).first().tap()
  await sleep(1200)
  await (await compose(await page.screenshot({ type: 'png' }), '#f8eef0')).toFile(path.join(OUT, nome + '.png'))
  console.log(nome)
  await ctx.close()
}
await close()
