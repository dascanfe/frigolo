import { createServer } from 'vite'
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
// Esporta le icone dell'app (lucide + custom) come SVG in dati/icone.json e le Ispirazioni in dati/mesi.json.
//   node marketing/kit/scripts/icone-esporta.mjs
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ICONS } = await server.ssrLoadModule('/src/lib/icons.ts')
const out = {}
for (const [k, C] of Object.entries(ICONS))
  out[k] = renderToStaticMarkup(React.createElement(C, { size: 24, strokeWidth: 2 }))
writeFileSync(path.join(root, 'marketing/kit/scripts/dati/icone.json'), JSON.stringify(out))
console.log(Object.keys(out).length, 'icone')
const { MESI } = await server.ssrLoadModule('/src/features/inspiration/mesi.ts')
writeFileSync(path.join(root, 'marketing/kit/scripts/dati/mesi.json'), JSON.stringify(MESI))
console.log(MESI.length, 'mesi')
await server.close()
