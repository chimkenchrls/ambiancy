import { Easing } from 'remotion'
import { colors, fonts, palette } from '../theme'
import { CX, CY, H, RING_R, W, WAVE_WIDTH, lerp, mainWave, rand, ramp, ring, said } from './timeline'

const TAU = Math.PI * 2

/* Scene 1: a ripple leaves the dot on "Sometimes", "world" and "loud". The last
   one does not fade: it stretches sideways until it is flat, and the main
   waveform grows out of that line as the voice says "Noise". */
export function Ripples({ t }: { t: number }) {
  const stretch = ramp(t, 4.3, 5.4)
  const last = ramp(t, 3.6, 4.3, Easing.out(Easing.cubic))

  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {[said.sometimes, said.world, said.loud].map((start) => {
        const age = (t - start) / 3.4
        if (age <= 0 || age >= 1) return null
        const grown = Easing.out(Easing.cubic)(age)
        return (
          <circle key={start} cx={CX} cy={CY} r={560 * grown} fill="none" stroke={palette.lavender} strokeWidth={2} opacity={0.5 * (1 - age) ** 1.5} />
        )
      })}
      {t > 3.6 && t < 5.7 && (
        <ellipse
          cx={CX}
          cy={CY}
          rx={lerp(170 * last, 1250, stretch)}
          ry={170 * last * (1 - stretch)}
          fill="none"
          stroke={palette.lavender}
          strokeWidth={2.5}
          opacity={0.75 * last * (1 - ramp(t, 5.2, 5.7))}
        />
      )}
    </svg>
  )
}

/* The wordmark, barely there, behind the first ripples. */
export function FaintWordmark({ t }: { t: number }) {
  const opacity = 0.09 * ramp(t, 1.6, 3.4) * (1 - ramp(t, 4.1, 4.9))
  if (opacity <= 0) return null
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        fontSize: 280,
        fontWeight: fonts.weight.bold,
        color: palette.white,
        opacity,
        filter: 'blur(5px)',
        transform: `scale(${lerp(0.96, 1.02, ramp(t, 1.6, 4.9))})`,
      }}
    >
      <span>
        Ambian<span style={{ color: palette.lilac }}>cy.</span>
      </span>
    </div>
  )
}

/* Scenes 2 and 3: the main waveform and six competing sounds, the last four
   arriving on "study", "work", "rest" and "sleep". Each line is one curve with
   three shapes — a waveform, a loop of the knot, and the ring — and moves
   between them, so the same lines carry all three scenes. */
type Wave = { y: number; color: string; width: number; from: number; shape: (u: number, t: number) => number }

const waves: Wave[] = [
  { y: 0, color: palette.lavender, width: 3.5, from: 5, shape: (u, t) => mainWave(u, t) },
  {
    y: -255,
    color: palette.lilac,
    width: 2,
    from: 5.3,
    shape: (u, t) => 24 * Math.sign(Math.sin(u * 150 - t * 6)) * (Math.sin(u * 14 - t * 1.3) > 0 ? 1 : 0.12),
  },
  { y: -170, color: palette.violet, width: 2.5, from: 5.7, shape: (u, t) => 30 * Math.sin(u * 11 - t * 0.8) + 11 * Math.sin(u * 29 + t * 1.9) },
  {
    y: -85,
    color: palette.muted,
    width: 2,
    from: said.study,
    shape: (u, t) => -58 * Math.max(0, Math.sin(u * 36 - t * 2.2)) ** 22 + 4 * Math.sin(u * 90 + t),
  },
  { y: 85, color: palette.lilac, width: 2, from: said.work, shape: (u, t) => 28 * Math.sin(u * 120 - t * 5) * Math.sin(u * 15 + t * 1.5) },
  { y: 170, color: palette.lilac, width: 2, from: said.rest, shape: (u, t) => 15 * Math.sin(u * 380 + t * 9) * Math.sin(u * 217 - t * 7) },
  {
    y: 255,
    color: palette.muted,
    width: 2,
    from: said.sleep,
    shape: (u, t) => 20 * (rand(Math.floor(u * 260) + Math.floor(t * 15) * 997) * 2 - 1),
  },
]

const SAMPLES = 240

