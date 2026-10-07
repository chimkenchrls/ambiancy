import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** Keep the persistent control in navigation, outside the scrolling content. */
export function MotionControl({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => { setHost(document.getElementById('landing-motion-control')) }, [])
  if (!host) return null
  const label = paused ? 'Resume motion' : 'Pause motion'
  return createPortal(
    <button type="button" className="journey-motion-toggle" aria-label={label} aria-pressed={paused} onClick={onToggle}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {paused ? <path d="m9 5 10 7-10 7Z" /> : <path d="M8 5v14M16 5v14" />}
      </svg>
      <span className="motion-toggle-label">{label}</span>
    </button>, host,
  )
}
