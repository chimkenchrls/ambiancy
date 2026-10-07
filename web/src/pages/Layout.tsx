import { Link, Outlet, useLocation } from 'react-router'
import { AudioBlockedNotice } from '../player/AudioBlockedNotice'
import { useEngine } from '../player/PlayerContext'

/** The frame for the site's pages. The player is separate and has its own. */
export function Layout() {
  const engine = useEngine()
  const isLanding = useLocation().pathname === '/'

  return (
    <div className={`shell${isLanding ? ' shell-story' : ''}`}>
      <header className="site-header">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        {isLanding && (
          <nav className="landing-nav" aria-label="On this page">
            <a href="#made-for-heading">Find your moment</a>
            <a href="#steps-heading">How it works</a>
            <a href="#questions-heading">Questions</a>
          </nav>
        )}
        <div className="landing-header-actions">
        {isLanding && <div id="landing-motion-control" />}
        {/* Its own tab with its own audio, so this tab goes quiet. */}
        <Link to="/play" target="_blank" rel="noopener" className="button-link primary" onClick={() => engine.stopAll()}>
          Open web player
        </Link>
        </div>
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
