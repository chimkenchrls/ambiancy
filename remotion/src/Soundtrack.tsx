import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion'
import voiceover from '../voice-over/ambiancyvo.mp3'
import { BEAT, FIRE, FOLD, FOREST, RAIN, lerp, level, ramp, said } from './timeline'

/* Everything but the voice is held well under it so the words sit on top,
   then comes up for the close once the last word ("free", ending 26.74) is out. */
const underVoice = (t: number) => lerp(0.3, 0.75, ramp(t, 26.8, 27.6))

/* Effects, each on the spoken word that the picture moves to. Times in seconds. */
const effects: { at: number; file: string; volume: number; rate?: number }[] = [
  { at: said.sometimes, file: 'ping', volume: 0.5 },
  { at: said.world, file: 'ping', volume: 0.42, rate: 1.12 },
  { at: said.loud, file: 'ping', volume: 0.4, rate: 1.26 },
  // The last ripple flattens in the pause before "Noise".
  { at: 4.3, file: 'whoosh', volume: 0.5, rate: 0.85 },
  // A wave enters on each of "study", "work", "rest", "sleep".
  { at: said.study - 0.25, file: 'whoosh', volume: 0.22, rate: 1.5 },
  { at: said.work - 0.25, file: 'whoosh', volume: 0.24, rate: 1.4 },
  { at: said.rest - 0.25, file: 'whoosh', volume: 0.26, rate: 1.3 },
  { at: said.sleep - 0.25, file: 'whoosh', volume: 0.28, rate: 1.2 },
  { at: said.everything, file: 'whoosh', volume: 0.45, rate: 0.7 },
  // Rushes inwards and stops dead on the end of "fade".
  { at: said.fadeEnd - 1.1, file: 'pull', volume: 0.6 },
  { at: said.ambiancy, file: 'chime', volume: 0.5 },
  // One rising note as each sound is named.
  { at: said.rain, file: 'note', volume: 0.4 },
  { at: said.fire, file: 'note', volume: 0.4, rate: 1.125 },
  { at: said.waves, file: 'note', volume: 0.4, rate: 1.25 },
  { at: said.forest, file: 'note', volume: 0.4, rate: 1.5 },
  { at: said.cafe, file: 'note', volume: 0.4, rate: 1.6875 },
  // The dials turning up.
  { at: said.rain, file: 'fill', volume: 0.26, rate: 0.75 },
  { at: said.create, file: 'fill', volume: 0.28, rate: 0.95 },
  { at: said.calm, file: 'blip', volume: 0.3 },
  { at: said.calm + 0.3, file: 'fill', volume: 0.28, rate: 1.4 },
  { at: said.personal, file: 'blip', volume: 0.3, rate: 1.12 },
  { at: said.personal + 0.3, file: 'fill', volume: 0.28, rate: 1.6 },
  { at: said.yours, file: 'chime', volume: 0.32, rate: 1.5 },
  { at: FOLD, file: 'whoosh', volume: 0.4, rate: 0.8 },
  { at: said.ambiancyAgain, file: 'chime', volume: 0.5, rate: 0.75 },
  { at: BEAT, file: 'pulse', volume: 0.8 },
]

/* The ambience layers follow the dials: each sound is heard as it is turned up. */
const layers = [
  { file: 'rain', sound: RAIN, full: 0.6, volume: 0.34 },
  { file: 'fire', sound: FIRE, full: 0.35, volume: 0.4 },
  { file: 'forest', sound: FOREST, full: 0.2, volume: 0.36 },
]

const LAYERS_FROM = 15.5

export function Soundtrack() {
  const { fps } = useVideoConfig()
  return (
    <>
      <Audio src={voiceover} />
      <Audio src={staticFile('audio/music.wav')} volume={(f) => 0.85 * underVoice(f / fps)} />

      {layers.map((layer) => (
        <Sequence key={layer.file} from={LAYERS_FROM * fps} layout="none">
          <Audio
            src={staticFile(`audio/${layer.file}.wav`)}
            volume={(f) => {
              const t = LAYERS_FROM + f / fps
              return (level(layer.sound, t) / layer.full) * layer.volume * underVoice(t) * (1 - ramp(t, FOLD, FOLD + 1.8))
            }}
          />
        </Sequence>
      ))}

      {effects.map((effect, n) => (
        <Sequence key={n} from={Math.round(effect.at * fps)} layout="none">
          <Audio src={staticFile(`audio/${effect.file}.wav`)} volume={effect.volume * underVoice(effect.at)} playbackRate={effect.rate ?? 1} />
        </Sequence>
      ))}
    </>
  )
}
