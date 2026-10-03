export type TimerMode = 'sleep' | 'focus'

export interface ActiveTimer {
  mode: TimerMode
  /** Clock time, in milliseconds, at which the timer finishes. */
  endsAt: number
}

export const SLEEP_FADE_SECONDS = 30

export function startTimer(mode: TimerMode, minutes: number, now: number): ActiveTimer {
  return { mode, endsAt: now + minutes * 60_000 }
}

export function remainingMs(timer: ActiveTimer, now: number): number {
  return Math.max(0, timer.endsAt - now)
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
