import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  delayRender,
  continueRender,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { C, FONT_TEXT, FONT_TITLE } from './theme'

/* ---------- font locali ---------- */
const FONTS: [string, string, string, string][] = [
  ['Lato', 'lato-400.woff2', '400', 'normal'],
  ['Lato', 'lato-700.woff2', '700', 'normal'],
  ['Lato', 'lato-900.woff2', '900', 'normal'],
  ['Playfair Display', 'playfair-700.woff2', '700', 'normal'],
  ['Playfair Display', 'playfair-700i.woff2', '700', 'italic'],
]
export const Fonts: React.FC = () => {
  const [handle] = React.useState(() => delayRender('font'))
  React.useEffect(() => {
    Promise.all(
      FONTS.map(([family, file, weight, style]) => {
        const f = new FontFace(family, `url(${staticFile('fonts/' + file)})`, { weight, style })
        return f.load().then((l) => (document.fonts as unknown as { add(f: FontFace): void }).add(l))
      }),
    )
      .catch(() => undefined)
      .finally(() => continueRender(handle))
  }, [handle])
  return null
}

/* ---------- layout ---------- */
export interface Layout {
  land: boolean
  w: number
  h: number
  /** telefono singolo: larghezza esterna, centro x, top */
  phone: { w: number; cx: number; top: number }
  title: { x: number; y: number; w: number; size: number; align: 'center' | 'left'; middle: boolean }
}
export const useLayout = (): Layout => {
  const { width: w, height: h } = useVideoConfig()
  const land = w > h
  return land
    ? {
        land, w, h,
        phone: { w: 410, cx: 500, top: 115 },
        title: { x: 960, y: 0, w: 820, size: 96, align: 'left', middle: true },
      }
    : {
        land, w, h,
        phone: { w: 680, cx: 540, top: 610 },
        title: { x: 90, y: 250, w: 900, size: 92, align: 'center', middle: false },
      }
}

/* ---------- sfondo ---------- */
export const Background: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const blobs = [
    { x: 0.15, y: 0.2, r: 0.34, c: C.sabbia, s: 0.6 },
    { x: 0.9, y: 0.55, r: 0.4, c: '#f0dcc0', s: 0.45 },
    { x: 0.3, y: 0.95, r: 0.36, c: C.sabbia, s: 0.8 },
  ]
  const m = Math.max(width, height)
  return (
    <AbsoluteFill style={{ background: C.cremaFondo }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x * width - (b.r * m) / 2 + Math.sin(frame / 90 + i * 2) * 40 * b.s,
            top: b.y * height - (b.r * m) / 2 + Math.cos(frame / 110 + i) * 50 * b.s,
            width: b.r * m,
            height: b.r * m,
            borderRadius: '50%',
            background: b.c,
            opacity: 0.55,
            filter: 'blur(2px)',
          }}
        />
      ))}
    </AbsoluteFill>
  )
}

/* ---------- uscita/entrata di scena ---------- */
export const SceneShell: React.FC<{ dur: number; children: React.ReactNode; last?: boolean; first?: boolean }> = ({ dur, children, last, first }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const enter = first ? 1 : spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 })
  const exit = last ? 0 : interpolate(frame, [dur - 12, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const x = (1 - enter) * width * 0.25 - exit * width * 0.25
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, opacity: enter * (1 - exit) }}>{children}</AbsoluteFill>
  )
}

/* ---------- testi cinetici ---------- */
const parseWords = (src: string) => {
  const out: { t: string; accent: boolean; br?: boolean }[] = []
  src.split('|').forEach((line, li, arr) => {
    let accent = false
    line.split('*').forEach((chunk) => {
      chunk.split(' ').filter(Boolean).forEach((t) => out.push({ t, accent }))
      accent = !accent
    })
    if (li < arr.length - 1) out.push({ t: '', accent: false, br: true })
  })
  return out
}

