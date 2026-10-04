import { Link } from 'react-router'
import { SCENES, SOUNDS, getSound } from '../catalogue'
import { Artwork } from '../player/Artwork'
import { useEngine, useLayers } from '../player/PlayerContext'
import { SceneList } from '../player/SceneList'
import { mixTitle } from '../player/nowPlaying'

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const featured = SCENES[0]!
  const playing = layers.length > 0
  const loading = layers.some((layer) => layer.status === 'loading')
  const failed = layers.filter((layer) => layer.status === 'error')

  // The mini-player shows whatever is playing; before that, a preview of the featured scene.
  const rows = playing ? layers : featured.layers
  const title = playing ? mixTitle(layers) : featured.name
  // The player opens in its own tab with its own audio, so this tab goes quiet.
  const openPlayer = { to: '/play', target: '_blank', rel: 'noopener', onClick: () => engine.stopAll() }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-backdrop">
          {/* The storm photo suits the palette; once something plays, the backdrop follows it. */}
          <Artwork key={playing ? rows[0]!.soundId : 'idle'} soundId={playing ? rows[0]!.soundId : 'thunderstorm'} />
        </div>
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Embrace the silence, feel the ambiance.</h1>
            <p className="lead">
              Ambiancy is a free ambient sound mixer. Layer rain, a fireplace or a coffee shop, set each one's volume,
              and share the mix with a link.
            </p>
            <Link {...openPlayer} className="button-link primary">
              Open the player
            </Link>
            <p className="hint">Free. No account, nothing to install.</p>
          </div>

          {/* A working slice of the player, in place of a picture of it. */}
          <div className="hero-player">
            <div className="hero-player-head">
              {playing && (
                <span className="eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
              <h2>{title}</h2>
            </div>
            {!playing && <p className="hint">{featured.description}</p>}
            <ul className="hero-layers">
              {rows.map((row) => {
                const live = layers.find((candidate) => candidate.soundId === row.soundId)
                const name = getSound(row.soundId)?.name ?? row.soundId
                return (
                  <li key={row.soundId}>
                    <Artwork soundId={row.soundId} />
                    <span>{name}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={live?.volume ?? row.volume}
                      disabled={!live}
                      aria-label={`${name} volume`}
                      onChange={(event) => engine.setVolume(row.soundId, Number(event.target.value))}
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

      <div className="landing-section">
        <SceneList />
        <p className="hint">Pick a scene to hear it here, then open the player to make it your own.</p>
      </div>

      <section className="landing-section features" aria-labelledby="features-heading">
        <h2 id="features-heading">What you can do</h2>
        <ul>
          <li>
            <h3>Layer up to eight sounds</h3>
            <p>Each sound has its own volume, so the rain can sit under the fire or drown it out.</p>
          </li>
          <li>
            <h3>Fall asleep to it</h3>
            <p>Set a sleep timer and the mix fades out when it finishes. A focus timer tells you when to take a break.</p>
          </li>
          <li>
            <h3>Share a mix with a link</h3>
            <p>The link carries the whole mix, so it opens the same sounds for anyone, without an account.</p>
          </li>
        </ul>
      </section>

      <section className="landing-section gallery" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">{SOUNDS.length} sounds to layer</h2>
        <ul>
          {SOUNDS.map((sound) => (
            <li key={sound.id}>
              <Artwork soundId={sound.id} />
              <span>{sound.name}</span>
            </li>
          ))}
        </ul>
        <Link {...openPlayer} className="button-link">
          Start mixing
        </Link>
      </section>
    </main>
  )
}
