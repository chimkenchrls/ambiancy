import { describe, expect, it } from 'vitest'
import { MAX_LAYERS, clampVolume, normaliseMix } from './mix'

const known = (id: string) => ['rain', 'wind', 'creek'].includes(id) || id.startsWith('s')

describe('clampVolume', () => {
  it('keeps values inside 0 to 100', () => {
    expect(clampVolume(40)).toBe(40)
    expect(clampVolume(-5)).toBe(0)
    expect(clampVolume(250)).toBe(100)
  })

  it('rounds to a whole number', () => {
    expect(clampVolume(40.6)).toBe(41)
  })

  it('turns NaN into 0 and Infinity into 100', () => {
    expect(clampVolume(Number.NaN)).toBe(0)
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(100)
  })
})

describe('normaliseMix', () => {
  it('drops sounds that are not in the catalogue', () => {
    const mix = normaliseMix(
      [
        { soundId: 'rain', volume: 70 },
        { soundId: 'nope', volume: 10 },
      ],
      known,
    )
    expect(mix).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('keeps the first of a repeated sound', () => {
    const mix = normaliseMix(
      [
        { soundId: 'rain', volume: 70 },
        { soundId: 'rain', volume: 20 },
      ],
      known,
    )
    expect(mix).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('clamps volumes', () => {
    expect(normaliseMix([{ soundId: 'wind', volume: 999 }], known)).toEqual([{ soundId: 'wind', volume: 100 }])
  })

  it('keeps at most MAX_LAYERS layers', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ soundId: `s${i}`, volume: 50 }))
    const mix = normaliseMix(many, known)
    expect(mix).toHaveLength(MAX_LAYERS)
    expect(mix[0]).toEqual({ soundId: 's0', volume: 50 })
  })

  it('returns a new array and does not change the input', () => {
    const input = [{ soundId: 'rain', volume: 250 }]
    normaliseMix(input, known)
    expect(input).toEqual([{ soundId: 'rain', volume: 250 }])
  })
})
