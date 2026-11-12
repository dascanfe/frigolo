// Registra uno schermo con lo screencast di Chrome (fotogrammi a risoluzione piena) e lo trasforma in MP4 a 30 fps.
// I tocchi si fanno con tap(): finiscono nel JSON del clip con tempo e posizione (px css su 390x844).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { here, VW, VH } from './lib.mjs'

const FF = path.resolve(here, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg')
export const OUT = path.resolve(here, '../public/clips')
export const META = path.resolve(here, '../src/clips.json')
const STATUS_H = 48
fs.mkdirSync(OUT, { recursive: true })

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function startRec(page, name) {
  const dir = path.join(here, 'clips', name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const cdp = await page.context().newCDPSession(page)
  const frames = []
  const rec0 = { running: true }
  const worker = async () => {
    while (rec0.running) {
      const t1 = Date.now() / 1000
      const buf = await page.screenshot({ type: 'jpeg', quality: 90 }).catch(() => null)
      if (!buf) break
      const t = (t1 + Date.now() / 1000) / 2
      const file = path.join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`)
      fs.writeFileSync(file, buf)
      frames.push({ file, t })
      const wait = 0 - (Date.now() / 1000 - t1) * 1000
      if (wait > 1) await sleep(wait)
    }
  }
  const loop = Promise.all([worker(), worker(), worker()])
  return { name, dir, cdp, frames, rec0, loop, taps: [], t0: null, page }
}

/** Tocco vero (touchscreen) sulla posizione del centro dell'elemento, registrato per il montaggio */
export async function tap(rec, locator, opts = {}) {
  await locator.scrollIntoViewIfNeeded().catch(() => {})
  const b = await locator.boundingBox()
  const x = b.x + b.width / 2 + (opts.dx ?? 0)
  const y = b.y + b.height / 2 + (opts.dy ?? 0)
  rec.taps.push({ t: Date.now() / 1000, x: +x.toFixed(1), y: +(y + STATUS_H).toFixed(1), label: opts.label })
  await rec.page.touchscreen.tap(x, y)
}

/** Scorrimento morbido della pagina (come un dito che trascina) */
export async function scrollTo(page, y, ms = 1200) {
  await page.evaluate(([target, dur]) => new Promise((res) => {
    const from = window.scrollY, t0 = performance.now()
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur)
      window.scrollTo(0, from + (target - from) * ease(t))
      t < 1 ? requestAnimationFrame(step) : res()
    }
    requestAnimationFrame(step)
  }), [y, ms])
}

export async function stopRec(rec, T0) {
  const endT = Date.now() / 1000
  rec.rec0.running = false
  await rec.loop
  const fr = rec.frames.sort((a, b) => a.t - b.t)
  if (!fr.length) throw new Error('nessun fotogramma: ' + rec.name)
  const start = Math.min(T0 ?? fr[0].t, fr[0].t)
  const lines = []
  fr.forEach((f, i) => {
    const next = i + 1 < fr.length ? fr[i + 1].t : endT
    const from = i === 0 ? start : f.t
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - from).toFixed(4)}`)
  })
  lines.push(`file '${fr[fr.length - 1].file}'`)
  const list = path.join(rec.dir, 'list.txt')
  fs.writeFileSync(list, lines.join('\n'))
  const out = path.join(OUT, `${rec.name}.mp4`)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-r', '30', '-fps_mode', 'cfr', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], {
    env: { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FF) },
  })
  const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {}
  meta[rec.name] = {
    dur: +(endT - start).toFixed(3),
    taps: rec.taps.map((t) => ({ t: +(t.t - start).toFixed(3), x: t.x, y: t.y, label: t.label })),
  }
  fs.writeFileSync(META, JSON.stringify(meta, null, 1))
  return meta[rec.name]
}
