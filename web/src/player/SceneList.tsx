import { SCENES } from '../catalogue'
import { useEngine } from './PlayerContext'

export function SceneList() {
  const engine = useEngine()

  return (
    <section aria-labelledby="scenes-heading">
      <h2 id="scenes-heading">Scenes</h2>
      <ul className="tile-grid">
        {SCENES.map((scene) => (
          <li key={scene.id} className="tile">
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
