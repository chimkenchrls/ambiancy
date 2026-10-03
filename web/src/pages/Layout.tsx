import { Link, Outlet } from 'react-router'

export function Layout() {
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
      <Outlet />
      <footer className="site-footer">
        <Link to="/licences">Licences</Link>
      </footer>
    </>
  )
}
