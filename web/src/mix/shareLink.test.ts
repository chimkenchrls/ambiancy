import { describe, expect, it } from 'vitest'
import { decodeMix, encodeMix, shareUrl } from './shareLink'

const known = (id: string) =>
  ['rain', 'fireplace', 'coffee-shop', 'wind'].includes(id) || /^s\d+$/.test(id)

describe('encodeMix', () => {
  it('writes sound=volume pairs separated by commas', () => {
    expect(
      encodeMix([
        { soundId: 'rain', volume: 70 },
        { soundId: 'fireplace', volume: 40 },
      ]),
    ).toBe('rain=70,fireplace=40')
  })

  it('writes an empty string for an empty mix', () => {
    expect(encodeMix([])).toBe('')
  })
})

describe('shareUrl', () => {
  it('puts the mix after the # of /mix', () => {
    expect(shareUrl([{ soundId: 'rain', volume: 70 }], 'https://ambiancy.example')).toBe(
      'https://ambiancy.example/mix#rain=70',
    )
  })
})

describe('decodeMix', () => {
  it('reads back what encodeMix wrote', () => {
    const mix = [
      { soundId: 'rain', volume: 70 },
      { soundId: 'coffee-shop', volume: 40 },
    ]
    expect(decodeMix(encodeMix(mix), known)).toEqual(mix)
  })

  it('accepts a leading #', () => {
    expect(decodeMix('#rain=70', known)).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('returns an empty mix for an empty or bare # hash', () => {
    expect(decodeMix('', known)).toEqual([])
    expect(decodeMix('#', known)).toEqual([])
  })

  it('drops unknown sounds and keeps the rest', () => {
    expect(decodeMix('#rain=70,nope=10,fireplace=40', known)).toEqual([
      { soundId: 'rain', volume: 70 },
      { soundId: 'fireplace', volume: 40 },
    ])
  })

  it('drops parts whose volume is not a whole non-negative number', () => {
    expect(decodeMix('#rain=loud,wind=-5,fireplace=4.5,coffee-shop=', known)).toEqual([])
  })

  it('clamps volumes above 100, however large', () => {
    expect(decodeMix('#rain=250', known)).toEqual([{ soundId: 'rain', volume: 100 }])
    expect(decodeMix(`#rain=${'9'.repeat(400)}`, known)).toEqual([{ soundId: 'rain', volume: 100 }])
  })

  it('drops parts with no = or more than one =', () => {
    expect(decodeMix('#rain,wind=30=40,fireplace=20', known)).toEqual([{ soundId: 'fireplace', volume: 20 }])
  })

  it('keeps the first of a repeated sound', () => {
    expect(decodeMix('#rain=70,rain=10', known)).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('keeps at most 8 layers', () => {
    const hash = Array.from({ length: 12 }, (_, i) => `s${i}=50`).join(',')
    expect(decodeMix(hash, known)).toHaveLength(8)
  })

  it('does not throw on broken percent escapes or junk', () => {
    expect(decodeMix('#%E0%A4%A=50,rain=70', known)).toEqual([{ soundId: 'rain', volume: 70 }])
    expect(decodeMix('#,,,===,<script>=1', known)).toEqual([])
  })
})
