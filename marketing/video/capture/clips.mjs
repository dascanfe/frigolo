// Registra le clip del video sull'app vera (locale, dati demo, tema Lampone).
// Uso: node capture/clips.mjs [nome ...]   (senza nomi: tutte)
import { newCtx, BASE, close } from './lib.mjs'
import { startRec, stopRec, tap, scrollTo, sleep } from './rec.mjs'
import { fresh, sql } from './setup.mjs'

const only = process.argv.slice(2)
const want = (n) => !only.length || only.includes(n)
const st = await fresh()
const open = async (user, route = '/') => {
  const ctx = await newCtx(st[user], 'lampone', 2)
  const page = await ctx.newPage()
  await page.goto(BASE + route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(1500)
  return page
}
const btn = (page, re) => page.getByRole('button', { name: re }).first()

async function single(name, user, route, fn) {
  const page = await open(user, route)
  const rec = await startRec(page, name)
  const T0 = Date.now() / 1000
  await sleep(900)
  await fn(page, rec)
  const meta = await stopRec(rec, T0)
  console.log(name, meta.dur, 's', meta.taps.length, 'tocchi')
  await page.context().close()
}

if (want('catalogo')) {
  await single('catalogo', 'giulia', '/catalogo', async (p, r) => {
    for (const n of ['Banane', 'Fragole', 'Kiwi']) { await tap(r, btn(p, new RegExp('^' + n)), { label: n }); await sleep(800) }
    await sleep(500)
  })
  sql(`delete from public.list_entries e using public.items i where i.id=e.item_id and i.name in ('Banane','Fragole','Kiwi')`)
}

if (want('due')) {
  const pg = await open('giulia', '/catalogo')
  const pl = await open('lele', '/')
  const rg = await startRec(pg, 'due-giulia')
  const rl = await startRec(pl, 'due-lele')
  const T0 = Date.now() / 1000
  await sleep(2200)
  await tap(rg, btn(pg, /^Ananas/), { label: 'Ananas' })
  await sleep(3800)
  console.log('due-giulia', (await stopRec(rg, T0)).dur, 'due-lele', (await stopRec(rl, T0)).dur)
  await pg.context().close(); await pl.context().close()
  sql(`delete from public.list_entries e using public.items i where i.id=e.item_id and i.name='Ananas'`)
}

if (want('corsia')) {
  await single('corsia', 'giulia', '/', async (p, r) => {
    await tap(r, btn(p, /Supermercato sotto casa/), { label: 'store' })
    await sleep(800)
    await scrollTo(p, 330, 1400)
    await sleep(900)
  })
}

if (want('carrello')) {
  await single('carrello', 'giulia', '/', async (p, r) => {
    for (const n of ['Mele', 'Zucchine', 'Pane']) { await tap(r, btn(p, new RegExp('^' + n)), { label: n }); await sleep(800) }
    await sleep(300)
    await scrollTo(p, 380, 1100)
    await sleep(1300)
  })
  sql(`update public.list_entries set status='todo' where status='cart'`)
}

if (want('analitiche')) {
  await single('analitiche', 'giulia', '/analitiche', async (p, r) => {
    await tap(r, p.getByRole('tab', { name: '3m' }).or(btn(p, /^3m/)).first(), { label: '3m' })
    await sleep(500)
    const y = async (txt) => p.evaluate((t) => { const h = [...document.querySelectorAll('h2,h3')].find((e) => e.textContent.includes(t)); return h ? h.getBoundingClientRect().top + scrollY - 70 : 0 }, txt)
    await scrollTo(p, await y('Le spese'), 1100); await sleep(900)
    await scrollTo(p, await y('Andamento'), 1200); await sleep(1200)
  })
}

if (want('temi')) {
  await single('temi', 'giulia', '/impostazioni', async (p, r) => {
    const y = await p.evaluate(() => { const h = [...document.querySelectorAll('h2,h3')].find((e) => e.textContent.trim().startsWith('Tema')); return h.getBoundingClientRect().top + scrollY - 60 })
    await scrollTo(p, y, 1100); await sleep(500)
    for (const [n, id] of [['Mare', 'mare'], ['Basilico', 'basilico'], ['Liquirizia', 'liquirizia'], ['Lampone', 'lampone']]) {
      await tap(r, p.getByRole('radio', { name: new RegExp(n) }), { label: id }); await sleep(900)
    }
    await sleep(400)
  })
}

if (want('liste')) {
  await single('liste', 'giulia', '/', async (p, r) => {
    await tap(r, btn(p, /Cambia lista/), { label: 'titolo' }); await sleep(1100)
    await tap(r, p.getByRole('dialog').getByText('Coinquilini').first(), { label: 'Coinquilini' }); await sleep(1500)
  })
}

if (want('finita')) {
  sql(`update public.list_entries set status='cart' from public.items i where i.id=item_id and i.name in ('Mele','Zucchine','Pane','Latte fresco','Uova','Yogurt bianco') and public.list_entries.household_id='d1000000-0000-4000-8000-000000000001'`)
  await single('finita', 'giulia', '/', async (p, r) => {
    await tap(r, btn(p, /^Spesa finita/), { label: 'fab' }); await sleep(1300)
    await tap(r, btn(p, /^Conferma/), { label: 'conferma' }); await sleep(2600)
  })
}
await close()
