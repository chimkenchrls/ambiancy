import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { fonts, palette } from '../theme'
import { Atmosphere, Background, Finish } from './Background'
import { Captions } from './Captions'
import { Dot } from './Dot'
import { Logo, Mixer } from './Mixer'
import { Soundtrack } from './Soundtrack'
import { FaintWordmark, Ring, Ripples, Waves } from './Waves'
import { cameraScale, dot } from './timeline'

/* One shot, no cuts: every layer reads the same clock, and each scene's main
   shape is handed to the next (ripple, waveform, knot, ring, dial, logo).
   `captions` can be turned off to render a clean still, such as the site's poster. */
export function Journey({ captions = true }: { captions?: boolean }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const cam = cameraScale(t)

  return (
    <AbsoluteFill style={{ background: palette.black, fontFamily: fonts.family, color: palette.mist }}>
      <Background t={t} cam={cam} />
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <Atmosphere t={t} />
        <FaintWordmark t={t} />
        <Ripples t={t} />
        <Waves t={t} />
        <Mixer t={t} />
        <Ring t={t} />
        <Logo t={t} dotX={dot(t).x} />
        <Dot t={t} />
      </AbsoluteFill>
      {captions && <Captions t={t} />}
      <Finish frame={frame} />
      <Soundtrack />
    </AbsoluteFill>
  )
}
