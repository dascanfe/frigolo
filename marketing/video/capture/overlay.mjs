// Status bar iOS (9:41, Dynamic Island, segnale, Wi-Fi, batteria piena) e indicatore Home,
// disegnati in SVG a 390x844 pt e resi a scala 3. compose() mette una cattura 390x796 sotto la barra.
import sharp from 'sharp'

export const W = 1170, H = 2532, TOP = 144
const S = 3
const INK = '#111'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 390 844">
  <rect x="133" y="11" width="124" height="36" rx="18" fill="#000"/>
  <text x="64" y="35" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="17" fill="${INK}" letter-spacing="-0.2">9:41</text>
  <g fill="${INK}">
    <rect x="276" y="29" width="3.2" height="4.5" rx="1"/>
    <rect x="281.6" y="26" width="3.2" height="7.5" rx="1"/>
    <rect x="287.2" y="22.5" width="3.2" height="11" rx="1"/>
    <rect x="292.8" y="19" width="3.2" height="14.5" rx="1"/>
  </g>
  <g fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round">
    <path d="M303.2 25.6 a11.5 11.5 0 0 1 15.6 0"/>
    <path d="M306 28.7 a7.4 7.4 0 0 1 10 0"/>
  </g>
  <path d="M309.4 32.2 a3.3 3.3 0 0 1 3.2 0 l-1.6 1.9 z" fill="${INK}"/>
  <rect x="326.5" y="19.5" width="25.5" height="13" rx="4" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>
  <rect x="328" y="21" width="22.5" height="10" rx="2.8" fill="${INK}"/>
  <path d="M354 24.5 v4 a2.3 2.3 0 0 0 0-4 z" fill="${INK}" fill-opacity="0.45"/>
  <rect x="127" y="831" width="136" height="5" rx="2.5" fill="#000"/>
</svg>`

export const overlayBuffer = () => sharp(Buffer.from(svg)).png().toBuffer()

/** shot: PNG 1170x2391 (o buffer); bg: colore della fascia sotto la barra */
export async function compose(shot, bg) {
  const ov = await overlayBuffer()
  return sharp({ create: { width: W, height: H, channels: 3, background: bg } })
    .composite([{ input: shot, left: 0, top: TOP }, { input: ov, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
}
if (process.argv[2] === 'test') {
  await sharp(await overlayBuffer()).flatten({ background: '#f8eef0' }).extract({ left: 0, top: 0, width: 1170, height: 160 }).toFile('/tmp/ov.png')
}
if (process.argv[2] === 'png') {
  const out = new URL('../public/img/overlay.png', import.meta.url).pathname
  await sharp(await overlayBuffer()).toFile(out)
  console.log('overlay scritto')
}
