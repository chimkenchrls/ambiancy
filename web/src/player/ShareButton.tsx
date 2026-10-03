import { useState } from 'react'
import { shareUrl } from '../mix/shareLink'
import { useEngine, useLayers } from './PlayerContext'

export function ShareButton() {
  const engine = useEngine()
  const layers = useLayers()
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = shareUrl(engine.getMix(), window.location.origin)
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="share">
      <button type="button" disabled={layers.length === 0} onClick={() => void share()}>
        Share this mix
      </button>
      {link && (
        <p role="status">
          <span>{copied ? 'Link copied.' : 'Copy this link:'}</span>{' '}
          <input readOnly value={link} aria-label="Share link" onFocus={(event) => event.target.select()} />
        </p>
      )}
    </div>
  )
}
