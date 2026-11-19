/**
 * Disegno dello scontrino su canvas, formato storia 1080x1920. Tutto sul
 * telefono: niente server, niente immagini da fuori (la mascotte è dell'app).
 * Le voci arrivano già calcolate da receiptModel.ts.
 */
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import { encode } from 'uqr'
import type { ThemePalette } from '@/lib/theme'
import { RECEIPT_QR_URL, RECEIPT_SITE } from './receiptModel'
import type { ReceiptModel } from './receiptModel'

export const RECEIPT_WIDTH = 1080
export const RECEIPT_HEIGHT = 1920

const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'
const DISPLAY = '"Playfair Display", Georgia, serif'

const PAPER = '#fffdf8'
const PAPER_W = 820
const PAD_X = 62
const TEXT_W = PAPER_W - PAD_X * 2
const TOOTH_W = 26
const TOOTH_H = 16
/** Zona sicura delle storie: in alto e in basso ci sono nome del profilo e risposte */
const SAFE_TOP = 230
const SAFE_BOTTOM = 200
const QR_SIZE = 300

/** Carica i caratteri prima di disegnare: senza, il canvas usa quello di riserva */
export async function loadReceiptFonts(): Promise<void> {
  if (!('fonts' in document)) return
  await Promise.all([
    document.fonts.load(`400 36px ${MONO}`, 'Aa0.'),
    document.fonts.load(`700 36px ${MONO}`, 'Aa0.'),
    document.fonts.load(`700 120px ${DISPLAY}`, 'FRIGOLO'),
  ]).catch(() => undefined)
}

