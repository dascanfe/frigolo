import React from 'react'
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { MUSIC, MUSIC_VOLUME } from './theme'
import { Background, Fonts } from './ui'
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene7b, Scene7c, Scene8, Scene9, SceneProps } from './Scenes'

type SceneComp = React.FC<SceneProps>
interface Item { C: SceneComp; dur: number }

/** Durate in frame a 30 fps. Totale 1335 = 44,5 s. */
export const FULL: Item[] = [
  { C: Scene1, dur: 60 },
  { C: Scene2, dur: 120 },
  { C: Scene3, dur: 150 },
  { C: Scene4, dur: 120 },
  { C: Scene5, dur: 150 },
  { C: Scene6, dur: 150 },
  { C: Scene7, dur: 105 },
  { C: Scene7b, dur: 150 },
  { C: Scene7c, dur: 150 },
  { C: Scene8, dur: 90 },
  { C: Scene9, dur: 90 },
]
/** Versione breve: scene 1, 3, 6, 9. Totale 450 = 15 s. */
export const SHORT: Item[] = [
  { C: Scene1, dur: 60 },
  { C: Scene3, dur: 150 },
  { C: Scene6, dur: 150 },
  { C: Scene9, dur: 90 },
]
export const total = (items: Item[]) => items.reduce((a, b) => a + b.dur, 0)

const Story: React.FC<{ items: Item[] }> = ({ items }) => {
  const totalFrames = total(items)
  let from = 0
  return (
    <AbsoluteFill>
      <Fonts />
      <Background />
      {items.map(({ C: S, dur }, i) => {
        const f = from
        from += dur
        return (
          <Sequence key={i} from={f} durationInFrames={dur}>
            <S dur={dur} first={i === 0} last={i === items.length - 1} />
          </Sequence>
        )
      })}
      {MUSIC ? (
        <Audio
          src={staticFile(MUSIC)}
          volume={(f) => MUSIC_VOLUME * Math.min(1, f / 30) * Math.min(1, (totalFrames - f) / 60)}
        />
      ) : null}
    </AbsoluteFill>
  )
}

export const Full: React.FC = () => <Story items={FULL} />
export const Short: React.FC = () => <Story items={SHORT} />
