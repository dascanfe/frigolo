// Esporta il piano Instagram in JSON per il file Numbers (vedi crea.js)
//   node esporta.mjs <repo> <pacchetto-instagram> <uscita.json>
import fs from 'node:fs'
import path from 'node:path'
const [repo, pacchetto, out] = process.argv.slice(2)
const { CONTENUTI, PAGINA } = await import(path.join(repo, 'marketing/kit/scripts/instagram-dati.mjs'))
const { RACCOLTE } = await import(path.join(repo, 'marketing/kit/scripts/storie-pagina-dati.mjs'))
const giorni = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const fmt = (d) => { const x = new Date(d + 'T12:00:00'); return `${giorni[x.getDay()]} ${x.getDate()} ${mesi[x.getMonth()]}` }
const leggi = (f) => { try { return fs.readFileSync(f, 'utf8').trim() } catch { return '' } }
const post = CONTENUTI.map((c) => ({
  data: c.data ? fmt(c.data) : '', ora: c.ora, codice: c.id.slice(0, 5), titolo: c.titolo,
  formatoBreve: c.formato.replace(/\s*\(.*\)/, '').replace(/,\s*/, ' · '),
  doveBreve: /storie/i.test(c.formato) ? 'Profilo + menzione' : 'Profilo + collab',
  evidenzaBreve: c.evidenza || '',
  notaBreve: /4:5/.test(c.formato) ? 'Formato 4:5' : '',
  didascalia: leggi(path.join(pacchetto, c.id, 'didascalia.txt')),
}))
const storie = RACCOLTE.map((r) => ({
  raccolta: r.nome, n: String(r.storie.length), cartella: `00-storie-pagina/${r.cartella}`,
  quandoBreve: r.quando.replace(/\s*\(.*?\)/g, '').split(',').slice(0, 2).join(',').trim(),
}))
fs.writeFileSync(out, JSON.stringify({ post, storie, pagina: PAGINA }))
console.log(`esportati ${post.length} contenuti e ${storie.length} raccolte`)
