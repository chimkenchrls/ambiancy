import { SOUNDS } from '../catalogue'
import { MAX_LAYERS } from '../mix/mix'
import { Artwork } from './Artwork'
import { useEngine, useLayers } from './PlayerContext'

export const DEFAULT_VOLUME = 60

export function SoundGrid() {
  const engine = useEngine()
  const layers = useLayers()
  const active = new Set(layers.map((layer) => layer.soundId))
  const full = layers.length >= MAX_LAYERS

  return (
    <section aria-labelledby="sounds-heading" id="sounds">
      <h2 id="sounds-heading">Sounds</h2>
      <ul className="tile-grid sound-grid">
        {SOUNDS.map((sound) => {
          const isActive = active.has(sound.id)
          return (
            <li key={sound.id} className="tile" data-sound={sound.id}>
              <Artwork soundId={sound.id} />
              <button
                type="button"
                className="tile-button"
                aria-pressed={isActive}
                aria-describedby={`sound-${sound.id}-description`}
                disabled={full && !isActive}
                onClick={() => {
                  if (isActive) engine.removeLayer(sound.id)
                  else void engine.addLayer(sound.id, DEFAULT_VOLUME)
                }}
              >
                {sound.name}
              </button>
              <p id={`sound-${sound.id}-description`} className="tile-description">
                {sound.description}
              </p>
            </li>
          )
        })}
      </ul>
      {full && <p role="status">A mix can have up to {MAX_LAYERS} sounds.</p>}
    </section>
  )
}
