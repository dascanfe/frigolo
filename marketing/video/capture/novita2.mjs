// Ripresa di due schermate del carosello "Novità 2.2" (vedi novita.mjs)
import path from 'node:path'
import { newCtx, BASE, close, here } from './lib.mjs'
import { compose } from './overlay.mjs'
import { sleep, scrollTo } from './rec.mjs'
import { fresh, sql } from './setup.mjs'

const OUT = path.resolve(here, '../../screenshot')
const st = await fresh()
const open = async (route) => {
  const ctx = await newCtx(st.giulia)
  const page = await ctx.newPage()
  await page.goto(BASE + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
  return page
}
const snap = async (page, name, wait = 700) => {
  await sleep(wait)
  const buf = await page.screenshot({ type: 'png', animations: 'allow' })
  await (await compose(buf, '#f8eef0')).toFile(path.join(OUT, name + '.png'))
  console.log(name)
}
{
  const p = await open('/')
  await scrollTo(p, 150, 400)
  await p.getByRole('button', { name: /^Pane/ }).first().tap()
  await sleep(60)
  // si fermano solo le tile: il resto (bottone Spesa finita) finisce la sua animazione
  await p.evaluate(() => {
    for (const a of document.getAnimations()) {
      const el = a.effect?.target
      if (el instanceof Element && el.closest('.tile')) { a.pause(); a.currentTime = 360 }
    }
  })
  await snap(p, 'n06-volo', 900)
  await p.context().close()
  sql(`update public.list_entries set status='todo' where status='cart'`)
}
{
  const p = await open('/')
  await p.evaluate(() => { const a = document.querySelector('a[href="/ispirazioni"]'); scrollTo(0, a.getBoundingClientRect().top + scrollY - 420) })
  await snap(p, 'n07-prendi-ispirazione')
  await p.context().close()
}
await close()
