import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>There is nothing at this address.</p>
      <Link to="/" className="button-link">
        Back to the start
      </Link>
    </main>
  )
}
