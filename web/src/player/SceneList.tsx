import { SCENES } from '../catalogue'
import { Artwork } from './Artwork'
import { useEngine } from './PlayerContext'

export function SceneList() {
  const engine = useEngine()

  return (
    <section aria-labelledby="scenes-heading">
      <h2 id="scenes-heading">Scenes</h2>
      <ul className="tile-grid scene-grid">
        {SCENES.map((scene) => (
          <li key={scene.id} className="tile" data-scene={scene.id}>
            <Artwork soundId={scene.layers[0]!.soundId} />
            <button
              type="button"
              className="tile-button"
              aria-describedby={`scene-${scene.id}-description`}
              onClick={() => void engine.loadMix(scene.layers)}
            >
              {scene.name}
            </button>
            <p id={`scene-${scene.id}-description`} className="tile-description">
              {scene.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
