import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SCENES, SOUNDS, getSound } from '../catalogue'
import { Artwork } from '../player/Artwork'
import { useEngine, useLayers } from '../player/PlayerContext'
import { SceneList } from '../player/SceneList'
import { mixTitle } from '../player/nowPlaying'
import { Film } from './Film'
import { SoundJourney } from './SoundJourney'
import { MotionText } from './MotionText'
import { MotionControl } from './MotionControl'

// What people use ambient sound for, each with a scene that suits it.
const MADE_FOR = [
  {
    title: 'Focus',
    text: 'A steady background that covers the small noises pulling you out of your work.',
    sceneId: 'rainy-cafe',
    art: 'coffee-shop',
  },
  {
    title: 'Relax',
    text: 'Somewhere calmer to sit for a while: waves, birds and a sea breeze.',
    sceneId: 'seaside-morning',
    art: 'ocean-waves',
  },
  {
    title: 'Sleep',
    text: 'A quiet forest at night, with a sleep timer in the player that fades it out.',
    sceneId: 'forest-night',
    art: 'night-forest',
  },
]

const QUESTIONS = [
  {
    question: 'Is Ambiancy free?',
    answer: 'Yes. There is no account, no payment and no advertising.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'No. It runs in your browser, and the player opens in its own tab.',
  },
  {
    question: 'Does it work on my phone?',
    answer: 'Yes, in your phone’s browser. Keep the tab open while it plays.',
  },
  {
    question: 'Can I save my mixes?',
    answer:
      'Not yet. For now, share a mix and keep the link: opening it brings back the same sounds and volumes. Saved mixes are planned.',
  },
]

