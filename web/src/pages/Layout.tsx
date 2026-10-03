import { Link, Outlet } from 'react-router'
import { useAudioBlocked, useEngine } from '../player/PlayerContext'

export function Layout() {
  const engine = useEngine()
  const audioBlocked = useAudioBlocked()

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        <nav aria-label="Main">
          <Link to="/play">Player</Link>
        </nav>
      </header>
      {audioBlocked && (
        <p role="alert" className="audio-blocked">
          Your browser paused the sound.{' '}
          <button type="button" onClick={() => void engine.resumeAudio()}>
            Resume sound
          </button>
        </p>
      )}
      <Outlet />
      <footer className="site-footer">
        <Link to="/licences">Licences</Link>
      </footer>
    </>
  )
}
