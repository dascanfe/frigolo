// Schermate per il carosello S3-03 e le storie "Come funziona" (app 2.2.3, senza menu in basso).
// Uso: BASE=http://127.0.0.1:5180 node capture/schermate-ig.mjs [analitiche|temi|home|storie]
import path from 'node:path'
import { newCtx, BASE, close, here } from './lib.mjs'
import { compose } from './overlay.mjs'
import { sleep, scrollTo } from './rec.mjs'
import { fresh, sql } from './setup.mjs'

const OUT = path.resolve(here, '../../screenshot')
const BG = '#f8eef0'
const quali = process.argv.slice(2)
const vuole = (k) => !quali.length || quali.includes(k)
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
  const buf = await page.screenshot({ type: 'png' })
  await (await compose(buf, BG)).toFile(path.join(OUT, name + '.png'))
  console.log(name)
}
const btn = (page, re) => page.getByRole('button', { name: re }).first()
const yOf = (page, txt) => page.evaluate((t) => { const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.includes(t)); return h ? h.getBoundingClientRect().top + scrollY : null }, txt)
const close1 = (p) => p.context().close()

if (vuole('analitiche')) {
  // dalla home, toccando gli avatar
  const p = await open('giulia', '/')
  await p.getByRole('link', { name: /^Analitiche della lista/ }).first().tap()
  await p.waitForURL('**/analitiche'); await sleep(1500)
  const h = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3')].map((e) => e.textContent.trim()))
  console.log(h)
  await p.getByText('3m', { exact: true }).first().tap(); await sleep(1500)
  await snap(p, 'g01-analitiche')
  for (const [k, txt] of [['g02-analitiche-andamento', 'Andamento'], ['g03-analitiche-chi', 'Chi mette']]) {
    const y = await yOf(p, txt)
    if (y != null) { await scrollTo(p, y - 70, 500); await snap(p, k) }
  }
  await close1(p)
}
if (vuole('home')) {
  const p = await open('giulia', '/')
  await snap(p, 'g10-home')
  const y = await yOf(p, 'Gli ultimi acquisti')
  console.log('ultimi', y)
  await scrollTo(p, y - 80, 600)
  await snap(p, 'g11-ultimi-acquisti')
  await close1(p)
}
if (vuole('temi')) {
  const p = await open('giulia', '/')
  await p.getByRole('link', { name: /impostazioni/i }).first().tap()
  await sleep(1500)
  await snap(p, 'g20-impostazioni')
  // si inquadra solo la scelta del tema: niente prodotti personalizzati, niente sezione App
  await p.evaluate(() => {
    const h = [...document.querySelectorAll('h2,h3')].find((e) => e.textContent.trim() === 'Tema')
    const main = document.querySelector('main')
    let row = h
    while (row.parentElement !== main) row = row.parentElement
    const kids = [...main.children]
    const k = kids.indexOf(row)
    kids.forEach((c, n) => { if (n > 0 && n !== k && n !== k + 1) c.style.display = 'none' })
    ;[row, kids[k + 1]].forEach((c) => { c.style.zoom = '1.2' })
    kids[k].style.marginTop = '12px'
    window.scrollTo(0, 0)
  })
  await sleep(500)
  await snap(p, 'g21-temi')
  await close1(p)
}
// pulizie solo sulle liste demo (id d1000000-...), mai sulle liste vere
const DEMO = `e.household_id::text like 'd1000000-%'`
const clean = () => sql(`delete from public.list_entries e using public.items i where i.id=e.item_id and ${DEMO} and i.name in ('Albicocche','Arance','Banane','Ananas')`)
if (vuole('storie')) {
  {
    const p = await open('giulia', '/catalogo')
    for (const n of ['Albicocche', 'Arance', 'Banane']) { await btn(p, new RegExp('^' + n)).tap(); await sleep(500) }
    await p.getByRole('group', { name: 'Filtra per categoria' }).getByRole('button', { name: /^Frutta/ }).tap()
    await sleep(3500)
    await snap(p, 'h01-catalogo-dopo')
    await close1(p); clean()
  }
  {
    const pg = await open('giulia', '/catalogo')
    await btn(pg, /^Ananas/).tap()
    await sleep(1200)
    const pl = await open('lele', '/')
    await snap(pl, 'h02-lista-lele')
    await close1(pg); await close1(pl); clean()
  }
  {
    const p = await open('giulia', '/')
    await btn(p, /Supermercato sotto casa/).tap(); await sleep(600)
    await snap(p, 'h03-lista-corsia')
    await close1(p)
  }
  {
    const p = await open('giulia', '/')
    for (const n of ['Mele', 'Zucchine', 'Pane']) { await btn(p, new RegExp('^' + n)).tap(); await sleep(600) }
    await scrollTo(p, 380, 500)
    await snap(p, 'h04-carrello')
    await close1(p)
    sql(`update public.list_entries e set status='todo' where status='cart' and ${DEMO}`)
  }
  {
    sql(`update public.list_entries e set status='cart' from public.items i where i.id=e.item_id and ${DEMO} and i.name in ('Mele','Zucchine','Pane','Latte fresco','Uova','Yogurt bianco')`)
    const q = await open('giulia', '/')
    await btn(q, /^Spesa finita/).tap(); await sleep(1500)
    await snap(q, 'h05-spesa-finita')
    await close1(q)
    sql(`update public.list_entries e set status='todo' where status='cart' and ${DEMO}`)
  }
}
await close()
