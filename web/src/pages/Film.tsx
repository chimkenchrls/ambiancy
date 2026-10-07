import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../catalogue'
import { useEngine, useLayers } from '../player/PlayerContext'
import captions from './film.vtt?url'
import { MotionText } from './MotionText'

/**
 * The half-minute film under the hero. Only its poster loads with the page;
 * the video itself is fetched when the visitor asks for it.
 */
export function Film() {
  const engine = useEngine()
  const mixPlaying = useLayers().length > 0
  const video = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  // The film has its own soundtrack, so it and a mix never play together:
  // starting a mix pauses the film, and starting the film stops the mix.
  useEffect(() => {
    if (mixPlaying && video.current && !video.current.paused) video.current.pause()
  }, [mixPlaying])

  return (
    <section className="landing-section film reveal" aria-labelledby="film-heading">
      <div className="film-intro"><h2 id="film-heading"><MotionText>Ambiancy in 30 seconds</MotionText></h2><p className="hint">Plays with sound.</p></div>
      <div className="film-frame">
        <video
          ref={video}
          poster={mediaUrl('video/ambiancy-poster.jpg')}
          preload="none"
          playsInline
          controls={started}
          aria-labelledby="film-heading"
          onPlay={() => engine.stopAll()}
        >
          <source src={mediaUrl('video/ambiancy.webm')} type="video/webm" />
          {/* The browser reports a failure on the last source it tried. */}
          <source src={mediaUrl('video/ambiancy.mp4')} type="video/mp4" onError={() => setFailed(true)} />
          <track kind="captions" srcLang="en" label="English" src={captions} />
        </video>
        {!started && (
          <button
            type="button"
            className="film-play"
            onClick={() => {
              setStarted(true)
              // If the browser refuses, the video's own controls are now there to try again.
              video.current?.play().catch(() => {})
              video.current?.focus()
            }}
          >
            <span className="film-play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            </span>
            Watch the film
            <span className="film-length">0:29</span>
          </button>
        )}
      </div>
      {failed && <p role="alert">Couldn't load the film.</p>}
    </section>
  )
}
