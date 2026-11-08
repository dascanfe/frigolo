// Colonna sonora del Reel R1, interamente sintetizzata (nessun file di terzi, nessuna licenza):
// un "blop" morbido a ogni tocco e un piccolo accordo quando l ultimo prodotto atterra nel carrello. 12 s, mono 44,1 kHz, il fondo e' silenzioso
// cosi' il loop riparte senza colpi. I tempi dei tocchi sono quelli di capture/clips/r1/frames.json (marks).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SR = 44100, DUR = 12
const { marks } = JSON.parse(fs.readFileSync(path.join(root, 'capture/clips/r1/frames.json'), 'utf8'))
const out = new Float32Array(SR * DUR)
const add = (start, fn, len) => { const s0 = Math.floor(start * SR); for (let i = 0; i < len * SR && s0 + i < out.length; i++) out[s0 + i] += fn(i / SR) }
// bolla: sinusoide che sale di tono in pochi millisecondi, decadimento rapido e morbido
const blop = (t0, f0, vol) => add(t0, (t) => {
  const f = f0 * (1 + 2.2 * (1 - Math.exp(-t * 28)))
  const env = Math.min(1, t / 0.006) * Math.exp(-t * 17)
  return Math.sin(2 * Math.PI * f * t) * env * vol + Math.sin(2 * Math.PI * f * 0.5 * t) * env * vol * 0.35
}, 0.4)
const taps = ['Mele', 'Pane', 'Latte', 'Uova', 'Pasta']
taps.forEach((n, i) => blop(marks[n] + 0.02, 220 + i * 28, 0.5))
// piccolo accordo (do maggiore con la nona) arpeggiato, tono di campanello morbido
const bell = (t0, f, vol) => add(t0, (t) => {
  const env = Math.min(1, t / 0.008) * Math.exp(-t * 2.6)
  return (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t)) * env * vol
}, 2.4)
const c = marks.Pasta + 1.15
;[[523.25, 0], [659.25, 0.09], [783.99, 0.18], [1174.66, 0.28]].forEach(([f, d]) => bell(c + d, f, 0.2))
// leggero fade in entrata e in uscita, poi normalizza a un picco di 0,8
let peak = 0; out.forEach((v) => (peak = Math.max(peak, Math.abs(v))))
const g = 0.8 / (peak || 1)
const buf = Buffer.alloc(44 + out.length * 2)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + out.length * 2, 4); buf.write('WAVEfmt ', 8)
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
buf.write('data', 36); buf.writeUInt32LE(out.length * 2, 40)
out.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * g)) * 32000), 44 + i * 2))
fs.writeFileSync(path.join(root, 'public/audio/r1.wav'), buf)
console.log('r1.wav', marks)
