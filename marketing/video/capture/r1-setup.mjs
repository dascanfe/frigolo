// Prepara la lista demo "Casa" per il Reel R1: 6 prodotti da comprare, carrello vuoto. Tocca SOLO la lista demo (id d1000000-...).
import { sql } from './setup.mjs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { here } from './lib.mjs'
const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
export function resetR1() {
  execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', '-f', path.resolve(here, '../../demo/dati_demo.sql')], { stdio: 'ignore' })
  sql(`delete from public.list_entries where household_id='d1000000-0000-4000-8000-000000000001' and item_id not in (select id from public.items where name in ('Mele','Pane','Latte fresco','Uova','Pasta'))`)
  sql(`update public.list_entries set status='todo', note=null, quantity=case when item_id in (select id from public.items where name in ('Latte fresco','Uova','Pasta')) then quantity else 1 end where household_id='d1000000-0000-4000-8000-000000000001'`)
}
if (process.argv[1].endsWith('r1-setup.mjs')) { resetR1(); console.log(sql(`select count(*) from public.list_entries where household_id='d1000000-0000-4000-8000-000000000001'`)) }
