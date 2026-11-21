// Schermate per i caroselli d'inverno (app 2.2.3): Ispirazioni (novembre e dicembre) e la lista "Cenone" (C2).
// Uso: BASE=http://127.0.0.1:5180 node capture/schermate-inverno.mjs [ispirazioni|cenone]
// Tocca solo i dati demo (id d1000000-..., utenti *.test): la lista di prova di Daniele non si tocca.
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
const open = async (user, route = '/', { mese } = {}) => {
  const ctx = await newCtx(st[user])
  if (mese) await ctx.addInitScript((m) => { Date.prototype.getMonth = () => m }, mese - 1)
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
const yOf = (page, txt) => page.evaluate((t) => { const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.trim().startsWith(t)); return h ? h.getBoundingClientRect().top + scrollY : null }, txt)
const bye = (p) => p.context().close()
const CENONE = 'd1000000-0000-4000-8000-000000000003'
const LELE = 'd0000000-0000-4000-8000-000000000004'
const LUCA = 'd0000000-0000-4000-8000-000000000002'
const MARTA = 'd0000000-0000-4000-8000-000000000003'

if (vuole('ispirazioni')) {
  for (const [mese, nome, piatto, tocchi] of [
    [11, 'i01-ispirazioni-novembre-piatti', 'Pasta e fagioli', ['Fagioli in scatola', 'Sedano', 'Carote']],
    [12, 'i02-ispirazioni-dicembre-piatti', 'Tortellini in brodo', ['Tortellini', 'Dado da brodo']],
  ]) {
    const p = await open('giulia', '/ispirazioni', { mese })
    const y = await yOf(p, piatto)
    await scrollTo(p, y - 125, 500)
    for (const n of tocchi) { await btn(p, new RegExp('^' + n)).tap(); await sleep(500) }
    await snap(p, nome)
    for (const n of tocchi) { await btn(p, new RegExp('^' + n)).tap().catch(() => {}); await sleep(300) }
    await bye(p)
  }
  // pagina in cima di dicembre
  const p = await open('giulia', '/ispirazioni', { mese: 12 })
  await snap(p, 'i03-ispirazioni-dicembre')
  await bye(p)
}

if (vuole('cenone')) {
  // 1. nuova lista
  let p = await open('lele', '/')
  await btn(p, /Casa/).tap(); await sleep(800)
  await btn(p, /Nuova lista/).tap(); await sleep(600)
  await p.locator('input').last().fill('Cenone'); await sleep(500)
  await snap(p, 'c2-1-nuova-lista')
  await bye(p)
  // la lista "Cenone" nasce solo con Lele
  sql(`insert into public.households (id, name) values ('${CENONE}', 'Cenone')`)
  sql(`insert into public.household_members (household_id, user_id) values ('${CENONE}', '${LELE}')`)
  // 2. invito
  p = await open('lele', '/')
  await btn(p, /Casa/).tap(); await sleep(800)
  await p.getByRole('button', { name: /^Cenone/ }).first().tap(); await sleep(1500)
  await p.getByRole('link', { name: /impostazioni/i }).first().tap(); await sleep(1500)
  const y = await yOf(p, 'Cenone')
  await scrollTo(p, y - 60, 500)
  await snap(p, 'c2-2-invito')
  await bye(p)
  // 3. entrano gli altri e ognuno aggiunge
  sql(`insert into public.household_members (household_id, user_id) values ('${CENONE}', '${LUCA}'), ('${CENONE}', '${MARTA}')`)
  sql(`insert into public.list_entries (household_id, item_id, quantity, status, added_by, added_at)
    select '${CENONE}', i.id, v.q, 'todo', v.who::uuid, now() - (v.ord || ' minutes')::interval
    from (values
      ('Tortellini', 2, '${LELE}', 1), ('Baccalà', 1, '${LUCA}', 2), ('Panettone', 1, '${MARTA}', 3),
      ('Mascarpone', 2, '${MARTA}', 4), ('Lenticchie', 1, '${LUCA}', 5), ('Cotechino', 1, '${LELE}', 6),
      ('Arance', 2, '${MARTA}', 7), ('Olive', 1, '${LUCA}', 8), ('Uova', 6, '${LELE}', 9)
    ) v(name, q, who, ord)
    join public.items i on i.name = v.name and i.household_id is null`)
  p = await open('lele', '/', { mese: 12 })
  await btn(p, /Casa/).tap(); await sleep(800)
  await p.getByRole('button', { name: /^Cenone/ }).first().tap(); await sleep(5500)
  await snap(p, 'c2-3-lista-cenone')
  // 4. al supermercato si segna
  for (const n of ['Tortellini', 'Baccalà', 'Panettone', 'Uova']) { await btn(p, new RegExp('^' + n)).tap(); await sleep(600) }
  await scrollTo(p, 200, 500)
  await snap(p, 'c2-4-carrello')
  await bye(p)
}
// pulizia: il database demo torna come dopo dati_demo.sql
sql(`delete from public.households where id = '${CENONE}'`)
await close()
