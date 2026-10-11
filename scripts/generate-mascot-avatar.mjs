// Avatar predefinito: la mascotte ritagliata e centrata in un quadrato
// trasparente, pensato per stare in un cerchio sopra il colore del profilo.
// Uso: node scripts/generate-mascot-avatar.mjs
import sharp from 'sharp'

const SIZE = 192
const INNER = Math.round(SIZE * 0.72)

const trimmed = await sharp('public/mascot.png').trim().toBuffer()
const inner = await sharp(trimmed)
  .resize(INNER, INNER, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  // leggermente più in basso del centro: nel cerchio la testa resta ben visibile
  .composite([{ input: inner, top: Math.round((SIZE - INNER) / 2) + 6, left: (SIZE - INNER) / 2 }])
  .webp({ quality: 86 })
  .toFile('public/mascot-avatar.webp')

console.log('public/mascot-avatar.webp')
