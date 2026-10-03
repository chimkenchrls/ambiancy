import { useEngine, useLayers, useMasterVolume } from './PlayerContext'

export function MasterControls() {
  const engine = useEngine()
  const layers = useLayers()
  const masterVolume = useMasterVolume()

  return (
    <div className="master">
      <label>
        Master volume
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(event) => engine.setMasterVolume(Number(event.target.value))}
        />
      </label>
      <button type="button" disabled={layers.length === 0} onClick={() => engine.stopAll()}>
        Stop all
      </button>
    </div>
  )
}
