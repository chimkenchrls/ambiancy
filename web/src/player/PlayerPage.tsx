import { Link } from 'react-router'
import { AudioBlockedNotice } from './AudioBlockedNotice'
import { LayerList } from './LayerList'
import { NowPlayingBar } from './NowPlayingBar'
import { SceneList } from './SceneList'
import { ShareButton } from './ShareButton'
import { SoundGrid } from './SoundGrid'
import { TimerControl } from './TimerControl'

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// The player is its own page, opened in its own tab: a sidebar, the sounds,
// the mix where a music app keeps its queue, and a now-playing bar.
export function PlayerPage() {
  return (
    <div className="app">
      <aside className="app-side">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        <nav aria-label="Player" className="app-nav">
          <a href="#top" aria-current="page">
            Home
          </a>
          <a href="#scenes">Scenes</a>
          <a href="#sounds">Sounds</a>
        </nav>
        <div className="app-side-foot">
          <Link to="/">About Ambiancy</Link>
          <Link to="/licences">Licences</Link>
        </div>
      </aside>

      <main className="app-main" id="top">
        <AudioBlockedNotice />
        <h1 className="visually-hidden">Player</h1>
        <p className="greeting">{greeting(new Date().getHours())}</p>
        <SceneList />
        <SoundGrid />
      </main>

      <aside className="app-queue" aria-label="Your mix and timer">
        <section aria-labelledby="mix-heading" id="mix">
          <h2 id="mix-heading">Your mix</h2>
          <LayerList />
          <ShareButton />
        </section>
        <TimerControl />
      </aside>

      <NowPlayingBar />
    </div>
  )
}