/** La mascotte contenta, dall'app stessa */
export function loadMascot(src = '/mascot-happy.webp'): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mescola due colori esadecimali: t=0 il primo, t=1 il secondo */
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`
}

/** Accorcia il testo con i puntini di sospensione finché non sta nella larghezza */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

type Op = (ctx: CanvasRenderingContext2D, top: number) => void

interface Block {
  height: number
  draw: Op
}

interface Ink {
  ink: string
  soft: string
}

function centered(text: string, font: string, color: string, size: number, gap: number): Block {
  return {
    height: size + gap,
    draw: (ctx, top) => {
      ctx.font = font
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(fit(ctx, text, TEXT_W), PAPER_W / 2, top + size)
    },
  }
}

function dashed(color: string): Block {
  return {
    height: 44,
    draw: (ctx, top) => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.setLineDash([14, 10])
      ctx.beginPath()
      ctx.moveTo(PAD_X, top + 20)
      ctx.lineTo(PAPER_W - PAD_X, top + 20)
      ctx.stroke()
      ctx.restore()
    },
  }
}

/** Riga dello scontrino: etichetta, puntini, valore. Se non ci sta, il valore va a capo. */
function line(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  colors: Ink,
  size = 36,
  bold = false,
): Block {
  const font = `${bold ? 700 : 400} ${size}px ${MONO}`
  ctx.font = font
  const dot = ctx.measureText('.').width
  const labelW = ctx.measureText(label).width
  const valueW = ctx.measureText(value).width
  const rowH = size + 26
  const wraps = labelW + valueW + dot * 3 > TEXT_W

  const dots = (from: number, to: number) => {
    const n = Math.floor((to - from) / dot) - 1
    return n > 0 ? '.'.repeat(n) : ''
  }

  return {
    height: wraps ? rowH * 2 - 8 : rowH,
    draw: (c, top) => {
      c.font = font
      c.textAlign = 'left'
      c.fillStyle = colors.ink
      const base = top + size
      if (!wraps) {
        c.fillText(label, PAD_X, base)
        c.textAlign = 'right'
        c.fillText(value, PAPER_W - PAD_X, base)
        c.fillStyle = colors.soft
        c.textAlign = 'left'
        c.fillText(
          dots(labelW + dot / 2, TEXT_W - valueW - dot / 2),
          PAD_X + labelW + dot / 2,
          base,
        )
        return
      }
      c.fillText(fit(c, label, TEXT_W), PAD_X, base)
      const shown = fit(c, value, TEXT_W - dot * 4)
      const shownW = c.measureText(shown).width
      const base2 = base + rowH - 8
      c.textAlign = 'right'
      c.fillText(shown, PAPER_W - PAD_X, base2)
      c.fillStyle = colors.soft
      c.textAlign = 'left'
      c.fillText(dots(0, TEXT_W - shownW - dot / 2), PAD_X, base2)
    },
  }
}

function qrBlock(color: string): Block {
  const qr = encode(RECEIPT_QR_URL, { ecc: 'M', border: 0 })
  const cell = Math.floor(QR_SIZE / qr.size)
  const size = cell * qr.size
  // margine bianco attorno al codice: almeno quattro moduli, come vuole lo standard
  const quiet = cell * 4
  return {
    height: size + quiet * 2 - 12,
    draw: (ctx, top) => {
      const x0 = Math.round((PAPER_W - size) / 2)
      const y0 = Math.round(top + quiet - 6)
      // un solo tracciato: niente righine chiare tra un modulo e l'altro
      ctx.beginPath()
      qr.data.forEach((row, y) =>
        row.forEach((on, x) => {
          if (on) ctx.rect(x0 + x * cell, y0 + y * cell, cell, cell)
        }),
      )
      ctx.fillStyle = color
      ctx.fill()
    },
  }
}

function spacer(height: number): Block {
  return { height, draw: () => undefined }
}

/** Bordo seghettato in alto e in basso, come la carta strappata dal rotolo */
function paperPath(ctx: CanvasRenderingContext2D, height: number) {
  const teeth = Math.round(PAPER_W / TOOTH_W)
  const w = PAPER_W / teeth
  ctx.beginPath()
  ctx.moveTo(0, TOOTH_H)
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(i * w + w / 2, 0)
    ctx.lineTo((i + 1) * w, TOOTH_H)
  }
  ctx.lineTo(PAPER_W, height - TOOTH_H)
  for (let i = teeth; i > 0; i--) {
    ctx.lineTo(i * w - w / 2, height)
    ctx.lineTo((i - 1) * w, height - TOOTH_H)
  }
  ctx.closePath()
}

export interface DrawOptions {
  model: ReceiptModel
  palette: ThemePalette
  mascot: HTMLImageElement | null
}

/** Disegna lo scontrino su un canvas 1080x1920 (lo crea se non c'è) */
export function drawReceipt(
  { model, palette, mascot }: DrawOptions,
  canvas: HTMLCanvasElement = document.createElement('canvas'),
): HTMLCanvasElement {
  canvas.width = RECEIPT_WIDTH
  canvas.height = RECEIPT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponibile')
  ctx.textBaseline = 'alphabetic'

  const colors: Ink = { ink: palette.ink, soft: mix(palette.inkSoft, PAPER, 0.25) }

  // Fondo: l'accento del tema, con una luce morbida in alto e un'ombra in basso
  const bg = ctx.createLinearGradient(0, 0, RECEIPT_WIDTH * 0.4, RECEIPT_HEIGHT)
  bg.addColorStop(0, mix(palette.burnt, '#ffffff', 0.14))
  bg.addColorStop(1, mix(palette.burnt, palette.ink, 0.28))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT)
  const glow = ctx.createRadialGradient(180, 220, 40, 180, 220, 900)
  glow.addColorStop(0, 'rgba(255,255,255,0.22)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT)
  // coriandoli di puntini, discreti
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  for (let y = 40; y < RECEIPT_HEIGHT; y += 64) {
    for (let x = (y / 64) % 2 ? 40 : 72; x < RECEIPT_WIDTH; x += 64) {
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Contenuto della carta, dall'alto in basso
  const blocks: Block[] = [
    spacer(TOOTH_H + 44),
    centered('FRIGOLO', `700 112px ${DISPLAY}`, palette.ink, 112, 26),
    centered(model.listLine, `400 34px ${MONO}`, colors.ink, 34, 18),
    centered(model.stamp, `700 38px ${MONO}`, palette.ink, 38, 14),
    centered('scontrino non fiscale', `400 24px ${MONO}`, colors.soft, 24, 10),
    dashed(colors.soft),
    spacer(6),
    ...model.lines.map((l) => line(ctx, l.label, l.value, colors)),
  ]
  if (model.note.length > 0) {
    blocks.push(spacer(10))
    for (const note of model.note)
      blocks.push(centered(note, `400 30px ${MONO}`, colors.soft, 30, 14))
  }
  blocks.push(
    dashed(colors.soft),
    line(ctx, 'TOTALE APP', '0,00', colors, 46, true),
    dashed(colors.soft),
    spacer(10),
    centered('Fai la lista con noi:', `400 34px ${MONO}`, colors.ink, 34, 14),
    centered(RECEIPT_SITE, `700 40px ${MONO}`, palette.ink, 40, 12),
    qrBlock(palette.ink),
    centered('*** GRAZIE E A PRESTO ***', `400 26px ${MONO}`, colors.soft, 26, 10),
    spacer(TOOTH_H + 40),
  )
  const paperH = blocks.reduce((sum, b) => sum + b.height, 0)

  // Se le voci sono tante, la carta si rimpicciolisce per restare nella zona sicura
  const available = RECEIPT_HEIGHT - SAFE_TOP - SAFE_BOTTOM
  const scale = Math.min(1, available / paperH)
  const left = Math.round((RECEIPT_WIDTH - PAPER_W * scale) / 2)
  const top = Math.round(SAFE_TOP + (available - paperH * scale) / 2)

  ctx.save()
  ctx.translate(left, top)
  ctx.scale(scale, scale)

  // carta con ombra
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 22
  paperPath(ctx, paperH)
  ctx.fillStyle = PAPER
  ctx.fill()
  ctx.restore()
  // una piega leggera, come la carta termica
  ctx.save()
  paperPath(ctx, paperH)
  ctx.clip()
  const fold = ctx.createLinearGradient(0, 0, PAPER_W, 0)
  fold.addColorStop(0, 'rgba(0,0,0,0.035)')
  fold.addColorStop(0.5, 'rgba(0,0,0,0)')
  fold.addColorStop(1, 'rgba(0,0,0,0.045)')
  ctx.fillStyle = fold
  ctx.fillRect(0, 0, PAPER_W, paperH)
  ctx.restore()

  let y = 0
  for (const block of blocks) {
    block.draw(ctx, y)
    y += block.height
  }
  ctx.restore()

  // La mascotte contenta, a cavallo dell'angolo in alto a destra
  if (mascot) {
    const size = 300
    ctx.save()
    ctx.translate(left + PAPER_W * scale - 40, top + 30)
    ctx.rotate((10 * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 10
    ctx.drawImage(mascot, -size / 2, -size / 2, size, size)
    ctx.restore()
  }

  return canvas
}

/** Il canvas come file PNG */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG non creato'))),
      'image/png',
    )
  })
}
