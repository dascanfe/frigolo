import React from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, FONT_TEXT, FONT_TITLE } from './theme'
import { Chip, Confetti, Crop, Headline, Mascot, Phone, Screen, SceneShell, Sfx, Tap, useLayout, phoneMetrics } from './ui'

export interface SceneProps {
  dur: number
  first?: boolean
  last?: boolean
}

const fade = (frame: number, a: number, b = 8) => interpolate(frame, [a, a + b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

/* 1. Chi compra il latte? */
export const Scene1: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const mw = L.land ? 620 : 720
  return (
    <SceneShell {...p}>
      <Headline text="Chi compra|*il latte?*" delay={6} size={L.land ? 120 : 120} top={250} />
      <Mascot kind="pensierosa" w={mw} x={L.land ? 120 : (L.w - mw) / 2} y={L.land ? L.h - mw + 40 : 880} delay={10} from="bottom" />
    </SceneShell>
  )
}

/* 2. Catalogo: tocca un prodotto */
const CAT_TILES: [number, number, number, number][] = [
  [139, 192, 111, 110],
  [16, 315, 110, 111],
  [263, 315, 110, 111],
]
export const Scene2: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const taps = [34, 62, 90]
  return (
    <SceneShell {...p}>
      <Headline text="Tocca un prodotto:|*è in lista.*" />
      <Phone {...L.phone} delay={4}>
        {(k) => (
          <>
            <Screen src="s02-catalogo-prima.png" k={k} />
            {CAT_TILES.map((b, i) => {
              const s = spring({ frame: frame - taps[i], fps, config: { damping: 9, stiffness: 160 } })
              return <Crop key={i} src="s02-catalogo-dopo.png" box={b} k={k} scale={0.7 + 0.3 * s} opacity={frame >= taps[i] ? 1 : 0} />
            })}
            {CAT_TILES.map((b, i) => (
              <Tap key={i} x={b[0] + b[2] / 2} y={b[1] + b[3] / 2} at={taps[i]} k={k} />
            ))}
          </>
        )}
      </Phone>
      {taps.map((t, i) => <Sfx key={i} at={t} name="tic" />)}
    </SceneShell>
  )
}

/* 3. Due telefoni in tempo reale */
const YOGURT: [number, number, number, number] = [263, 380, 110, 111]
export const Scene3: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const w = L.land ? 372 : 490
  const cxL = L.land ? 250 : 275
  const cxR = L.land ? 660 : 805
  const top = L.land ? 150 : 690
  const tapAt = 30
  const popAt = 52
  const s = spring({ frame: frame - popAt, fps, config: { damping: 8, stiffness: 150 } })
  const m = phoneMetrics(w)
  return (
    <SceneShell {...p}>
      <Headline text="Chi fa la spesa|con te *lo vede subito.*" size={L.land ? 88 : 88} />
      <Phone w={w} cx={cxL} top={top} ry={12} rx={3} delay={2} floatPhase={0}>
        {(k) => (
          <>
            <Screen src="s02-catalogo-prima.png" k={k} />
            <Crop src="s02-catalogo-dopo.png" box={CAT_TILES[0]} k={k} scale={0.7 + 0.3 * spring({ frame: frame - tapAt, fps, config: { damping: 9, stiffness: 160 } })} opacity={frame >= tapAt ? 1 : 0} />
            <Tap x={194} y={247} at={tapAt} k={k} />
          </>
        )}
      </Phone>
      <Phone w={w} cx={cxR} top={top} ry={-12} rx={3} delay={6} floatPhase={2}>
        {(k) => (
          <>
            <Screen src="s05-lista-corsia.png" k={k} />
            <div style={{ position: 'absolute', left: (YOGURT[0] - 3) * k, top: (YOGURT[1] - 3) * k, width: (YOGURT[2] + 6) * k, height: (YOGURT[3] + 6) * k, background: C.cremaFondo, opacity: frame < popAt + 2 ? 1 : 0 }} />
            <Crop src="s05-lista-corsia.png" box={YOGURT} k={k} scale={Math.max(0, s)} opacity={frame >= popAt ? 1 : 0} />
            <div style={{ position: 'absolute', left: (YOGURT[0] - 8) * k, top: (YOGURT[1] - 8) * k, width: 26 * k, height: 26 * k, borderRadius: '50%', background: C.teal, border: `${2 * k}px solid ${C.crema}`, overflow: 'hidden', transform: `scale(${Math.max(0, s)})` }}>
              <Img src={staticFile('img/mascot-avatar.webp')} style={{ width: '100%', height: '100%' }} />
            </div>
          </>
        )}
      </Phone>
      <Chip text="Sara aggiunge" x={cxL} y={top - 70} delay={14} />
      <Chip text="Ale, al supermercato" x={cxR} y={top - 70} delay={20} color={C.arancio} fg={C.crema} />
      {/* freccia di sincronizzazione */}
      <div style={{ position: 'absolute', left: (cxL + cxR) / 2 - 40, top: top + m.h * 0.42, width: 80, height: 80, opacity: fade(frame, tapAt + 4) * (1 - fade(frame, popAt + 20, 10)), transform: `translateX(${interpolate(frame, [tapAt + 4, popAt], [-60, 60], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`, borderRadius: '50%', background: C.mattone, boxShadow: '0 10px 24px rgba(58,44,33,0.3)' }} />
      <Sfx at={tapAt} name="tic" />
      <Sfx at={popAt} name="plin" />
    </SceneShell>
  )
}

