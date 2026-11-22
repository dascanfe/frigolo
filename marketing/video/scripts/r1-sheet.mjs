import sharp from 'sharp'
import fs from 'fs'
const dir = process.argv[2], out = process.argv[3], cols = +process.argv[4] || 8
const fl = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort()
const m = await sharp(dir + '/' + fl[0]).metadata()
const rows = Math.ceil(fl.length / cols)
await sharp({ create: { width: cols * m.width, height: rows * m.height, channels: 3, background: '#888' } })
  .composite(fl.map((f, i) => ({ input: dir + '/' + f, left: (i % cols) * m.width, top: Math.floor(i / cols) * m.height }))).png().toFile(out)
