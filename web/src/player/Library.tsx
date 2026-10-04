import { SCENES } from '../catalogue'
import { Artwork } from './Artwork'
import { mixSummary, mixTitle } from './nowPlaying'
import { useEngine, useLayers } from './PlayerContext'

/** The sidebar's list of scenes: one click plays one, and the one playing is marked. */
export function Library() {
  const engine = useEngine()
  const layers = useLayers()
  const playingTitle = layers.length > 0 ? mixTitle(layers) : null

  return (
    <section className="library" aria-labelledby="library-heading">
      <h2 id="library-heading">Library</h2>
      <ul>
        {SCENES.map((scene) => {
          const active = playingTitle === scene.name
          return (
            <li key={scene.id}>
              <button
                type="button"
                className="library-item"
                aria-label={`Play ${scene.name}`}
                aria-pressed={active}
                onClick={() => void engine.loadMix(scene.layers)}
              >
                <Artwork soundId={scene.layers[0]!.soundId} />
                <span className="library-name">{scene.name}</span>
                <span className="library-sub">
                  {active && (
                    <span className="eq" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  Scene, {mixSummary(scene.layers)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