/* 4. In ordine di corsia */
export const Scene4: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const zoom = interpolate(frame, [0, 140], [1, 1.14])
  const ring = (a: number, b: number) => interpolate(frame, [a, a + 8, b, b + 8], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const lab = (at: number) => spring({ frame: frame - at, fps, config: { damping: 13 } })
  return (
    <SceneShell {...p}>
      <Headline text="In ordine di corsia:|i *surgelati* alla fine." />
      <Phone {...L.phone} delay={0}>
        {(k) => (
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 38%' }}>
            <Screen src="s05-lista-corsia.png" k={k} />
            <div style={{ position: 'absolute', left: 14 * k, top: 255 * k, width: 114 * k, height: 114 * k, borderRadius: 24 * k, border: `${4 * k}px solid ${C.crema}`, boxShadow: `0 0 0 ${3 * k}px ${C.inchiostro}`, opacity: ring(18, 70) }} />
            <div style={{ position: 'absolute', left: 137 * k, top: 625 * k, width: 114 * k, height: 114 * k, borderRadius: 24 * k, border: `${4 * k}px solid ${C.crema}`, boxShadow: `0 0 0 ${3 * k}px ${C.inchiostro}`, opacity: ring(80, 140) }} />
            <div style={{ position: 'absolute', left: 190 * k, top: 218 * k, background: C.inchiostro, color: C.crema, fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 15 * k, padding: `${6 * k}px ${12 * k}px`, borderRadius: 99, transform: `scale(${lab(22) * (ring(18, 70) > 0.5 ? 1 : 0)})`, transformOrigin: 'left center', whiteSpace: 'nowrap' }}>Frutta e verdura</div>
            <div style={{ position: 'absolute', left: 255 * k, top: 655 * k, background: C.inchiostro, color: C.crema, fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 15 * k, padding: `${6 * k}px ${12 * k}px`, borderRadius: 99, transform: `scale(${lab(84) * (ring(80, 140) > 0.5 ? 1 : 0)})`, transformOrigin: 'left center', whiteSpace: 'nowrap' }}>Surgelati</div>
          </div>
        )}
      </Phone>
    </SceneShell>
  )
}

/* 5. Nel carrello */
export const Scene5: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const pts: [number, number, number][] = [[71, 312, 24], [194, 312, 48], [318, 312, 72]]
  const sw = fade(frame, 80, 10)
  return (
    <SceneShell {...p}>
      <Headline text="Preso? Un tocco|ed è nel *carrello.*" />
      <Phone {...L.phone} delay={0}>
        {(k) => (
          <>
            <Screen src="s05-lista-corsia.png" k={k} />
            <Screen src="s06-carrello.png" k={k} opacity={sw} />
            {pts.map((t, i) => <Tap key={i} x={t[0]} y={t[1]} at={t[2]} k={k} />)}
          </>
        )}
      </Phone>
      {pts.map((t, i) => <Sfx key={i} at={t[2]} name="tic2" />)}
    </SceneShell>
  )
}

