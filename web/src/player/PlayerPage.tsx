import { LayerList } from './LayerList'
import { MasterControls } from './MasterControls'
import { useLayers } from './PlayerContext'
import { SceneList } from './SceneList'
import { ShareButton } from './ShareButton'
import { SoundGrid } from './SoundGrid'
import { TimerControl } from './TimerControl'

export function PlayerPage() {
  const layers = useLayers()

  return (
    <main className="player">
      <div className="player-main">
        <h1>Player</h1>
        <SceneList />
        <SoundGrid />
      </div>
      <aside className="player-rail" aria-label="Your mix and timer">
        <section aria-labelledby="mix-heading" id="mix">
          <h2 id="mix-heading">Your mix</h2>
          <LayerList />
          <MasterControls />
          <ShareButton />
        </section>
        <TimerControl />
      </aside>
      {/* On phones the mix sits below the sounds, so this keeps it one tap away. */}
      {layers.length > 0 && (
        <a className="mix-dock" href="#mix">
          <span className="eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {layers.length === 1 ? '1 sound playing' : `${layers.length} sounds playing`}
          <span className="mix-dock-action">Adjust mix</span>
        </a>
      )}
    </main>
  )
}
