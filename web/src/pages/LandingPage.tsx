import { Link } from 'react-router'
import { SCENES } from '../catalogue'
import { useEngine, useLayers } from '../player/PlayerContext'

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const featured = SCENES[0]!
  const playing = layers.length > 0

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
      <p className="hint">{featured.description} No account needed.</p>
    </main>
  )
}