/** Stop the atmospheric loops when the window is out of view or the tab is hidden. */
function useAtmosphere() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const root = ref.current
    let inView = true
    const update = () => setVisible(inView && !document.hidden)
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          inView = entry?.isIntersecting ?? false
          update()
        })
      : null
    if (root) observer?.observe(root)
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return { ref, running: visible && !paused, paused, setPaused }
}

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const [selectedScene, setSelectedScene] = useState(SCENES[0]!.id)
  const featured = SCENES.find((scene) => scene.id === selectedScene)!
  const playing = layers.length > 0
  const loading = layers.some((layer) => layer.status === 'loading')
  const failed = layers.filter((layer) => layer.status === 'error')
  const atmosphere = useAtmosphere()

  // The mini-player shows whatever is playing; before that, a preview of the featured scene.
  const rows = playing ? layers : featured.layers
  const title = playing ? mixTitle(layers) : featured.name
  const firstSound = rows[0]!.soundId
  const world = ['night-forest', 'cicadas', 'wind'].includes(firstSound) ? 'forest'
    : ['ocean-waves', 'birds-chirping', 'creek'].includes(firstSound) ? 'sea' : 'rain'
  const backdrop = world === 'forest' ? 'night-forest' : world === 'sea' ? 'ocean-waves' : 'thunderstorm'
  const previewScenes = [SCENES[0]!, SCENES[1]!, SCENES[3]!]
  // The player opens in its own tab with its own audio, so this tab goes quiet.
  const openPlayer = { to: '/play', target: '_blank', rel: 'noopener', onClick: () => engine.stopAll() }

  return (
    <main className="landing landing-story" data-paused={atmosphere.paused}>
      <SoundJourney paused={atmosphere.paused} />
      <MotionControl paused={atmosphere.paused} onToggle={() => atmosphere.setPaused(!atmosphere.paused)} />
      <section className="hero living-hero" ref={atmosphere.ref} data-world={world} data-motion={atmosphere.running ? 'running' : 'paused'}>
        <div className="hero-backdrop" aria-hidden="true">
          <Artwork key={backdrop} soundId={backdrop} priority />
        </div>
        <div className="hero-inner">
          <div className="hero-copy">
            <h1><MotionText>Embrace the silence,</MotionText><br /> <MotionText>feel the ambiance.</MotionText></h1>
            <p className="lead">
              Ambiancy is a free ambient sound mixer. Layer rain, a fireplace or a coffee shop, set each one's volume,
              and share the mix with a link.
            </p>
            <Link {...openPlayer} className="button-link primary">
              Open the player
            </Link>
            <p className="hint">Free. No account, nothing to install.</p>
          </div>

          {/* A working slice of the player, in place of a picture of it. */}
          <div className="hero-product">
            <div className="hero-orb-slot" aria-hidden="true" />
            <div className="hero-player">
              <div className="hero-scene-picker" role="group" aria-label="Preview an atmosphere">
                {previewScenes.map((scene) => (
                  <button key={scene.id} type="button" aria-pressed={playing ? title === scene.name : featured.id === scene.id}
                    onClick={() => {
                      setSelectedScene(scene.id)
                      if (playing) void engine.loadMix(scene.layers)
                    }}>
                    {scene.id === 'rainy-cafe' ? 'Rain' : scene.id === 'forest-night' ? 'Forest' : 'Sea'}
                  </button>
                ))}
              </div>
              <div className="hero-player-head">
                {playing && (
                  <span className="eq" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
                <h2>{title}</h2>
              </div>
              {!playing && <p className="hint">{featured.description}</p>}
              <ul className="hero-layers">
                {rows.map((row) => {
                  const live = layers.find((candidate) => candidate.soundId === row.soundId)
                  const name = getSound(row.soundId)?.name ?? row.soundId
                  return (
                    <li key={row.soundId}>
                      <Artwork soundId={row.soundId} />
                      <span>{name}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={live?.volume ?? row.volume}
                        disabled={!live}
                        aria-label={`${name} volume`}
                        onChange={(event) => engine.setVolume(row.soundId, Number(event.target.value))}
                      />
                    </li>
                  )
                })}
              </ul>
              <div className="hero-play-row">
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    if (playing) engine.stopAll()
                    else void engine.loadMix(featured.layers)
                  }}
                >
                  {playing ? 'Stop' : `Play ${featured.name}`}
                </button>
                <span className="hero-listening-status">{loading ? 'Connecting…' : playing ? 'Sound is on' : 'Sound is off'}</span>
              </div>
              {loading && <p role="status">Loading…</p>}
              {failed.length > 0 && (
                <p role="alert">
                  Couldn't load {failed.length === layers.length ? 'the sound' : 'some of the sounds'}.{' '}
                  <button type="button" onClick={() => failed.forEach((layer) => void engine.retryLayer(layer.soundId))}>
                    Try again
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <a href="#made-for-heading" className="hero-explore">Find your moment <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" /></svg></a>
        </div>
      </section>

      <Film />

      <section className="landing-section made-for reveal" aria-labelledby="made-for-heading">
        <div className="section-intro"><h2 id="made-for-heading"><MotionText>Made for</MotionText></h2><p className="section-index" aria-hidden="true">Focus. Relax. Sleep.</p></div>
        <ul>
          {MADE_FOR.map((item) => {
            const scene = SCENES.find((candidate) => candidate.id === item.sceneId)!
            const active = playing && title === scene.name
            return (
              <li key={item.title}>
                <Artwork soundId={item.art} />
                <div className="made-for-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (active) engine.stopAll()
                      else void engine.loadMix(scene.layers)
                    }}
                  >
                    {active ? `Stop ${scene.name}` : `Hear ${scene.name}`}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="landing-section scene-section reveal">
        <SceneList />
        <p className="hint">Pick a scene to hear it here, then open the player to make it your own.</p>
      </div>

      <section className="landing-section steps reveal" aria-labelledby="steps-heading">
        <div className="steps-intro"><h2 id="steps-heading"><MotionText>How it works</MotionText></h2><div className="waveform-space" aria-hidden="true" /></div>
        <ol>
          <li>
            <h3>Pick a scene, or build your own</h3>
            <p>Start from a ready-made scene, or layer up to eight sounds yourself.</p>
          </li>
          <li>
            <h3>Set each volume</h3>
            <p>Every sound has its own slider, so the rain can sit under the fire or drown it out.</p>
          </li>
          <li>
            <h3>Time it or share it</h3>
            <p>A sleep timer fades the mix out. A share link opens the same mix for anyone, without an account.</p>
          </li>
        </ol>
      </section>

      <section className="landing-section gallery reveal" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading"><MotionText>{`${SOUNDS.length} sounds to layer`}</MotionText></h2>
        <ul>
          {SOUNDS.map((sound) => (
            <li key={sound.id}>
              <Artwork soundId={sound.id} />
              <span>{sound.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section questions reveal" aria-labelledby="questions-heading">
        <h2 id="questions-heading"><MotionText>Questions</MotionText></h2>
        <div className="question-list">
        {QUESTIONS.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
        <details>
          <summary>Where do the sounds and pictures come from?</summary>
          <p>
            The pictures are from Wikimedia Commons, each credited on the <Link to="/licences">Licences page</Link>.
            The sounds playing today are stand-ins we generated ourselves while properly licensed recordings are
            gathered.
          </p>
        </details>
        </div>
      </section>

      <section className="landing-section about reveal" aria-labelledby="about-heading">
        <h2 id="about-heading"><MotionText>About the project</MotionText></h2>
        <div className="about-copy">
        <p>
          Ambiancy began in 2025 as a three-person school project: a landing page and a simple web player. It is now
          being rebuilt in the open as a tested, containerised web app, with the way it is built, shipped and run
          treated as part of the work.
        </p>
        <p>
          It is made with React and TypeScript, plays sound through the browser's Web Audio API, and runs in Docker.
        </p>
        <a href="https://github.com/chimkenchrls/ambiancy" target="_blank" rel="noreferrer" className="button-link">
          View the code on GitHub
        </a>
        </div>
      </section>

      <section className="closing reveal" aria-labelledby="closing-heading">
        <h2 id="closing-heading"><MotionText>Find the sound that fits your day.</MotionText></h2>
        <Link {...openPlayer} className="button-link primary">
          Start mixing
        </Link>
      </section>
    </main>
  )
}
