import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimer } from './useTimer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it('counts down and reports the mode when it finishes', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))

    act(() => result.current.start('sleep', 1))
    expect(result.current.timer?.mode).toBe('sleep')
    expect(result.current.remaining).toBe(60_000)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.remaining).toBe(30_000)
    expect(onDone).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(onDone).toHaveBeenCalledExactlyOnceWith('sleep')
    expect(result.current.timer).toBeNull()
  })

  it('finishes by the clock when the browser held its ticks back', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('focus', 25))

    // The laptop slept: an hour passed on the clock but no ticks ran.
    vi.setSystemTime(Date.now() + 60 * 60_000)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(onDone).toHaveBeenCalledExactlyOnceWith('focus')
    expect(result.current.timer).toBeNull()
  })

  it('checks the clock as soon as the tab becomes visible again', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('sleep', 5))

    vi.setSystemTime(Date.now() + 10 * 60_000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(onDone).toHaveBeenCalledExactlyOnceWith('sleep')
  })

  it('does not fire after being cancelled', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('sleep', 1))
    act(() => result.current.cancel())
    act(() => {
      vi.advanceTimersByTime(120_000)
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(result.current.timer).toBeNull()
  })
})
