import { Link } from 'react-router'
import { SCENES, SOUNDS, getSound } from '../catalogue'
import { useEngine, useLayers } from '../player/PlayerContext'

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const featured = SCENES[0]!
  const playing = layers.length > 0
  const loading = layers.some((layer) => layer.status === 'loading')
  const failed = layers.filter((layer) => layer.status === 'error')

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>Embrace the silence, feel the ambiance.</h1>
          <p className="lead">
            Ambiancy is a free ambient sound mixer. Layer rain, a fireplace or a coffee shop, set each one's volume,
            and share the mix with a link.
          </p>
          <Link to="/play" className="button-link primary">
            Open the player
          </Link>
          <p className="hint">Free. No account, nothing to install.</p>
        </div>

        {/* A working slice of the player, in place of a picture of it. */}
        <div className="hero-player" data-scene={featured.id}>
          <div className="tile-art" aria-hidden="true" />
          <div className="hero-player-body">
            <h2>{featured.name}</h2>
            <p className="hint">{featured.description}</p>
            <ul className="hero-layers">
              {featured.layers.map((layer) => {
                const live = layers.find((candidate) => candidate.soundId === layer.soundId)
                const name = getSound(layer.soundId)?.name ?? layer.soundId
                return (
                  <li key={layer.soundId}>
                    <span>{name}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={live?.volume ?? layer.volume}
                      disabled={!live}
                      aria-label={`${name} volume`}
                      onChange={(event) => engine.setVolume(layer.soundId, Number(event.target.value))}
                    />
                  </li>
                )
              })}
            </ul>
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
            {loading && <p role="status">Loading…</p>}
            {failed.length > 0 && (
              <p role="alert">
                Couldn't load {failed.length === layers.length ? 'the sound' : 'some of the sounds'}.{' '}
                <button type="button" onClick={() => failed.forEach((layer) => void engine.retryLayer(layer.soundId))}>
                  Try again
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="sound-strip" aria-labelledby="sound-strip-heading">
        <h2 id="sound-strip-heading">{SOUNDS.length} sounds to layer</h2>
        <ul>
          {SOUNDS.map((sound) => (
            <li key={sound.id} data-sound={sound.id}>
              <div className="tile-art" aria-hidden="true" />
              <span>{sound.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
