import { useState } from 'react'
import { formatRemaining, type TimerMode } from '../timer/timer'
import { usePlayerTimer } from './PlayerContext'

const MINUTE_OPTIONS = [15, 30, 45, 60]

export function TimerControl() {
  const { timer, remaining, message, start, cancel } = usePlayerTimer()
  const [mode, setMode] = useState<TimerMode>('sleep')
  const [minutes, setMinutes] = useState(30)

  return (
    <section aria-labelledby="timer-heading">
      <h2 id="timer-heading">Timer</h2>
      {timer ? (
        <p>
          {timer.mode === 'sleep' ? 'Sleep timer' : 'Focus timer'}: <span role="timer">{formatRemaining(remaining)}</span>{' '}
          <button type="button" onClick={cancel}>
            Cancel timer
          </button>
        </p>
      ) : (
        <form
          className="timer-form"
          onSubmit={(event) => {
            event.preventDefault()
            start(mode, minutes)
          }}
        >
          <label>
            Timer type
            <select value={mode} onChange={(event) => setMode(event.target.value as TimerMode)}>
              <option value="sleep">Sleep (fades out)</option>
              <option value="focus">Focus</option>
            </select>
          </label>
          <label>
            Minutes
            <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              {MINUTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Start timer</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
