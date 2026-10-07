import { Easing } from 'remotion'
import { AbsoluteFill } from 'remotion'
import { colors, fonts } from '../theme'
import { DURATION, ramp } from './timeline'

/* The voiceover, word for word. Each sentence is a bold line and a second
   line; every word comes up at the moment it is spoken (times in seconds,
   from voice-over/ambiancyvo.words.json), and the pair clears in the pause
   before the next sentence. */
type Word = [text: string, at: number]

const sentences: { lines: [Word[], Word[]]; until: number; closing?: boolean }[] = [
  {
    until: 4.8,
    lines: [
      [['Sometimes,', 0.13]],
      [['the', 1.27], ['world', 1.4], ['feels', 1.6], ['a', 1.86], ['little', 2.04], ['too', 2.26], ['loud.', 2.56]],
    ],
  },
  {
    until: 9.6,
    lines: [
      [['Noise', 5.05], ['follows', 5.25], ['you', 5.6]],
      [['into', 5.84], ['study,', 6.06], ['work,', 6.95], ['rest,', 7.74], ['and', 8.37], ['sleep.', 8.58]],
    ],
  },
  {
    until: 14.1,
    lines: [
      [['And', 9.72], ['when', 9.82], ['everything', 9.92], ['competes', 10.32], ['for', 10.76], ['attention,', 10.9]],
      [['focus', 11.98], ['starts', 12.14], ['to', 12.46], ['fade.', 12.7]],
    ],
  },
  {
    until: 19.7,
    lines: [
      [['With', 14.39], ['Ambiancy,', 14.5]],
      [['blend', 15.5], ['rain,', 15.64], ['fire,', 16.39], ['waves,', 17.14], ['forest,', 17.85], ['and', 18.42], ['café', 18.58], ['sounds.', 18.84]],
    ],
  },
  {
    until: 23.75,
    lines: [
      [['Create', 19.82], ['a', 20], ['space', 20.16], ['that', 20.38], ['feels', 20.6]],
      [['calm,', 20.82], ['personal,', 21.61], ['and', 22.26], ['completely', 22.36], ['yours.', 22.88]],
    ],
  },
  {
    until: DURATION + 1,
    closing: true,
    lines: [
      [['Find', 23.96], ['your', 24.12], ['ambience', 24.4], ['with', 24.95], ['Ambiancy.', 25.2]],
      [['Mix', 26.22], ['it', 26.34], ['free.', 26.52]],
    ],
  },
]

export function Captions({ t }: { t: number }) {
  return (
    <AbsoluteFill>
      {sentences.map((sentence, n) => {
        const leaving = 1 - ramp(t, sentence.until - 0.45, sentence.until)
        if (t < sentence.lines[0][0][1] - 0.1 || leaving <= 0) return null
        return sentence.lines.map((words, row) => (
          <div
            key={`${n}-${row}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: row ? 946 : 862,
              textAlign: 'center',
              fontSize: row ? 40 : 64,
              fontWeight: row ? fonts.weight.regular : fonts.weight.bold,
              lineHeight: fonts.lineHeight.heading,
              letterSpacing: row ? undefined : fonts.letterSpacing.hero,
              color: row ? (sentence.closing ? colors.accent : colors.textMuted) : colors.textHeading,
              opacity: leaving,
            }}
          >
            {words.map(([text, at], w) => {
              const spoken = ramp(t, at - 0.06, at + 0.28, Easing.out(Easing.cubic))
              return (
                <span key={w} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: spoken, transform: `translateY(${(1 - spoken) * 18}px)` }}>
                  {w ? ` ${text}` : text}
                </span>
              )
            })}
          </div>
        ))
      })}
    </AbsoluteFill>
  )
}
