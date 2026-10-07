import { useState } from 'react'
import { artworkUrl, getSound } from '../catalogue'

/**
 * A sound's photo. Behind it sits a simple drawing made in CSS, which shows
 * while the photo loads and stays if the photo cannot be loaded.
 */
export function Artwork({ soundId, priority = false }: { soundId: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false)
  const sound = getSound(soundId)
  const src = sound ? artworkUrl(sound) : null

  return (
    <div className="tile-art" data-art={soundId} aria-hidden="true">
      {src && !failed && <img src={src} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" onError={() => setFailed(true)} />}
    </div>
  )
}
