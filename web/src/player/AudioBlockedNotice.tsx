import { useAudioBlocked, useEngine } from './PlayerContext'

/** Shown when the browser, not the visitor, has paused the sound (a phone call, switching apps). */
export function AudioBlockedNotice() {
  const engine = useEngine()
  const audioBlocked = useAudioBlocked()
  if (!audioBlocked) return null

  return (
    <p role="alert" className="audio-blocked">
      Your browser paused the sound.{' '}
      <button type="button" onClick={() => void engine.resumeAudio()}>
        Resume sound
      </button>
    </p>
  )
}
