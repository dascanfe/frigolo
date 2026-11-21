import React from 'react'
import { Composition } from 'remotion'
import { R1, R1Cover, R1_FPS, R1_FRAMES } from './R1'
import { FULL, SHORT, Full, Short, total } from './Compositions'

export const Root: React.FC = () => (
  <>
    <Composition id="Frigolo9x16" component={Full} durationInFrames={total(FULL)} fps={30} width={1080} height={1920} />
    <Composition id="Frigolo16x9" component={Full} durationInFrames={total(FULL)} fps={30} width={1920} height={1080} />
    <Composition id="Frigolo15s" component={Short} durationInFrames={total(SHORT)} fps={30} width={1080} height={1920} />
    <Composition id="R1" component={R1} durationInFrames={R1_FRAMES} fps={R1_FPS} width={1080} height={1920} />
    <Composition id="R1Cover" component={R1Cover} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
)
