import { getSound } from '../catalogue'
import { useEngine, useLayers } from './PlayerContext'

export function LayerList() {
  const engine = useEngine()
  const layers = useLayers()

  if (layers.length === 0) {
    return <p className="empty">Pick a sound or a scene to start your mix.</p>
  }

  return (
    <ul className="layer-list" aria-label="Current mix">
      {layers.map((layer) => {
        const name = getSound(layer.soundId)?.name ?? layer.soundId
        return (
          <li key={layer.soundId} className="layer">
            <span className="layer-name">{name}</span>
            {layer.status === 'loading' && <span role="status">Loading…</span>}
            {layer.status === 'error' && (
              <span role="alert">
                Couldn't load.{' '}
                <button type="button" onClick={() => void engine.retryLayer(layer.soundId)}>
                  Retry {name}
                </button>
              </span>
            )}
            <input
              type="range"
              min={0}
              max={100}
              value={layer.volume}
              aria-label={`${name} volume`}
              onChange={(event) => engine.setVolume(layer.soundId, Number(event.target.value))}
            />
            <button type="button" onClick={() => engine.removeLayer(layer.soundId)}>
              Remove {name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
