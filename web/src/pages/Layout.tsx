import { Link, Outlet } from 'react-router'
import { AudioBlockedNotice } from '../player/AudioBlockedNotice'
import { useEngine } from '../player/PlayerContext'

/** The frame for the site's pages. The player is separate and has its own. */
export function Layout() {
  const engine = useEngine()

  return (
    <div className="shell">
      <header className="site-header">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        {/* Its own tab with its own audio, so this tab goes quiet. */}
        <Link to="/play" target="_blank" rel="noopener" className="button-link primary" onClick={() => engine.stopAll()}>
          Open web player
        </Link>
      </header>
      <AudioBlockedNotice />
      <Outlet />
      <footer className="site-footer">
        <p>Ambiancy is a free ambient sound mixer. No account needed.</p>
        <Link to="/licences">Licences</Link>
      </footer>
    </div>
  )
}
