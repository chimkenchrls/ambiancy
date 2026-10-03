import { useCallback, useEffect, useRef, useState } from 'react'
import { remainingMs, startTimer, type ActiveTimer, type TimerMode } from './timer'

export function useTimer(onDone: (mode: TimerMode) => void) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!timer) return
    let finished = false

    // Compares against the clock on every tick, so a throttled background tab
    // or a sleeping laptop still finishes at the right time, and only once.
    const check = () => {
      if (finished) return
      const current = Date.now()
      setNow(current)
      if (current >= timer.endsAt) {
        finished = true
        setTimer(null)
        onDoneRef.current(timer.mode)
      }
    }

    const interval = setInterval(check, 1000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [timer])

  const start = useCallback((mode: TimerMode, minutes: number) => {
    const current = Date.now()
    setNow(current)
    setTimer(startTimer(mode, minutes, current))
  }, [])

  const cancel = useCallback(() => {
    setTimer(null)
  }, [])

  return { timer, remaining: timer ? remainingMs(timer, now) : 0, start, cancel }
}
