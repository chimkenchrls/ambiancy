// Synthesises the video's music bed, ambience layers and sound effects into public/audio/.
// Everything is generated from seeded noise and sine waves, so the output is the same on every run.
// The times below mirror src/timeline.ts.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SR = 44100
const outDir = fileURLToPath(new URL('../public/audio/', import.meta.url))
mkdirSync(outDir, { recursive: true })

const TAU = Math.PI * 2
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => {
  const k = clamp01(x)
  return k * k * (3 - 2 * k)
}
const ramp = (t, from, to) => smooth((t - from) / (to - from))

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * SR))

function noise(seconds, seed) {
  const random = rng(seed)
  const out = buffer(seconds)
  for (let i = 0; i < out.length; i++) out[i] = random() * 2 - 1
  return out
}

// State-variable filter; `cutoff` may be a number or a function of time in seconds.
function filter(input, mode, cutoff, q = 0.7) {
  const out = new Float32Array(input.length)
  let low = 0
  let band = 0
  for (let i = 0; i < input.length; i++) {
    const hz = typeof cutoff === 'function' ? cutoff(i / SR) : cutoff
    const f = 2 * Math.sin((Math.PI * Math.min(hz, 7000)) / SR)
    const high = input[i] - low - band / q
    band += f * high
    low += f * band
    out[i] = mode === 'low' ? low : mode === 'high' ? high : band
  }
  return out
}

