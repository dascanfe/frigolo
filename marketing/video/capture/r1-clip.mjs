// Monta i fotogrammi registrati in public/clips/r1-raw.mp4 (60 fps, tempi veri)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { here } from './lib.mjs'
const FF = path.resolve(here, '../node_modules/@remotion/compositor-darwin-arm64/ffmpeg')
const dir = path.join(here, 'clips', 'r1')
const { frames, end } = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json')))
const L = []
frames.forEach((f, i) => { const n = i + 1 < frames.length ? frames[i + 1].t : end; L.push(`file '${f.file}'`, `duration ${Math.max(0.001, n - (i === 0 ? 0 : f.t)).toFixed(4)}`) })
L.push(`file '${frames.at(-1).file}'`)
fs.writeFileSync(path.join(dir, 'list.txt'), L.join('\n'))
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', 'scale=1170:2388', '-r', '60', '-fps_mode', 'cfr', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-g', '30', '-movflags', '+faststart', path.resolve(here, '../public/clips/r1-raw.mp4')], { env: { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FF) } })
