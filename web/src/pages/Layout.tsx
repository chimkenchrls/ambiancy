import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAudioBlocked, useEngine } from '../player/PlayerContext'

export function Layout() {
  const engine = useEngine()
  const audioBlocked = useAudioBlocked()
  const { pathname } = useLocation()
  // The player keeps the original app's dark look with a sidebar; every other
  // page uses the light site look with a top bar.
  const inPlayer = pathname === '/play'

  return (
    <div className={inPlayer ? 'shell shell-player' : 'shell shell-site'}>
      <header className="site-header">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        <nav aria-label="Main" className="site-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/play">Player</NavLink>
          <NavLink to="/licences">Licences</NavLink>
        </nav>
      </header>
      <div className="shell-body">
        {audioBlocked && (
          <p role="alert" className="audio-blocked">
            Your browser paused the sound.{' '}
            <button type="button" onClick={() => void engine.resumeAudio()}>
              Resume sound
            </button>
          </p>
        )}
        <Outlet />
        <footer className="site-footer">Ambiancy is a free ambient sound mixer. No account needed.</footer>
      </div>
    </div>
  )
}