/* 6. Spesa finita + coriandoli */
export const Scene6: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const tapAt = 28
  const done = 40
  const sw = fade(frame, done, 6)
  const pop = spring({ frame: frame - done, fps, config: { damping: 8, stiffness: 120 } })
  const mw = L.land ? 440 : 560
  return (
    <SceneShell {...p}>
      <div style={{ position: 'absolute', left: L.title.x, width: L.title.w, top: L.land ? undefined : 250, ...(L.land ? { top: 0, bottom: 0, display: 'flex', alignItems: 'center' } : {}) }}>
        <div style={{ width: '100%', textAlign: L.title.align, fontFamily: FONT_TITLE, fontWeight: 700, fontSize: L.land ? 130 : 150, lineHeight: 1.05, color: C.inchiostro, transform: `scale(${0.6 + 0.4 * Math.min(1.1, pop)})`, transformOrigin: L.land ? 'left center' : 'center', opacity: fade(frame, 6) }}>
          Spesa <span style={{ fontStyle: 'italic', color: C.mattone }}>finita</span>
        </div>
      </div>
      <Phone {...L.phone} delay={0}>
        {(k) => (
          <>
            <Screen src="s07-spesa-finita.png" k={k} />
            <Screen src="s07b-spesa-finita-toast.png" k={k} opacity={sw} />
            <Tap x={195} y={805} at={tapAt} k={k} />
          </>
        )}
      </Phone>
      <Mascot kind="contenta" w={mw} x={L.land ? 700 : 600} y={L.land ? L.h - mw - 20 : 1260} delay={done + 4} from={L.land ? 'bottom' : 'right'} />
      <Confetti at={done} cx={L.land ? 960 : 540} cy={L.land ? 420 : 760} />
      <Sfx at={tapAt} name="tic" />
      <Sfx at={done} name="tada" volume={0.8} />
    </SceneShell>
  )
}

/* 7. Più liste, più persone */
export const Scene7: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const sw = fade(frame, 56, 10)
  const colors = [C.teal, C.arancio, C.ocra]
  const base = L.land ? { x: 960, y: 700 } : { x: 540 - 110, y: 470 }
  return (
    <SceneShell {...p}>
      <Headline text="Per conto tuo|o in *compagnia.*" top={250} />
      <Phone {...L.phone} delay={0}>
        {(k) => (
          <>
            <Screen src="s08-cambia-lista.png" k={k} />
            <Screen src="s09-lista-coinquilini.png" k={k} opacity={sw} />
            <Tap x={150} y={664} at={46} k={k} />
          </>
        )}
      </Phone>
      {colors.map((c, i) => {
        const s = spring({ frame: frame - (60 + i * 6), fps: 30, config: { damping: 9 } })
        return (
          <div key={i} style={{ position: 'absolute', left: (L.land ? 960 : 540 - 130) + i * 80, top: L.land ? 740 : 480, width: 100, height: 100, borderRadius: '50%', background: c, border: `6px solid ${C.cremaFondo}`, overflow: 'hidden', transform: `scale(${Math.max(0, s)})`, boxShadow: '0 10px 20px rgba(58,44,33,0.25)' }}>
            <Img src={staticFile('img/mascot-avatar.webp')} style={{ width: '100%', height: '100%' }} />
          </div>
        )
      })}
      <Sfx at={46} name="tic" />
    </SceneShell>
  )
}

