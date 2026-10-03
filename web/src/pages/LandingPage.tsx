import { Link } from 'react-router'
import { SCENES } from '../catalogue'
import { useEngine, useLayers } from '../player/PlayerContext'

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const featured = SCENES[0]!
  const playing = layers.length > 0
  const loading = layers.some((layer) => layer.status === 'loading')
  const failed = layers.filter((layer) => layer.status === 'error')

  return (
    <main className="page landing">
      <h1>Embrace the silence, feel the ambiance.</h1>
      <p className="lead">
        Ambiancy is a free ambient sound mixer. Layer rain, a fireplace or a coffee shop, set each one's volume, and
        share the mix with a link.
      </p>
      <div className="landing-actions">
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (playing) engine.stopAll()
            else void engine.loadMix(featured.layers)
          }}
        >
          {playing ? 'Stop' : `Play ${featured.name}`}
        </button>
        <Link to="/play" className="button-link">
          Open the player
        </Link>
      </div>
      {loading && <p role="status">Loading…</p>}
      {failed.length > 0 && (
        <p role="alert">
          Couldn't load {failed.length === layers.length ? 'the sound' : 'some of the sounds'}.{' '}
          <button type="button" onClick={() => failed.forEach((layer) => void engine.retryLayer(layer.soundId))}>
            Try again
          </button>
        </p>
      )}
      <p className="hint">{featured.description} No account needed.</p>
    </main>
  )
}
