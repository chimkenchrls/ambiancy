/* Everything that more than one layer needs to agree on: the frame, the scene
   times, where the cards and dials are, and where the dot is at any moment.
   All times are in seconds, and are set by the voiceover: `said` holds the
   moment each cue word is spoken (see voice-over/ambiancyvo.words.json).
   tools/make-audio.mjs mirrors the scene times. */

import { Easing, interpolate } from 'remotion'
import { motion, videoScale } from '../theme'

export const FPS = 30
export const DURATION = 29
export const W = 1920
export const H = 1080
export const CX = W / 2
export const CY = H / 2
export const S = videoScale

export type Point = { x: number; y: number }

export const ease = Easing.bezier(...motion.ease)
const inOut = Easing.inOut(Easing.cubic)

/** 0 before `from`, 1 after `to`, eased in between. */
export const ramp = (t: number, from: number, to: number, easing: (k: number) => number = inOut) =>
  interpolate(t, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export const mix = (a: Point, b: Point, k: number): Point => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) })

/** A repeatable pseudo-random number in [0, 1) for a given seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const centre: Point = { x: CX, y: CY }

/* ---------- The voiceover ---------- */

export const said = {
  sometimes: 0.13,
  world: 1.34,
  loud: 2.56,
  noise: 5.05,
  study: 6.06,
  work: 6.95,
  rest: 7.74,
  sleep: 8.58,
  everything: 9.92,
  attention: 10.9,
  focus: 11.98,
  fade: 12.7,
  fadeEnd: 12.96,
  with: 14.39,
  ambiancy: 14.5,
  rain: 15.64,
  fire: 16.39,
  waves: 17.14,
  forest: 17.85,
  cafe: 18.58,
  create: 19.82,
  calm: 20.82,
  personal: 21.61,
  completely: 22.36,
  yours: 22.88,
  find: 23.96,
  ambiancyAgain: 25.2,
  mix: 26.22,
} as const

// The mixer starts folding away in the pause before "Find your ambience".
export const FOLD = 23.6
// The dot's last pulse, after "mix it free".
export const BEAT = 27.8

/* ---------- Camera ---------- */

/** One slow move: in on the dot, back for the noise, in on the knot, then deeper into the mixer. */
export const cameraScale = (t: number) =>
  interpolate(t, [0, 4.9, 6.8, 9.7, 12.9, 15.4, said.create, FOLD, 25.6, DURATION], [1, 1.16, 0.94, 0.94, 1.07, 1, 1, 1.06, 1, 1.03], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  })

/* ---------- Scene 2: the main waveform the dot rides ---------- */

export const WAVE_WIDTH = 2300

export const mainWave = (u: number, t: number) =>
  46 * ramp(t, said.noise - 0.05, said.noise + 0.85) * (0.7 * Math.sin(Math.PI * 2 * u * 2.2 - t * 2.4) + 0.3 * Math.sin(Math.PI * 2 * u * 5.1 + t * 1.7))

/* ---------- Scenes 4 and 5: the mixer ---------- */

export const sounds = [
  { id: 'waves', name: 'Waves' },
  { id: 'fireplace', name: 'Fireplace' },
  { id: 'rain', name: 'Rain' },
  { id: 'forest', name: 'Forest' },
  { id: 'cafe', name: 'Café' },
] as const

export const RAIN = 2
export const FIRE = 1
export const FOREST = 3

export const CARD_W = 250
export const CARD_H = 340
export const DIAL_R = 70
// The dial sits above the middle of its card.
const DIAL_RISE = 62

export const LOGO_Y = 480

// Cards further from the middle sit a little further back.
const depth = [
  { scale: 0.94, y: 16 },
  { scale: 1, y: -8 },
  { scale: 1.07, y: 0 },
  { scale: 1, y: -8 },
  { scale: 0.94, y: 16 },
]

// Rain rises under the ring; each of the others slides out as its name is spoken.
const arrives = [said.waves, said.fire, 15.02, said.forest, said.cafe]

// A brief swell that peaks a tenth of a second after `x` passes zero.
const swell = (x: number) => (x < 0 ? 0 : x * 10 * Math.exp(1 - x * 10))

