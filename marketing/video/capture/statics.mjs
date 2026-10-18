// Schermate statiche per la landing: 1170x2532 (iPhone 390x844 a 3x) con status bar iOS, tema Lampone.
// Uso: node capture/statics.mjs   (rilancia i dati demo e li lascia nello stato finale: poi rimuovi_demo + seed_dev)
import path from 'node:path'
import { newCtx, BASE, close, here } from './lib.mjs'
import { compose } from './overlay.mjs'
import { sleep, scrollTo } from './rec.mjs'
import { fresh, sql, psql } from './setup.mjs'

const OUT = path.resolve(here, '../../screenshot')
const BG = '#f8eef0'
const st = await fresh()
const open = async (user, route = '/') => {
  const ctx = await newCtx(st[user])
  const page = await ctx.newPage()
  await page.goto(BASE + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1600)
  return page
}
const snap = async (page, name) => {
  await sleep(700)
  const buf = await page.screenshot({ type: 'png' })
  await (await compose(buf, BG)).toFile(path.join(OUT, name + '.png'))
  console.log(name)
}
const btn = (page, re) => page.getByRole('button', { name: re }).first()
const yOf = (page, txt) => page.evaluate((t) => { const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.includes(t)); return h.getBoundingClientRect().top + scrollY }, txt)
const close1 = (p) => p.context().close()
const clean = () => sql(`delete from public.list_entries e using public.items i where i.id=e.item_id and i.name in ('Banane','Fragole','Kiwi','Ananas')`)

// catalogo, prima e dopo il tocco
{
  const p = await open('giulia', '/catalogo')
  await snap(p, 's02-catalogo-prima')
  for (const n of ['Banane', 'Fragole', 'Kiwi']) { await btn(p, new RegExp('^' + n)).tap(); await sleep(500) }
  await snap(p, 's02-catalogo-dopo')
  await snap(p, 's02-catalogo')
  await close1(p); clean()
}
// Giulia aggiunge l'Ananas, Lele la vede subito
{
  const pl = await open('lele', '/')
  const pg = await open('giulia', '/catalogo')
  await btn(pg, /^Ananas/).tap()
  await snap(pg, 's04-lista-giulia')
  await sleep(1200)
  await snap(pl, 's03-lista-lele')
  await close1(pg); await close1(pl); clean()
}
// lista in ordine di corsia, suggeriti, carrello, cambio lista
{
  const p = await open('giulia', '/')
  await btn(p, /Supermercato sotto casa/).tap(); await sleep(500)
  await snap(p, 's05-lista-corsia')
  await p.reload(); await sleep(1800)
  await scrollTo(p, (await yOf(p, 'Suggeriti')) - 80, 600)
  await snap(p, 's14-suggeriti')
  await p.reload(); await sleep(1800)
  for (const n of ['Mele', 'Zucchine', 'Pane']) { await btn(p, new RegExp('^' + n)).tap(); await sleep(600) }
  await scrollTo(p, 380, 500)
  await snap(p, 's06-carrello')
  sql(`update public.list_entries set status='todo' where status='cart'`)
  await close1(p)
}
{
  const p = await open('giulia', '/')
  await btn(p, /Cambia lista/).tap(); await sleep(900)
  await snap(p, 's08-cambia-lista')
  await p.getByRole('dialog').getByText('Coinquilini').first().tap(); await sleep(1500)
  await p.evaluate(() => scrollTo(0, 0))
  await snap(p, 's09-lista-coinquilini')
  await close1(p)
}
// analitiche (3 mesi)
{
  const p = await open('giulia', '/analitiche')
  await p.getByText('3m', { exact: true }).first().tap(); await sleep(1200)
  await snap(p, 's13-analitiche')
  await scrollTo(p, (await yOf(p, 'Le spese')) - 70, 500)
  await snap(p, 's13b-analitiche-spese')
  await scrollTo(p, (await yOf(p, 'Andamento')) - 70, 500)
  await snap(p, 's13c-analitiche-andamento')
  await close1(p)
}
// impostazioni: profilo e temi
{
  const p = await open('giulia', '/impostazioni')
  await snap(p, 's16-profilo-mascotte')
  await scrollTo(p, (await yOf(p, 'Tema')) - 60, 500)
  await snap(p, 's15-temi')
  await close1(p)
}
// senza rete
{
  const p = await open('giulia', '/')
  await p.context().setOffline(true); await sleep(900)
  await btn(p, /^Mele/).tap(); await sleep(700)
  await snap(p, 's17-offline')
  await p.context().setOffline(false); await sleep(1500)
  sql(`update public.list_entries set status='todo' where status='cart'`)
  await close1(p)
}
// invito ricevuto: Lele apre il link della lista Coinquilini
{
  const token = psql(['-At', '-c', `select invite_token from public.households where name='Coinquilini'`]).trim()
  const p = await open('lele', '/invito/' + token)
  await snap(p, 's12-invito')
  await close1(p)
}
// spesa finita (ultima: salva davvero la spesa)
{
  sql(`update public.list_entries set status='cart' from public.items i where i.id=item_id and i.name in ('Mele','Zucchine','Pane','Latte fresco','Uova','Yogurt bianco') and public.list_entries.household_id='d1000000-0000-4000-8000-000000000001'`)
  const p = await open('giulia', '/')
  await btn(p, /^Spesa finita/).tap(); await sleep(1500)
  await snap(p, 's07-spesa-finita')
  await btn(p, /^Conferma/).tap(); await sleep(2600)
  await snap(p, 's07b-spesa-finita-toast')
  await close1(p)
}
await close()
