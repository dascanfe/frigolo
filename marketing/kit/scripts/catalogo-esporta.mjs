// Legge il catalogo base da supabase/seed.sql e scrive dati/catalogo.json (nome, categoria, icona, mesi).
//   node marketing/kit/scripts/catalogo-esporta.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const sql = readFileSync(path.join(root, 'supabase/seed.sql'), 'utf8')
const re = /\('([a-z-]+)',\s*'((?:[^']|'')+)',\s*'(\w+)',\s*'(\w+)',\s*'\{([\d,]*)\}'\)/g
const out = []
for (const m of sql.matchAll(re))
  out.push({ cat: m[1], nome: m[2].replace(/''/g, "'"), icona: m[3], mesi: m[5] ? m[5].split(',').map(Number) : [] })
writeFileSync(path.join(root, 'marketing/kit/scripts/dati/catalogo.json'), JSON.stringify(out, null, 0))
console.log(out.length, 'prodotti')
