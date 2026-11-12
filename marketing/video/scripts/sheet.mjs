import sharp from 'sharp'
import fs from 'node:fs'
const [dir, pattern, outFile, cols = '5', cw = '360'] = process.argv.slice(2)
const files = fs.readdirSync(dir).filter((f) => f.includes(pattern)).sort()
const meta = await sharp(`${dir}/${files[0]}`).metadata()
const w = Number(cw), h = Math.round((w * meta.height) / meta.width), c = Number(cols), rows = Math.ceil(files.length / c)
const tiles = await Promise.all(files.map((f) => sharp(`${dir}/${f}`).resize(w).toBuffer()))
await sharp({ create: { width: w * c, height: h * rows, channels: 3, background: '#888' } }).composite(tiles.map((t, i) => ({ input: t, left: (i % c) * w, top: Math.floor(i / c) * h }))).jpeg({ quality: 82 }).toFile(outFile)