function wavePath(wave: Wave, i: number, t: number) {
  const shown = ramp(t, wave.from, wave.from + 0.6)
  const chaos = i === 0 ? 0 : ramp(t, 6, 9.7)
  const knot = ramp(t, said.everything + i * 0.06, said.attention + 0.2 + i * 0.06)
  // It collapses into the ring as the voice says "starts to fade".
  const toRing = ramp(t, 12.25, said.fadeEnd, Easing.in(Easing.quad))
  // The knot holds still just before it collapses.
  const tk = Math.min(t, 12.4)
  const turns = 1 + (i % 3)
  const reach = (120 + 14 * i) * (1 + 0.08 * Math.sin(tk * (2 + i * 0.7)))

  let d = ''
  for (let n = 0; n <= SAMPLES; n++) {
    const u = n / SAMPLES
    const offset = (wave.shape(u, t) * (1 + 0.9 * chaos) + chaos * 16 * Math.sin(u * 21 * (i + 1) + t * (3 + i))) * shown
    const flatX = CX + (u - 0.5) * WAVE_WIDTH
    const flatY = CY + wave.y + offset

    const angle = TAU * u * turns + i * 0.9 + tk * (0.5 + i * 0.13)
    const r = reach * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * u * (2 + i) + tk * 1.1 + i)))
    const x = lerp(lerp(flatX, CX + r * Math.cos(angle), knot), CX + RING_R * Math.cos(angle), toRing)
    const y = lerp(lerp(flatY, CY + r * Math.sin(angle), knot), CY + RING_R * Math.sin(angle), toRing)
    d += `${n ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return { d, shown, knot }
}

export function Waves({ t }: { t: number }) {
  if (t < 4.95 || t > 13.3) return null
  const fade = 1 - ramp(t, 12.9, 13.25)

  return (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {waves.map((wave, i) => {
          const { d, shown, knot } = wavePath(wave, i, t)
          if (shown <= 0) return null
          const opacity = shown * fade * (i === 0 ? 1 : lerp(0.75, 0.9, knot))
          return (
            <g key={i} opacity={opacity} fill="none" strokeLinejoin="round" strokeLinecap="round">
              {i === 0 && <path d={d} stroke={palette.lilac} strokeWidth={14} opacity={0.18} />}
              <path d={d} stroke={wave.color} strokeWidth={wave.width} />
            </g>
          )
        })}
      </svg>

      <Symbols t={t} />
      <Words t={t} />
    </>
  )
}

/* Small marks of sound drifting through the noise, drawn in before the knot swallows them. */
function Symbols({ t }: { t: number }) {
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {Array.from({ length: 12 }, (_, i) => {
        const pulled = ramp(t, said.everything, 11.2, Easing.in(Easing.quad))
        const opacity = 0.4 * ramp(t, 5.4 + i * 0.25, 6.4 + i * 0.25) * (1 - pulled)
        if (opacity <= 0) return null
        const x = lerp(240 + rand(i + 20) * (W - 480) + 34 * Math.sin(t * 0.5 + i), CX, pulled)
        const y = lerp(170 + rand(i + 40) * 620 - (t - 5.4) * (6 + rand(i + 60) * 10), CY, pulled)
        const color = i % 2 ? palette.lilac : palette.muted
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rand(i + 80) * 50 - 25})`} opacity={opacity} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
            {i % 3 === 0 && (
              <>
                <path d="M0 -7a10 10 0 0 1 0 14" />
                <path d="M8 -14a20 20 0 0 1 0 28" />
                <path d="M16 -21a30 30 0 0 1 0 42" />
              </>
            )}
            {i % 3 === 1 && [0, 1, 2, 3].map((b) => <path key={b} d={`M${b * 9} ${-6 - rand(i * 7 + b) * 16}V${6 + rand(i * 9 + b) * 16}`} />)}
            {i % 3 === 2 && (
              <>
                <circle r={5} fill={color} stroke="none" />
                <circle r={14} />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* The four places the noise follows you. Each word appears on its own wave as
   it is spoken, is drawn into orbit around the knot, and is thrown clear on
   "focus starts to fade". */
const followed = [
  { word: 'study', at: said.study, wave: 3 },
  { word: 'work', at: said.work, wave: 4 },
  { word: 'rest', at: said.rest, wave: 5 },
  { word: 'sleep', at: said.sleep, wave: 6 },
]

function Words({ t }: { t: number }) {
  const gathered = ramp(t, said.everything, said.attention + 0.3)
  const thrown = ramp(t, said.focus, said.fade + 0.2, Easing.in(Easing.cubic))
  return (
    <>
      {followed.map(({ word, at, wave }, j) => {
        const arrived = ramp(t, at - 0.05, at + 0.3, Easing.out(Easing.cubic))
        const opacity = arrived * (1 - thrown) ** 2
        if (opacity <= 0) return null
        const angle = (j * TAU) / 4 + t * 0.75
        const reach = 1 + thrown * 1.2
        return (
          <div
            key={word}
            style={{
              position: 'absolute',
              left: lerp(330 + j * 400, CX + 370 * reach * Math.cos(angle), gathered),
              top: lerp(CY + waves[wave].y - 62 + (1 - arrived) * 18, CY - 20 + 205 * reach * Math.sin(angle), gathered),
              transform: 'translate(-50%, -50%)',
              fontSize: 40,
              fontWeight: fonts.weight.bold,
              color: colors.textBody,
              // A dark halo keeps the word readable where a wave runs behind it.
              textShadow: `0 0 8px ${palette.black}, 0 0 22px ${palette.black}`,
              opacity,
              filter: `blur(${thrown * 6}px)`,
            }}
          >
            {word}
          </div>
        )
      })}
    </>
  )
}

/* Scene 3 into 4: the knot's lines settle into one ring, which swells, drifts
   up and lands as the Rain dial. */
export function Ring({ t }: { t: number }) {
  const opacity = ramp(t, 12.6, said.fadeEnd) * (1 - ramp(t, 15.35, 15.8))
  if (opacity <= 0) return null
  const { x, y, r } = ring(t)
  const breath = 1 + 0.025 * Math.sin(t * 3)
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} opacity={opacity}>
      <circle cx={x} cy={y} r={r * breath} fill="none" stroke={palette.lilac} strokeWidth={22} opacity={0.16} />
      <circle cx={x} cy={y} r={r * breath} fill="none" stroke={palette.lilac} strokeWidth={10} opacity={0.25} />
      <circle cx={x} cy={y} r={r * breath} fill="none" stroke={palette.lavender} strokeWidth={4} />
    </svg>
  )
}