export function card(i: number, t: number) {
  const open = ramp(t, arrives[i] - 0.12, arrives[i] + 0.65, ease)
  const close = ramp(t, FOLD, FOLD + 1.2)
  const spacing = lerp(286, 304, ramp(t, said.create, 22))
  const named = i === RAIN ? 1 + 0.045 * swell(t - said.rain) : 1
  const bob = Math.sin(t * 0.9 + i * 1.7) * 5
  const rest = { x: CX + (i - 2) * spacing, y: 495 + depth[i].y + bob }
  const opened = mix(centre, rest, open)
  const at = mix(opened, { x: CX, y: LOGO_Y }, close)
  return {
    ...at,
    scale: lerp(0.7, depth[i].scale, open) * lerp(1, 0.45, close) * named,
    opacity: open * (1 - ramp(t, FOLD + 0.6, FOLD + 1.3)),
  }
}

export function dial(i: number, t: number) {
  const c = card(i, t)
  return { x: c.x, y: c.y - DIAL_RISE * c.scale, r: DIAL_R * c.scale }
}

/** How far each sound is turned up, from 0 to 1. */
export function level(i: number, t: number) {
  if (i === RAIN) return 0.3 * ramp(t, said.rain, said.rain + 0.95) + 0.3 * ramp(t, said.create, said.create + 0.9)
  if (i === FIRE) return 0.35 * ramp(t, said.calm + 0.3, said.calm + 0.8)
  if (i === FOREST) return 0.2 * ramp(t, said.personal + 0.3, said.personal + 0.75)
  return 0
}

/** The point on a dial's rim that marks its current level, starting from the top and going clockwise. */
function knob(i: number, t: number): Point {
  const d = dial(i, t)
  const angle = -Math.PI / 2 + Math.PI * 2 * level(i, t)
  return { x: d.x + d.r * Math.cos(angle), y: d.y + d.r * Math.sin(angle) }
}

/* ---------- The ring that the knot becomes, and that becomes the Rain dial ---------- */

export const RING_R = 60

export function ring(t: number) {
  const d = dial(RAIN, t)
  const at = mix(centre, d, ramp(t, 14.34, 15.3))
  const r = interpolate(t, [14.34, 14.8, 15.4], [RING_R, 112, d.r], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  })
  return { ...at, r }
}

/* ---------- Scene 6: the wave under the logo ---------- */

export const LINE_Y = 650
export const LINE_FROM = 660
export const LINE_TO = 1260

/* ---------- The dot ---------- */

// Travels in a shallow arc rather than a straight line.
const hop = (a: Point, b: Point, k: number, lift: number): Point => {
  const p = mix(a, b, k)
  return { x: p.x, y: p.y - lift * Math.sin(Math.PI * Math.min(1, Math.max(0, k))) }
}

export function dot(t: number): Point {
  if (t < 4.9) return centre

  if (t < 14.3) {
    // Riding the main waveform: back as the camera pulls out, then pushing forward in fits and starts.
    const back = lerp(CX, 560, ramp(t, 4.9, 5.9))
    const forward = lerp(0, 730, ramp(t, 5.9, 9.7, Easing.inOut(Easing.quad))) + 26 * Math.sin(t * 2.1) * ramp(t, 6.1, 7)
    const x = back + forward
    const riding = { x, y: CY + mainWave((x - CX) / WAVE_WIDTH + 0.5, t) }
    // Then pulled into the knot, where it wanders and slows to a stop.
    const caught = ramp(t, said.everything, said.attention + 0.2)
    const restless = 1 - ramp(t, 11.4, 12.6)
    const trapped = { x: CX + 20 * Math.sin(t * 2.3) * restless, y: CY + 14 * Math.cos(t * 1.7) * restless }
    return mix(riding, trapped, caught)
  }

  // Carried by the ring to the Rain dial, then out to its rim, where it becomes the knob.
  const inRing: Point = ring(t)
  const onRain = mix(inRing, knob(RAIN, t), ramp(t, 15.4, 15.95, Easing.out(Easing.back(1.6))))
  const onFire = hop(onRain, knob(FIRE, t), ramp(t, said.calm, said.calm + 0.42), 46)
  const onForest = hop(onFire, knob(FOREST, t), ramp(t, said.personal, said.personal + 0.42), 46)
  // Leaves the mixer and draws the line under the logo.
  const leaving = hop(onForest, { x: LINE_FROM, y: LINE_Y }, ramp(t, 24.5, 26.1), -40)
  return { x: lerp(leaving.x, LINE_TO, ramp(t, said.mix, 27.5)), y: leaving.y }
}