/* 8. Installazione dal browser (disegnata, niente marchi) */
const IconSquare: React.FC<{ c: string; k: number; label: string }> = ({ c, k, label }) => (
  <div style={{ width: 70 * k, textAlign: 'center' }}>
    <div style={{ width: 62 * k, height: 62 * k, margin: '0 auto', borderRadius: 15 * k, background: c, opacity: 0.85 }} />
    <div style={{ fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 10 * k, color: C.crema, marginTop: 4 * k }}>{label}</div>
  </div>
)
export const Scene8: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sheet = spring({ frame: frame - 6, fps, config: { damping: 18 } })
  const home = fade(frame, 62, 8)
  const ic = spring({ frame: frame - 70, fps, config: { damping: 8, stiffness: 140 } })
  return (
    <SceneShell {...p}>
      <Headline text="Gratis, senza pubblicità.|Si installa dal *browser.*" size={L.land ? 72 : 68} top={250} />
      <Phone {...L.phone} delay={0}>
        {(k) => (
          <>
            {/* pagina nel browser */}
            <div style={{ position: 'absolute', inset: 0, background: C.cremaFondo }}>
              <div style={{ position: 'absolute', left: 16 * k, right: 16 * k, top: 52 * k, height: 40 * k, borderRadius: 14 * k, background: C.crema, border: `${1 * k}px solid ${C.sabbia}`, fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 15 * k, color: C.inchiostro2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>frigolo.dascanfe.com</div>
              <Img src={staticFile('img/frigolo-classica.png')} style={{ position: 'absolute', left: 95 * k, top: 150 * k, width: 200 * k }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: 360 * k, textAlign: 'center', fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 44 * k, color: C.inchiostro }}>Frigolo</div>
              <div style={{ position: 'absolute', left: 30 * k, right: 30 * k, top: 425 * k, textAlign: 'center', fontFamily: FONT_TEXT, fontSize: 17 * k, color: C.inchiostro2 }}>La lista della spesa sempre in tasca.</div>
              {/* foglio Condividi */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360 * k, borderRadius: `${26 * k}px ${26 * k}px 0 0`, background: '#f6f1ea', boxShadow: '0 -10px 40px rgba(58,44,33,0.25)', transform: `translateY(${(1 - sheet) * 380 * k}px)`, padding: 20 * k }}>
                <div style={{ width: 40 * k, height: 5 * k, borderRadius: 9, background: C.sabbia, margin: `0 auto ${14 * k}px` }} />
                {['Copia', 'Aggiungi ai preferiti'].map((t) => (
                  <div key={t} style={{ height: 50 * k, borderBottom: `${1 * k}px solid ${C.sabbia}`, fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 17 * k, color: C.inchiostro2, display: 'flex', alignItems: 'center' }}>{t}</div>
                ))}
                <div style={{ height: 56 * k, marginTop: 8 * k, borderRadius: 14 * k, background: frame > 40 ? C.sabbia : 'transparent', fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 17 * k, color: C.inchiostro, display: 'flex', alignItems: 'center', gap: 12 * k, paddingLeft: 10 * k }}>
                  <div style={{ width: 30 * k, height: 30 * k, borderRadius: 8 * k, border: `${2 * k}px solid ${C.inchiostro}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 * k, lineHeight: 1 }}>+</div>
                  Aggiungi alla schermata Home
                </div>
              </div>
              <Tap x={190} y={645} at={44} k={k} />
            </div>
            {/* schermata Home */}
            <div style={{ position: 'absolute', inset: 0, opacity: home, background: `linear-gradient(160deg, ${C.pesca}, ${C.menta})` }}>
              <div style={{ position: 'absolute', left: 24 * k, top: 120 * k, width: 342 * k, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 26 * k, justifyItems: 'center' }}>
                {['#ffffff', C.salvia, C.arancioVivo, C.teal, C.crema, C.ocra, C.terracotta, '#ffffff', C.menta, C.sabbia, C.inchiostro2].map((c, i) => (
                  <IconSquare key={i} c={c} k={k} label="" />
                ))}
                <div style={{ width: 70 * k, textAlign: 'center', transform: `scale(${Math.max(0, ic)})` }}>
                  <div style={{ width: 62 * k, height: 62 * k, margin: '0 auto', borderRadius: 15 * k, background: C.menta, overflow: 'hidden', boxShadow: `0 0 0 ${3 * k}px ${C.crema}, 0 8px 18px rgba(58,44,33,0.35)` }}>
                    <Img src={staticFile('img/mascot-avatar.webp')} style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 11 * k, color: C.crema, marginTop: 5 * k }}>Frigolo</div>
                </div>
              </div>
            </div>
          </>
        )}
      </Phone>
      <Sfx at={44} name="tic" />
      <Sfx at={72} name="plin" volume={0.5} />
    </SceneShell>
  )
}

/* 9. Cartolina finale */
export const Scene9: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const name = spring({ frame: frame - 12, fps, config: { damping: 10 } })
  const mw = L.land ? 640 : 640
  const col: React.CSSProperties = L.land
    ? { position: 'absolute', left: 900, width: 900, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }
    : { position: 'absolute', left: 60, width: 960, top: 1050, display: 'flex', flexDirection: 'column', alignItems: 'center' }
  return (
    <SceneShell {...p}>
      <Mascot kind="classica" w={mw} x={L.land ? 150 : (L.w - mw) / 2} y={L.land ? (L.h - mw) / 2 : 330} delay={2} from="pop" />
      <div style={col}>
        <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: L.land ? 190 : 200, color: C.inchiostro, lineHeight: 1, transform: `scale(${0.6 + 0.4 * Math.min(1.08, name)})`, opacity: Math.min(1, name * 2), transformOrigin: L.land ? 'left center' : 'center' }}>
          Frigolo
        </div>
        <div style={{ fontFamily: FONT_TEXT, fontWeight: 700, fontSize: L.land ? 52 : 52, color: C.inchiostro2, marginTop: 24, textAlign: L.land ? 'left' : 'center', opacity: fade(frame, 22, 10) }}>
          La lista della spesa sempre in tasca.
        </div>
        <div style={{ marginTop: 40, background: C.mattone, color: C.crema, fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 46, padding: '20px 48px', borderRadius: 999, opacity: fade(frame, 34, 10), transform: `translateY(${(1 - fade(frame, 34, 10)) * 30}px)`, boxShadow: '0 14px 30px rgba(206,95,54,0.35)' }}>
          frigolo.dascanfe.com
        </div>
      </div>
    </SceneShell>
  )
}
