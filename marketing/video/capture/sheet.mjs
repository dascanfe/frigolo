// Foglio di fotogrammi di un clip: node capture/sheet.mjs nome [n]
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { here } from './lib.mjs'
const [name, n = '8'] = process.argv.slice(2)
const FF = path.resolve(here, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg')
const meta = JSON.parse(fs.readFileSync(path.resolve(here, '../src/clips.json'), 'utf8'))[name]
const tmp = '/tmp/sheet-' + name; fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp)
const N = +n, files = []
for (let i = 0; i < N; i++) {
  const t = (meta.dur * (i + 0.5)) / N
  const f = path.join(tmp, `f${i}.png`)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', t.toFixed(2), '-i', path.resolve(here, `../public/clips/${name}.mp4`), '-frames:v', '1', f], { env: { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FF) } })
  files.push(await sharp(f).resize(300).toBuffer())
}
const h = (await sharp(files[0]).metadata()).height
await sharp({ create: { width: 300 * N, height: h, channels: 3, background: '#888' } }).composite(files.map((b, i) => ({ input: b, left: i * 300, top: 0 }))).jpeg({ quality: 80 }).toFile(`/tmp/sheet-${name}.jpg`)
