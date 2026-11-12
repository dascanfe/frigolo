// Registra la lista demo mentre si spuntano i prodotti (Reel R1).
// Le animazioni dell'app sono vere, ma si registrano al rallentatore (CDP Animation.setPlaybackRate = RATE):
// cosi' lo screenshot a risoluzione piena (circa 20-25 al secondo) basta per avere oltre 60 fotogrammi al secondo
// di video. I tempi (t, in secondi di video) sono gia' riportati alla velocita' reale in frames.json.
import fs from 'node:fs'
import path from 'node:path'
import { newCtx, login, close, BASE, here } from './lib.mjs'
import { sleep } from './rec.mjs'
import { resetR1 } from './r1-setup.mjs'

const RATE = +(process.env.RATE || 0.25)
const END = +(process.env.END || 12.5)
resetR1()
const st = await login('giulia')
const ctx = await newCtx(st)
const page = await ctx.newPage()
await page.goto(BASE)
await page.waitForLoadState('networkidle').catch(() => {})
await sleep(2500)
const cdp = await ctx.newCDPSession(page)
await cdp.send('Animation.enable')
await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE })
const dir = path.join(here, 'clips', 'r1')
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
const frames = []
let running = true
const t0 = Date.now() / 1000
const worker = async () => {
  while (running) {
    const a = Date.now() / 1000
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 }).catch(() => null)
    if (!buf) break
    const t = ((a + Date.now() / 1000) / 2 - t0) * RATE
    const file = path.join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`)
    fs.writeFileSync(file, buf)
    frames.push({ file, t })
  }
}
const loop = Promise.all([worker(), worker(), worker()])
const at = async (s) => { const w = (s / RATE) * 1000 - (Date.now() / 1000 - t0) * 1000; if (w > 0) await sleep(w) }
const tap = (name) => page.getByRole('button', { name: new RegExp('^' + name) }).first().tap()
const marks = {}
const T = JSON.parse(process.env.T || '{"Mele":0.5,"Pane":3.6,"Latte":4.6,"Uova":5.4,"Pasta":7.4}')
for (const [n, s] of Object.entries(T)) { await at(s); marks[n] = +((Date.now() / 1000 - t0) * RATE).toFixed(3); await tap(n) }

await at(END)
running = false; await loop
frames.sort((a, b) => a.t - b.t)
fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({ frames, marks, end: END }))
console.log(frames.length, 'frames', (frames.length / END).toFixed(1), 'fps video', JSON.stringify(marks))
await close()
