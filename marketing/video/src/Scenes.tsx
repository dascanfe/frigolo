import React from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, FONT_TEXT, FONT_TITLE } from './theme'
import { Chip, Confetti, Headline, Mascot, Phone, PhoneClip, SceneShell, Sfx, Tap, clipInfo, useLayout } from './ui'

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
      <Headline text="Chi compra|*il latte?*" delay={6} size={120} top={250} />
      <Mascot kind="pensierosa" w={mw} x={L.land ? 120 : (L.w - mw) / 2} y={L.land ? L.h - mw + 40 : 880} delay={10} from="bottom" />
    </SceneShell>
  )
}

/* 2. Catalogo: tocca un prodotto (clip vera: Banane, Fragole, Kiwi) */
export const Scene2: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="Tocca un prodotto:|*è in lista.*" />
      <Phone {...L.phone} delay={4}>{(k) => <PhoneClip name="catalogo" k={k} lead={0.6} />}</Phone>
    </SceneShell>
  )
}

/* 3. Due telefoni: Giulia aggiunge l'Ananas, sul telefono di Lele compare l'Ananas (clip vere, in parallelo) */
export const Scene3: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const w = L.land ? 430 : 490
  const cxL = L.land ? 240 : 275
  const cxR = L.land ? 690 : 805
  const top = L.land ? 130 : 690
  const g = clipInfo('due-giulia')
  const lead = 0.8
  const s0 = g.taps[0].t - lead
  return (
    <SceneShell {...p}>
      <Headline text="Chi fa la spesa|con te *lo vede subito.*" size={88} />
      <Phone w={w} cx={cxL} top={top} ry={12} rx={3} delay={2} floatPhase={0}>
        {(k) => <PhoneClip name="due-giulia" k={k} lead={lead} />}
      </Phone>
      <Phone w={w} cx={cxR} top={top} ry={-12} rx={3} delay={6} floatPhase={2}>
        {(k) => <PhoneClip name="due-lele" k={k} lead={lead} sfx={null} />}
      </Phone>
      <Chip text="Giulia aggiunge l'Ananas" x={cxL} y={top - 70} delay={14} />
      <Chip text="Sul telefono di Lele" x={cxR} y={top - 70} delay={20} color={C.arancio} fg={C.crema} />
      <Sfx at={Math.round((g.taps[0].t - s0) * 30) + 14} name="plin" />
    </SceneShell>
  )
}

/* 4. In ordine di corsia (clip vera: scorre la lista) */
export const Scene4: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="In ordine di corsia:|i *surgelati* alla fine." />
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="corsia" k={k} lead={0.5} />}</Phone>
    </SceneShell>
  )
}

/* 5. Nel carrello: al tocco il prodotto passa subito nella sezione "Nel carrello" in basso */
export const Scene5: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="Preso? Un tocco|ed è nel *carrello.*" />
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="carrello" k={k} lead={0.5} sfx="tic2" />}</Phone>
    </SceneShell>
  )
}

/* 6. Spesa finita + coriandoli (clip vera: bottone, conferma, messaggio) */
export const Scene6: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = clipInfo('finita')
  const lead = 0.5
  const s0 = f.taps[0].t - lead
  const done = Math.round((f.taps[1].t - s0) * 30) + 6
  const pop = spring({ frame: frame - done, fps, config: { damping: 8, stiffness: 120 } })
  const mw = L.land ? 440 : 560
  return (
    <SceneShell {...p}>
      <div style={{ position: 'absolute', left: L.title.x, width: L.title.w, top: L.land ? undefined : 250, ...(L.land ? { top: 0, bottom: 0, display: 'flex', alignItems: 'center' } : {}) }}>
        <div style={{ width: '100%', textAlign: L.title.align, fontFamily: FONT_TITLE, fontWeight: 700, fontSize: L.land ? 130 : 150, lineHeight: 1.05, color: C.inchiostro, transform: `scale(${0.6 + 0.4 * Math.min(1.1, fade(frame, 6) * (frame > done ? pop : 1))})`, transformOrigin: L.land ? 'left center' : 'center', opacity: fade(frame, 6) }}>
          Spesa <span style={{ fontStyle: 'italic', color: C.mattone }}>finita</span>
        </div>
      </div>
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="finita" k={k} lead={lead} />}</Phone>
      <Mascot kind="contenta" w={mw} x={L.land ? 700 : 600} y={L.land ? L.h - mw - 20 : 1260} delay={done + 4} from={L.land ? 'bottom' : 'right'} />
      <Confetti at={done} cx={L.land ? 960 : 540} cy={L.land ? 420 : 760} />
      <Sfx at={done} name="tada" volume={0.8} />
    </SceneShell>
  )
}

/* 7. Più liste, più persone (clip vera: cambio lista) */
export const Scene7: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="Per conto tuo|o in *compagnia.*" top={250} />
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="liste" k={k} lead={0.6} />}</Phone>
    </SceneShell>
  )
}

/* 7b. Analitiche (clip vera: spese per mese e andamento) */
export const Scene7b: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="Le tue spese,|*mese per mese.*" top={250} />
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="analitiche" k={k} lead={0.5} />}</Phone>
    </SceneShell>
  )
}

/* 7c. Temi (clip vera: scelta del colore nelle Impostazioni) */
export const Scene7c: React.FC<SceneProps> = (p) => {
  const L = useLayout()
  return (
    <SceneShell {...p}>
      <Headline text="Sei colori,|scegli il *tuo.*" top={250} />
      <Phone {...L.phone} delay={0}>{(k) => <PhoneClip name="temi" k={k} lead={0.5} themeStrip />}</Phone>
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
              <div style={{ position: 'absolute', left: 16 * k, right: 16 * k, top: 58 * k, height: 40 * k, borderRadius: 14 * k, background: C.crema, border: `${1 * k}px solid ${C.sabbia}`, fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 15 * k, color: C.inchiostro2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>frigolo.dascanfe.com</div>
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
            <Img src={staticFile('img/overlay.png')} style={{ position: 'absolute', left: 0, top: 0, width: 390 * k, height: 844 * k }} />
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
