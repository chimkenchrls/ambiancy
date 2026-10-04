import { formatRemaining } from '../timer/timer'
import { Artwork } from './Artwork'
import { MasterControls } from './MasterControls'
import { mixSummary, mixTitle } from './nowPlaying'
import { useEngine, useLayers, usePaused, usePlayerTimer } from './PlayerContext'

export function NowPlayingBar() {
  const engine = useEngine()
  const layers = useLayers()
  const paused = usePaused()
  const { timer, remaining } = usePlayerTimer()
  const empty = layers.length === 0
  const showPlay = empty || paused

  return (
    <div role="region" aria-label="Now playing" className="now-bar">
      <div className="now-info">
        <div className="now-thumbs">
          {layers.slice(0, 3).map((layer) => (
            <Artwork key={layer.soundId} soundId={layer.soundId} />
          ))}
        </div>
        <div className="now-text">
          <p className="now-title">{empty ? 'Nothing playing' : mixTitle(layers)}</p>
          <p className="now-sub">{empty ? 'Pick a scene or a sound' : mixSummary(layers)}</p>
        </div>
      </div>

      <div className="now-controls">
        <button
          type="button"
          className="play-button"
          disabled={empty}
          aria-label={showPlay ? 'Play' : 'Pause'}
          onClick={() => {
            if (paused) void engine.resumeAudio()
            else void engine.pause()
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            {showPlay ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z" />}
          </svg>
        </button>
        {timer && (
          <span className="now-timer">
            {timer.mode === 'sleep' ? 'Sleep' : 'Focus'} {formatRemaining(remaining)}
          </span>
        )}
      </div>

      <div className="now-volume">
        <MasterControls />
      </div>
    </div>
  )
}