export const Headline: React.FC<{ text: string; delay?: number; size?: number; color?: string; accentColor?: string; top?: number }> = ({
  text, delay = 4, size, color = C.inchiostro, accentColor = C.mattone, top,
}) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = parseWords(text)
  const fs = size ?? L.title.size
  let idx = 0
  const box: React.CSSProperties = L.land
    ? { position: 'absolute', left: L.title.x, width: L.title.w, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }
    : { position: 'absolute', left: L.title.x, width: L.title.w, top: top ?? L.title.y }
  return (
    <div style={box}>
      <div style={{ width: '100%', textAlign: L.title.align, fontFamily: FONT_TITLE, fontWeight: 700, fontSize: fs, lineHeight: 1.12, color }}>
        {words.map((w, i) => {
          if (w.br) return <br key={i} />
          const s = spring({ frame: frame - delay - idx++ * 4, fps, config: { damping: 14, stiffness: 140 } })
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.28em',
                transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`,
                opacity: Math.min(1, s * 1.6),
                fontStyle: w.accent ? 'italic' : 'normal',
                color: w.accent ? accentColor : color,
              }}
            >
              {w.t}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- mascotte ---------- */
export const Mascot: React.FC<{
  kind: 'classica' | 'contenta' | 'pensierosa' | 'posta'
  w: number
  x: number
  y: number
  delay?: number
  from?: 'bottom' | 'right' | 'left' | 'pop'
  bob?: boolean
}> = ({ kind, w, x, y, delay = 0, from = 'bottom', bob = true }) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 110, mass: 0.9 } })
  let dx = 0, dy = 0, sc = 1
  if (from === 'bottom') dy = (1 - s) * (height - y + 50)
  if (from === 'right') dx = (1 - s) * (width - x + 50)
  if (from === 'left') dx = -(1 - s) * (x + w + 50)
  if (from === 'pop') sc = Math.max(0, s)
  const b = bob ? Math.sin((frame - delay) / 14) * 10 : 0
  const rot = bob ? Math.sin((frame - delay) / 20) * 2 : 0
  return (
    <Img
      src={staticFile(`img/frigolo-${kind}.png`)}
      style={{
        position: 'absolute', left: x, top: y, width: w,
        transform: `translate(${dx}px, ${dy + b}px) scale(${sc}) rotate(${rot}deg)`,
        filter: 'drop-shadow(0 24px 30px rgba(58,44,33,0.22))',
      }}
    />
  )
}

/* ---------- telefono ---------- */
export const phoneMetrics = (w: number) => {
  const bez = w * 0.022
  const sw = w - 2 * bez
  const sh = (sw * 844) / 390
  return { bez, sw, sh, h: sh + 2 * bez, k: sw / 390 }
}

export const Phone: React.FC<{
  w: number
  cx: number
  top: number
  ry?: number
  rx?: number
  delay?: number
  floatPhase?: number
  children: (k: number) => React.ReactNode
}> = ({ w, cx, top, ry = -8, rx = 4, delay = 0, floatPhase = 0, children }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const m = phoneMetrics(w)
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 90 } })
  const fl = Math.sin(frame / 38 + floatPhase)
  const rY = ry + fl * 2.2 + (1 - s) * 25
  const rX = rx + Math.cos(frame / 45 + floatPhase) * 1.2
  return (
    <div style={{ position: 'absolute', left: cx - w / 2, top, width: w, height: m.h, perspective: 2200 }}>
      <div
        style={{
          width: w, height: m.h,
          transform: `translateY(${(1 - s) * 420 + fl * 6}px) rotateY(${rY}deg) rotateX(${rX}deg)`,
          transformStyle: 'preserve-3d',
          opacity: Math.min(1, s * 2),
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: w * 0.135, background: '#231a14',
            boxShadow: `0 ${w * 0.09}px ${w * 0.14}px -${w * 0.03}px rgba(58,44,33,0.38), 0 ${w * 0.02}px ${w * 0.04}px rgba(58,44,33,0.2), inset 0 0 0 ${w * 0.004}px #5a4a3d`,
          }}
        />
        <div style={{ position: 'absolute', left: m.bez, top: m.bez, width: m.sw, height: m.sh, borderRadius: w * 0.135 - m.bez, overflow: 'hidden', background: C.cremaFondo }}>
          {children(m.k)}
        </div>
        <div style={{ position: 'absolute', left: w / 2 - w * 0.13, top: m.bez + w * 0.02, width: w * 0.26, height: w * 0.05, borderRadius: w, background: '#0d0907' }} />
      </div>
    </div>
  )
}

/** Immagine dello schermo a tutta larghezza dello schermo del telefono. */
export const Screen: React.FC<{ src: string; k: number; opacity?: number; y?: number }> = ({ src, k, opacity = 1, y = 0 }) => (
  <Img src={staticFile(`img/${src}`)} style={{ position: 'absolute', left: 0, top: y * k, width: 390 * k, opacity }} />
)

