import { Link } from 'react-router'
import { AudioBlockedNotice } from './AudioBlockedNotice'
import { LayerList } from './LayerList'
import { Library } from './Library'
import { NowPlayingBar } from './NowPlayingBar'
import { SceneList } from './SceneList'
import { ShareButton } from './ShareButton'
import { SoundGrid } from './SoundGrid'
import { TimerControl } from './TimerControl'

function NavIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

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
            <NavIcon path="M4 11.2 12 4l8 7.2V20h-5.5v-5.5h-5V20H4z" />
            Home
          </a>
          <a href="#scenes">
            <NavIcon path="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" />
            Scenes
          </a>
          <a href="#sounds">
            <NavIcon path="M4 9.5h2v5H4zM8 6h2v12H8zM12 3.5h2v17h-2zM16 7.5h2v9h-2zM20 10h2v4h-2z" />
            Sounds
          </a>
        </nav>
        <Library />
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
