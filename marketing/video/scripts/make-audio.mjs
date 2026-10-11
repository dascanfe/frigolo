// Sintetizza i suoni di tocco (nessun file di terzi): tic, plin, tada.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/audio')
fs.mkdirSync(out, { recursive: true })
const SR = 44100

function wav(name, samples) {
  const buf = Buffer.alloc(44 + samples.length * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40)
  samples.forEach((s, i) => buf.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32000, 44 + i * 2))
  fs.writeFileSync(path.join(out, name), buf)
}
function note(freq, dur, vol = 0.5, start = 0, total = dur) {
  const n = Math.floor(total * SR)
  const a = new Float32Array(n)
  for (let i = Math.floor(start * SR); i < n; i++) {
    const t = (i / SR) - start
    if (t > dur) break
    const env = Math.min(1, t / 0.004) * Math.exp(-t * (5 / dur))
    a[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * env * vol
  }
  return a
}
const mix = (...arr) => { const n = Math.max(...arr.map((a) => a.length)); const o = new Float32Array(n); arr.forEach((a) => a.forEach((v, i) => (o[i] += v))); return o }

wav('tic.wav', note(880, 0.09, 0.5))
wav('tic2.wav', note(1318, 0.09, 0.5))
wav('plin.wav', mix(note(1046, 0.35, 0.4, 0, 0.6), note(1568, 0.45, 0.35, 0.09, 0.6)))
wav('tada.wav', mix(note(523, 0.5, 0.35, 0, 1.2), note(659, 0.5, 0.35, 0.1, 1.2), note(784, 0.9, 0.4, 0.2, 1.2), note(1046, 0.9, 0.3, 0.2, 1.2)))
console.log('suoni pronti')