/** Ritaglio di uno screenshot (coordinate in px css 390x844) con scala animabile. */
export const Crop: React.FC<{ src: string; box: [number, number, number, number]; k: number; scale?: number; opacity?: number; pad?: number }> = ({
  src, box: [x, y, w, h], k, scale = 1, opacity = 1, pad = 0,
}) => (
  <div
    style={{
      position: 'absolute', left: (x - pad) * k, top: (y - pad) * k, width: (w + 2 * pad) * k, height: (h + 2 * pad) * k,
      overflow: 'hidden', opacity, transform: `scale(${scale})`, borderRadius: 22 * k,
    }}
  >
    <Img src={staticFile(`img/${src}`)} style={{ position: 'absolute', left: -(x - pad) * k, top: -(y - pad) * k, width: 390 * k }} />
  </div>
)

/** Tocco: cerchio che si preme e anello che si espande. Coordinate in px css dello schermo. */
export const Tap: React.FC<{ x: number; y: number; at: number; k: number }> = ({ x, y, at, k }) => {
  const frame = useCurrentFrame()
  const t = frame - at
  if (t < -8 || t > 24) return null
  const press = interpolate(t, [-8, 0, 6, 12], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const ring = interpolate(t, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const appear = interpolate(t, [-8, 0], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const r = 22 * k
  return (
    <>
      <div style={{ position: 'absolute', left: x * k - r * (1 + ring * 2.2), top: y * k - r * (1 + ring * 2.2), width: r * 2 * (1 + ring * 2.2), height: r * 2 * (1 + ring * 2.2), borderRadius: '50%', border: `${3 * k}px solid ${C.crema}`, opacity: (1 - ring) * 0.9 * (t >= 0 ? 1 : 0), boxShadow: '0 0 0 1px rgba(58,44,33,0.15)' }} />
      <div style={{ position: 'absolute', left: x * k - r, top: y * k - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'rgba(250,243,236,0.85)', border: `${2 * k}px solid rgba(58,44,33,0.35)`, opacity: press, transform: `scale(${appear * (1 - 0.15 * (t >= 0 && t < 6 ? 1 : 0))})`, boxShadow: '0 6px 14px rgba(58,44,33,0.3)' }} />
    </>
  )
}

/* ---------- coriandoli ---------- */
const COLORS = [C.arancio, C.menta, C.salvia, C.pesca, C.arancioVivo, C.mattone, C.crema]
export const Confetti: React.FC<{ at: number; cx: number; cy: number; n?: number }> = ({ at, cx, cy, n = 90 }) => {
  const frame = useCurrentFrame()
  const t = (frame - at) / 30
  if (t < 0) return null
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2
        const sp = 500 + random(`s${i}`) * 900
        const x = cx + Math.cos(a) * sp * t * Math.exp(-t * 0.9)
        const y = cy + Math.sin(a) * sp * t * Math.exp(-t * 0.9) - 80 * t + 520 * t * t
        const rot = random(`r${i}`) * 360 + t * (200 + random(`q${i}`) * 500)
        const w = 16 + random(`w${i}`) * 18
        const op = interpolate(t, [1.6, 2.6], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: i % 3 === 0 ? w : w * 0.45, borderRadius: i % 4 === 0 ? '50%' : 3, background: COLORS[i % COLORS.length], transform: `rotate(${rot}deg)`, opacity: op }} />
        )
      })}
    </AbsoluteFill>
  )
}

/* ---------- suoni ---------- */
export const Sfx: React.FC<{ at: number; name: 'tic' | 'tic2' | 'plin' | 'tada'; volume?: number }> = ({ at, name, volume = 0.7 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60} layout="none">
    <Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
  </Sequence>
)

export const Chip: React.FC<{ text: string; x: number; y: number; delay: number; color?: string; fg?: string; size?: number }> = ({ text, x, y, delay, color = C.crema, fg = C.inchiostro, size = 34 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 13 } })
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translateX(-50%) scale(${s})`, opacity: s, background: color, color: fg, fontFamily: FONT_TEXT, fontWeight: 900, fontSize: size, padding: `${size * 0.35}px ${size * 0.8}px`, borderRadius: 999, boxShadow: '0 10px 24px rgba(58,44,33,0.18)', whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
      {text}
    </div>
  )
}
