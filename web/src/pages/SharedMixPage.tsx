import { Link, useLocation, useNavigate } from 'react-router'
import { getSound, isSoundId } from '../catalogue'
import { decodeMix } from '../mix/shareLink'
import { useEngine } from '../player/PlayerContext'

export function SharedMixPage() {
  const engine = useEngine()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const mix = decodeMix(hash, isSoundId)

  if (mix.length === 0) {
    return (
      <main className="page">
        <h1>Shared mix</h1>
        <p>This link doesn't contain a mix we can play.</p>
        <Link to="/play" className="button-link">
          Open the player
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>Shared mix</h1>
      <ul aria-label="Sounds in this mix" className="shared-mix">
        {mix.map((layer) => (
          <li key={layer.soundId}>
            {getSound(layer.soundId)?.name} {layer.volume}%
          </li>
        ))}
      </ul>
      {/* Browsers only allow audio to start from a click, so the mix waits for one. */}
      <button
        type="button"
        className="primary"
        onClick={() => {
          void engine.loadMix(mix)
          navigate('/play')
        }}
      >
        Play this mix
      </button>
    </main>
  )
}
