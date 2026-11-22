// Reel R1 "Che soddisfazione": 1080x1920, 60 fps, 12 s, in loop (l'ultimo fotogramma e' il primo).
// Il video dell'app e' una registrazione vera (capture/r1-rec.mjs); qui ci sono solo camera, testi, suoni e il tocco.
import React from 'react'
import { AbsoluteFill, Audio, Easing, Img, Series, Sequence, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, Freeze } from 'remotion'
import { Fonts } from './ui'
import { C, FONT_TEXT, FONT_TITLE } from './theme'

export const R1_FPS = 60
export const R1_FRAMES = 720
const BG = '#f8eef0'
const CW = 1170, CH = 2388 // dimensioni della registrazione
const Z = 0.95 // scala: pixel video per pixel registrazione
const OY = 520 // dove cade, in alto, la riga di camera (cy)
// tocchi (secondi di video, posizione nella registrazione)
const TAPS: [number, number, number][] = [
  [0.3, 214, 976], [2.3, 214, 976], [3.2, 214, 976], [3.9, 214, 976], [5.0, 214, 976],
]

const ease = Easing.inOut(Easing.cubic)
const cam = (t: number) =>
  interpolate(t, [0, 2.0, 3.0, 4.3, 5.6, 8.8, 10.6, 12], [640, 640, 790, 790, 1240, 1240, 640, 640], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

const Scene: React.FC<{ t: number; first?: boolean }> = ({ t, first }) => {
  const cy = first ? 640 : cam(t)
  const left = (1080 - CW * Z) / 2
  const top = OY - cy * Z
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left, top, width: CW * Z, height: CH * Z }}>
        {first ? (
          <Freeze frame={0}>
            <OffthreadVideo src={staticFile('clips/r1-raw.mp4')} muted style={{ width: '100%', height: '100%' }} />
          </Freeze>
        ) : (
          <OffthreadVideo src={staticFile('clips/r1-raw.mp4')} muted style={{ width: '100%', height: '100%' }} />
        )}
        {!first && TAPS.map(([ts, x, y], i) => {
          const p = (t - ts) / 0.55
          if (p < 0 || p > 1) return null
          const r = 40 + 90 * Easing.out(Easing.cubic)(p)
          return <div key={i} style={{ position: 'absolute', left: x * Z - r, top: y * Z - r, width: r * 2, height: r * 2, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.28)', opacity: 1 - p }} />
        })}
      </div>
    </AbsoluteFill>
  )
}

const Masks: React.FC = () => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 600, background: `linear-gradient(${BG} 0, ${BG} 505px, rgba(248,238,240,0) 590px)` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: `linear-gradient(rgba(248,238,240,0) 0, ${BG} 70px, ${BG} 380px)` }} />
  </>
)

const Line: React.FC<{ children: React.ReactNode; opacity: number; color?: string; size?: number; dy?: number }> = ({ children, opacity, color = C.inchiostro, size = 80, dy = 0 }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, top: 265, textAlign: 'center', fontFamily: FONT_TITLE, fontWeight: 700, fontSize: size, lineHeight: 1.12, color, opacity, transform: `translateY(${dy}px)` }}>{children}</div>
)

export const R1: React.FC = () => {
  const frame = useCurrentFrame()
  const t = frame / R1_FPS
  const fade = (a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // titolo di apertura: c'e' dal primo fotogramma (aggancio), esce dopo il primo tocco, torna con il loop
  const titleOpacity = t < 6 ? 1 - fade(2.9, 3.5) : fade(10.6, 11.9)
  // "Spesa finita" arriva col bottone, resta, poi lascia il posto al titolo
  const endOpacity = fade(6.3, 6.9) * (1 - fade(9.0, 9.8))
  const endDy = (1 - fade(6.3, 6.9)) * 24
  // dissolvenza finale verso il primo fotogramma (loop senza stacco)
  const loop = fade(10.4, 11.9)
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Fonts />
      <Audio src={staticFile('audio/r1.wav')} />
      <Scene t={t} />
      {loop > 0 && <div style={{ position: 'absolute', inset: 0, opacity: loop }}><Scene t={0} first /></div>}
      <Masks />
      <Line opacity={titleOpacity}>Spuntare la spesa,<br />ma bello</Line>
      <Line opacity={endOpacity} color={C.mattone} dy={endDy} size={96}>Spesa finita ✨</Line>
    </AbsoluteFill>
  )
}

/** Copertina del Reel (1080x1920): titolo al centro, leggibile anche ritagliata 1:1 o 4:5 */
export const R1Cover: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <Fonts />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 38, letterSpacing: 6, color: C.mattone }}>FRIGOLO</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 136, lineHeight: 1.04, color: C.inchiostro }}>Che<br />soddisfazione</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 46, color: C.inchiostro2 }}>Spuntare la spesa, ma bello</div>
    <div style={{ position: 'absolute', left: 90, top: 880, width: 900, height: 720, borderRadius: 48, overflow: 'hidden', boxShadow: '0 24px 60px rgba(176,46,80,0.22)', background: BG }}>
      <Img src={staticFile('img/r1-cover.png')} style={{ position: 'absolute', left: 0, top: -492, width: 900 }} />
    </div>
  </AbsoluteFill>
)
