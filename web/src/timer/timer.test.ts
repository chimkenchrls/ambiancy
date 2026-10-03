import { describe, expect, it } from 'vitest'
import { formatRemaining, remainingMs, startTimer } from './timer'

describe('timer maths', () => {
  it('ends the given number of minutes after it starts', () => {
    expect(startTimer('sleep', 30, 1_000)).toEqual({ mode: 'sleep', endsAt: 1_000 + 30 * 60_000 })
  })

  it('reports the time left, never below zero', () => {
    const timer = startTimer('focus', 1, 0)
    expect(remainingMs(timer, 15_000)).toBe(45_000)
    expect(remainingMs(timer, 999_999)).toBe(0)
  })

  it('formats as minutes and seconds, rounding part-seconds up', () => {
    expect(formatRemaining(30 * 60_000)).toBe('30:00')
    expect(formatRemaining(61_000)).toBe('01:01')
    expect(formatRemaining(500)).toBe('00:01')
    expect(formatRemaining(0)).toBe('00:00')
  })
})