// A small Schroeder reverb: four combs and two all-passes per channel.
function reverb(input, mix, decay, offset) {
  const combs = [1557, 1617, 1491, 1422].map((n) => n + offset)
  const out = new Float32Array(input.length)
  for (const length of combs) {
    const line = new Float32Array(length)
    let damp = 0
    for (let i = 0; i < input.length; i++) {
      const j = i % length
      const delayed = line[j]
      damp = delayed * 0.7 + damp * 0.3
      line[j] = input[i] + damp * decay
      out[i] += delayed * 0.25
    }
  }
  for (const length of [225 + offset, 556 + offset]) {
    const line = new Float32Array(length)
    for (let i = 0; i < out.length; i++) {
      const j = i % length
      const delayed = line[j]
      line[j] = out[i] + delayed * 0.5
      out[i] = delayed - out[i] * 0.5
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = input[i] * (1 - mix) + out[i] * mix
  return out
}

function writeWav(name, left, right, peak = 0.8) {
  let max = 0
  for (let i = 0; i < left.length; i++) max = Math.max(max, Math.abs(left[i]), Math.abs(right[i]))
  const gain = max > 0 ? peak / max : 1
  const data = Buffer.alloc(44 + left.length * 4)
  data.write('RIFF', 0)
  data.writeUInt32LE(36 + left.length * 4, 4)
  data.write('WAVEfmt ', 8)
  data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20)
  data.writeUInt16LE(2, 22)
  data.writeUInt32LE(SR, 24)
  data.writeUInt32LE(SR * 4, 28)
  data.writeUInt16LE(4, 32)
  data.writeUInt16LE(16, 34)
  data.write('data', 36)
  data.writeUInt32LE(left.length * 4, 40)
  for (let i = 0; i < left.length; i++) {
    data.writeInt16LE(Math.round(left[i] * gain * 32767), 44 + i * 4)
    data.writeInt16LE(Math.round(right[i] * gain * 32767), 46 + i * 4)
  }
  writeFileSync(outDir + name, data)
  console.log('wrote', name)
}

// Adds a decaying sine to both channels. `pan` runs from -1 (left) to 1 (right).
function pluck(left, right, at, hz, amp, decay, pan = 0) {
  const start = Math.floor(at * SR)
  const length = Math.floor(decay * 6 * SR)
  for (let i = 0; i < length && start + i < left.length; i++) {
    const t = i / SR
    const attack = Math.min(1, t / 0.006)
    const v = (Math.sin(TAU * hz * t) + 0.3 * Math.sin(TAU * hz * 2 * t)) * Math.exp(-t / decay) * attack * amp
    left[start + i] += v * (1 - pan) * 0.5
    right[start + i] += v * (1 + pan) * 0.5
  }
}

/* ---------- Music bed: 29 seconds, following the voiceover's six sentences ---------- */

function music() {
  const seconds = 29
  const left = buffer(seconds)
  const right = buffer(seconds)
  const random = rng(7)

  // The end of "fade", where the noise stops and the ring forms; then "Ambiancy".
  const noisy = 5.05
  const still = 12.96
  const reveal = 14.5

  const hiss = filter(noise(seconds, 11), 'band', (t) => 500 + 2600 * ramp(t, noisy, still), 1.2)
  const hissRight = filter(noise(seconds, 12), 'band', (t) => 600 + 2400 * ramp(t, noisy, still), 1.2)

  for (let i = 0; i < left.length; i++) {
    const t = i / SR
    const fadeOut = 1 - ramp(t, 27.4, 29)

    // A low drone runs underneath everything.
    const droneLevel = ramp(t, 0, 3) * (1 - 0.45 * ramp(t, still, still + 0.2)) * fadeOut
    const drone =
      Math.sin(TAU * 73.42 * t) * 0.5 +
      Math.sin(TAU * 73.72 * t) * 0.4 +
      Math.sin(TAU * 110 * t) * 0.3 +
      Math.sin(TAU * 146.83 * t) * 0.16 * (0.6 + 0.4 * Math.sin(TAU * 0.11 * t))

    // Scenes 2 and 3: clashing tones that tremble at different speeds and climb before they cut out.
    const tension = ramp(t, noisy, 12.2) * (1 - ramp(t, still, still + 0.08))
    const climb = 1 + 0.12 * ramp(t, 11.2, still)
    const clash =
      Math.sin(TAU * 155.56 * climb * t) * (0.6 + 0.4 * Math.sin(TAU * 3.1 * t)) +
      Math.sin(TAU * 207.65 * climb * t) * (0.6 + 0.4 * Math.sin(TAU * 4.3 * t)) +
      Math.sin(TAU * 277.18 * climb * t) * (0.5 + 0.5 * Math.sin(TAU * 5.7 * t)) * ramp(t, 7.5, 11.5)

    // Scene 4 onwards: a warm chord that swells in and stays.
    const pad = ramp(t, reveal, reveal + 1.6) * fadeOut
    const breathe = 0.8 + 0.2 * Math.sin(TAU * 0.17 * t)
    let chord = 0
    for (const [hz, level] of [
      [146.83, 1],
      [220, 0.8],
      [293.66, 0.7],
      [369.99, 0.55],
      [659.25, 0.18],
    ]) {
      chord += (Math.sin(TAU * hz * t) + Math.sin(TAU * hz * 1.004 * t) + 0.25 * Math.sin(TAU * hz * 2 * t)) * level
    }

    // A soft thump as the mixer opens.
    const thumpAge = t - reveal
    const thump = thumpAge > 0 ? Math.sin(TAU * (38 + 30 * Math.exp(-thumpAge * 9)) * thumpAge) * Math.exp(-thumpAge * 3.2) : 0

    const centre = drone * 0.16 * droneLevel + clash * 0.05 * tension + chord * 0.034 * pad * breathe + thump * 0.3
    left[i] = centre + hiss[i] * 0.5 * tension
    right[i] = centre + hissRight[i] * 0.5 * tension
  }

  // Typing clicks and notification pings scattered through the noisy scenes.
  for (let at = 5.3; at < still - 0.1; at += 0.05 + random() * (0.4 - 0.32 * ramp(at, 5.3, still))) {
    const pan = random() * 2 - 1
    const start = Math.floor(at * SR)
    const level = 0.03 + 0.05 * ramp(at, 5.5, still)
    for (let i = 0; i < 300; i++) {
      const v = (random() * 2 - 1) * Math.exp(-i / 60) * level
      left[start + i] += v * (1 - pan)
      right[start + i] += v * (1 + pan)
    }
  }
  for (let at = 6; at < still - 0.2; at += 0.5 + random() * 1.1) {
    const hz = [1244.5, 1396.9, 1661.2, 987.8][Math.floor(random() * 4)]
    pluck(left, right, at, hz, 0.06 + 0.05 * ramp(at, 5.5, still), 0.09, random() * 2 - 1)
  }

  // A slow pentatonic line once the mixer is open, thinning out towards the end.
  const notes = [293.66, 440, 369.99, 493.88, 587.33, 440, 659.25, 493.88, 739.99, 587.33, 440, 659.25]
  let step = 0
  for (let at = 19.4; at < 26.6; at += at < 23.6 ? 0.5 : 1) {
    pluck(left, right, at, notes[step % notes.length], 0.085 * (1 - 0.5 * ramp(at, 23.6, 26.6)), 0.42, step % 2 ? 0.5 : -0.5)
    step++
  }

  writeWav('music.wav', reverb(left, 0.3, 0.84, 0), reverb(right, 0.3, 0.84, 23), 0.82)
}

/* ---------- Ambience layers: the video fades these in as each dial rises ---------- */

function rain() {
  const seconds = 12
  const random = rng(21)
  const make = (seed) => {
    const wash = filter(filter(noise(seconds, seed), 'high', 1400, 0.7), 'low', 6000, 0.7)
    for (let n = 0; n < 900; n++) {
      const start = Math.floor(random() * (wash.length - 200))
      const level = 0.4 + random() * 1.2
      for (let i = 0; i < 120; i++) wash[start + i] += (random() * 2 - 1) * Math.exp(-i / 18) * level
    }
    return wash
  }
  writeWav('rain.wav', make(31), make(32), 0.7)
}

function fire() {
  const seconds = 12
  const random = rng(41)
  const make = (seed) => {
    const rumble = filter(noise(seconds, seed), 'low', 180, 0.7)
    const out = buffer(seconds)
    for (let i = 0; i < out.length; i++) out[i] = rumble[i] * 2.4 * (0.8 + 0.2 * Math.sin((TAU * 0.6 * i) / SR))
    const crackle = buffer(seconds)
    for (let n = 0; n < 150; n++) {
      const start = Math.floor(random() * (out.length - 400))
      const level = 0.3 + random() * random() * 1.6
      for (let i = 0; i < 220; i++) crackle[start + i] += (random() * 2 - 1) * Math.exp(-i / 22) * level
    }
    const snap = filter(crackle, 'band', 2600, 0.9)
    for (let i = 0; i < out.length; i++) out[i] += snap[i]
    return out
  }
  writeWav('fire.wav', make(51), make(52), 0.7)
}

function forest() {
  const seconds = 12
  const random = rng(61)
  const left = filter(noise(seconds, 71), 'low', (t) => 420 + 160 * Math.sin(TAU * 0.09 * t), 0.7)
  const right = filter(noise(seconds, 72), 'low', (t) => 420 + 160 * Math.sin(TAU * 0.09 * t + 1), 0.7)
  for (let i = 0; i < left.length; i++) {
    left[i] *= 0.5
    right[i] *= 0.5
  }
  // A few birds, each a short run of upward chirps.
  for (let at = 0.5; at < seconds - 1; at += 1.1 + random() * 1.8) {
    const pan = random() * 1.6 - 0.8
    const base = 2600 + random() * 1400
    const chirps = 2 + Math.floor(random() * 3)
    for (let c = 0; c < chirps; c++) {
      const start = Math.floor((at + c * 0.13) * SR)
      const length = Math.floor(0.08 * SR)
      for (let i = 0; i < length; i++) {
        const k = i / length
        const v = Math.sin(TAU * (base + 900 * k) * (i / SR)) * Math.sin(Math.PI * k) ** 2 * 0.2
        left[start + i] += v * (1 - pan)
        right[start + i] += v * (1 + pan)
      }
    }
  }
  writeWav('forest.wav', reverb(left, 0.25, 0.8, 0), reverb(right, 0.25, 0.8, 23), 0.7)
}

/* ---------- Sound effects ---------- */

function effects() {
  // Ripple: a soft bell with a long tail.
  {
    const left = buffer(3)
    const right = buffer(3)
    pluck(left, right, 0, 880, 0.5, 0.5)
    pluck(left, right, 0, 1318.5, 0.2, 0.3)
    writeWav('ping.wav', reverb(left, 0.45, 0.86, 0), reverb(right, 0.45, 0.86, 23), 0.7)
  }

  // Whoosh: filtered noise that swells and falls, for shapes stretching and cards moving.
  {
    const seconds = 1.5
    const shape = (seed) => {
      const swept = filter(noise(seconds, seed), 'band', (t) => 350 + 2600 * Math.sin((Math.PI * t) / seconds) ** 2, 1.4)
      for (let i = 0; i < swept.length; i++) swept[i] *= Math.sin((Math.PI * i) / swept.length) ** 2
      return swept
    }
    writeWav('whoosh.wav', shape(81), shape(82), 0.7)
  }

  // Pull: noise and a falling tone that rush inwards and stop dead, for the knot collapsing into a ring.
  {
    const seconds = 1.1
    const shape = (seed) => {
      const swept = filter(noise(seconds, seed), 'band', (t) => 3200 - 2700 * (t / seconds), 1.6)
      for (let i = 0; i < swept.length; i++) {
        const t = i / SR
        const grow = (t / seconds) ** 2.5 * (1 - ramp(t, seconds - 0.03, seconds))
        swept[i] = (swept[i] + 0.5 * Math.sin(TAU * (520 - 330 * (t / seconds)) * t)) * grow
      }
      return swept
    }
    writeWav('pull.wav', shape(91), shape(92), 0.7)
  }

  // Chime: a rising D major arpeggio, for the reveal and the logo.
  {
    const left = buffer(4.5)
    const right = buffer(4.5)
    ;[587.33, 739.99, 880, 1318.5].forEach((hz, n) => pluck(left, right, n * 0.07, hz, 0.4 - n * 0.06, 0.7, n % 2 ? 0.4 : -0.4))
    writeWav('chime.wav', reverb(left, 0.4, 0.88, 0), reverb(right, 0.4, 0.88, 23), 0.7)
  }

  // Fill: a gentle rising tone while a dial turns up.
  {
    const seconds = 1.3
    const left = buffer(seconds)
    let phase = 0
    for (let i = 0; i < left.length; i++) {
      const k = i / left.length
      phase += (TAU * (392 + 196 * smooth(k))) / SR
      left[i] = (Math.sin(phase) + 0.2 * Math.sin(phase * 2)) * Math.sin(Math.PI * k) ** 1.5
    }
    writeWav('fill.wav', reverb(left, 0.3, 0.8, 0), reverb(left, 0.3, 0.8, 23), 0.6)
  }

  // Note: one soft tone, pitched up a step for each sound as it is named.
  {
    const left = buffer(2.2)
    const right = buffer(2.2)
    pluck(left, right, 0, 587.33, 0.5, 0.32)
    writeWav('note.wav', reverb(left, 0.35, 0.84, 0), reverb(right, 0.35, 0.84, 23), 0.6)
  }

  // Blip: the dot hopping from one control to the next.
  {
    const left = buffer(0.9)
    const right = buffer(0.9)
    pluck(left, right, 0, 1174.7, 0.4, 0.09)
    pluck(left, right, 0.07, 1568, 0.3, 0.12)
    writeWav('blip.wav', reverb(left, 0.3, 0.8, 0), reverb(right, 0.3, 0.8, 23), 0.6)
  }

  // Pulse: the last quiet beat under the logo.
  {
    const left = buffer(2.5)
    const right = buffer(2.5)
    pluck(left, right, 0, 146.83, 0.6, 0.5)
    pluck(left, right, 0, 587.33, 0.3, 0.6)
    pluck(left, right, 0, 880, 0.18, 0.7)
    writeWav('pulse.wav', reverb(left, 0.45, 0.88, 0), reverb(right, 0.45, 0.88, 23), 0.75)
  }
}

music()
rain()
fire()
forest()
effects()
