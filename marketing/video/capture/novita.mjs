// Schermate per il carosello "Novità 2.2": home nuova, catalogo, Ispirazioni, ultimi acquisti e
// due fotogrammi fermati a metà animazione (riempimento liquido e prodotto che vola nel carrello).
// Uso: BASE=http://127.0.0.1:5180 node capture/novita.mjs   (poi psql -f demo/rimuovi_demo.sql)
import path from 'node:path'
import { newCtx, BASE, close, here } from './lib.mjs'
import { compose } from './overlay.mjs'
import { sleep, scrollTo } from './rec.mjs'
import { fresh, sql } from './setup.mjs'

const OUT = path.resolve(here, '../../screenshot')
const BG = '#f8eef0'
const st = await fresh()
const open = async (user, route = '/') => {
  const ctx = await newCtx(st[user])
  const page = await ctx.newPage()
  await page.goto(BASE + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1800)
  return page
}
const snap = async (page, name, wait = 700) => {
  await sleep(wait)
  const buf = await page.screenshot({ type: 'png', animations: 'allow' })
  await (await compose(buf, BG)).toFile(path.join(OUT, name + '.png'))
  console.log(name)
}
const btn = (page, re) => page.getByRole('button', { name: re }).first()
const yOf = (page, txt) => page.evaluate((t) => { const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.includes(t)); return h.getBoundingClientRect().top + scrollY }, txt)
const freeze = (page, ms) => page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t }), ms)
const close1 = (p) => p.context().close()

{
  const p = await open('giulia', '/')
  await snap(p, 'n01-home')
  await scrollTo(p, (await yOf(p, 'Gli ultimi acquisti')) - 300, 600)
  await snap(p, 'n04-ultimi-acquisti')
  await close1(p)
}
{
  const p = await open('giulia', '/catalogo')
  await p.getByRole('group', { name: 'Filtra per categoria' }).getByRole('button', { name: /^Pesce/ }).tap()
  // lo scorrimento morbido fino al Pesce dura circa 2,5 s
  await sleep(3500)
  await snap(p, 'n02-catalogo-pesce')
  // riempimento liquido fermato a metà
  await btn(p, /^Orata/).tap()
  await sleep(40)
  await freeze(p, 360)
  await snap(p, 'n05-liquido', 300)
  await close1(p)
  sql(`delete from public.list_entries e using public.items i where i.id=e.item_id and i.name='Orata'`)
}
{
  const p = await open('giulia', '/ispirazioni')
  await snap(p, 'n03-ispirazioni')
  await close1(p)
}
{
  // prodotto che vola nel carrello, fermato a metà volo
  const p = await open('giulia', '/')
  await scrollTo(p, 150, 400)
  await btn(p, /^Pane/).tap()
  await sleep(60)
  await freeze(p, 330)
  await snap(p, 'n06-volo', 300)
  await close1(p)
  sql(`update public.list_entries set status='todo' where status='cart' and household_id in (select household_id from public.household_members m join auth.users u on u.id=m.user_id where u.email like 'giulia@%')`)
}
await close()
