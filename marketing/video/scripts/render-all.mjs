// Render finale: MP4 9:16, 16:9, 15 s, WebM VP9 16:9 e poster JPG in out/.
// Uso: npm run assets && npm run render   (oppure: node scripts/render-all.mjs 15s)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

fs.mkdirSync('out', { recursive: true })
const R = (id, file, args = []) => execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, `out/${file}`, ...args], { stdio: 'inherit' })
const S = (id, file, frame) => execFileSync('npx', ['remotion', 'still', 'src/index.ts', id, `out/${file}`, `--frame=${frame}`, '--jpeg-quality=88'], { stdio: 'inherit' })
const only = process.argv[2]
const jobs = {
  '9x16': () => { R('Frigolo9x16', 'frigolo-lancio-9x16.mp4', ['--codec=h264', '--crf=26']); S('Frigolo9x16', 'frigolo-lancio-9x16-poster.jpg', 790) },
  '16x9': () => { R('Frigolo16x9', 'frigolo-lancio-16x9.mp4', ['--codec=h264', '--crf=26']); S('Frigolo16x9', 'frigolo-lancio-16x9-poster.jpg', 790); R('Frigolo16x9', 'frigolo-lancio-16x9.webm', ['--codec=vp9', '--crf=38']) },
  '15s': () => { R('Frigolo15s', 'frigolo-lancio-15s.mp4', ['--codec=h264', '--crf=26']); S('Frigolo15s', 'frigolo-lancio-15s-poster.jpg', 310) },
}
for (const [k, f] of Object.entries(jobs)) if (!only || only === k) f()
