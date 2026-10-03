import { LayerList } from './LayerList'
import { MasterControls } from './MasterControls'
import { SceneList } from './SceneList'
import { ShareButton } from './ShareButton'
import { SoundGrid } from './SoundGrid'
import { TimerControl } from './TimerControl'

export function PlayerPage() {
  return (
    <main className="page player">
      <h1>Player</h1>
      <SceneList />
      <SoundGrid />
      <section aria-labelledby="mix-heading">
        <h2 id="mix-heading">Your mix</h2>
        <LayerList />
        <MasterControls />
        <ShareButton />
      </section>
      <TimerControl />
    </main>
  )
}
