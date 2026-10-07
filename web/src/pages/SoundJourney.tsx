import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createLandingMotion } from './landingMotion'

type Shape = { x: number; y: number; scale: number; rotation: number; wave: number; scatter: number; alpha: number }
const SIZE = 600
const TAU = Math.PI * 2

/** One persistent sculpture, scrubbed through real section positions in both directions. */
export function SoundJourney({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const introPlayed = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const root = canvas?.closest<HTMLElement>('.landing')
    if (!canvas || !root || typeof window.matchMedia !== 'function') return
    gsap.registerPlugin(ScrollTrigger)
    const context = canvas.getContext('2d')
    if (!context) return

    const media = gsap.matchMedia()
    media.add({ reduced: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 700px)', desktop: '(min-width: 701px)' }, (match) => {
      const mobile = Boolean(match.conditions?.mobile)
      const still = paused || Boolean(match.conditions?.reduced)
      const shape: Shape = { x: 0, y: 0, scale: 1, rotation: 0, wave: 0, scatter: 0, alpha: 1 }
      const entrance = { value: 1 }
      let contentMotion: ReturnType<typeof createLandingMotion> | undefined
      let timeline: gsap.core.Timeline | undefined
      let lastTime = -1
      let active = !document.hidden
      let phase = 0
      let frame = 0
      let landingBottom = Infinity
      const rings = mobile ? 28 : 42
      const points = mobile ? 64 : 90
      const coordinates = new Float32Array((points + 1) * 2)
      const density = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5)
      canvas.width = SIZE * density
      canvas.height = SIZE * density
      context.setTransform(density, 0, 0, density, 0, 0)
      canvas.style.position = still ? 'absolute' : 'fixed'

      function draw(time = 0) {
        if (!active || window.scrollY > landingBottom || (time && time - lastTime < 1 / 30)) return
        const elapsed = lastTime < 0 ? 0 : Math.min(time - lastTime, 0.05)
        lastTime = time
        if (!still) phase += elapsed * 0.17
        const { x, y, scale, rotation, wave, scatter, alpha } = shape
        canvas!.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0) scale(${scale})`
        canvas!.style.opacity = String(alpha * entrance.value)
        canvas!.dataset.wave = wave.toFixed(3)
        canvas!.dataset.scatter = scatter.toFixed(3)
        context!.clearRect(0, 0, SIZE, SIZE)
        context!.save()
        context!.translate(SIZE / 2, SIZE / 2)
        context!.rotate(rotation * Math.PI / 180)
        const glow = context!.createRadialGradient(0, 0, 20, 0, 0, 250)
        glow.addColorStop(0, 'rgba(142,122,181,0.12)')
        glow.addColorStop(0.65, 'rgba(106,78,152,0.07)')
        glow.addColorStop(1, 'rgba(106,78,152,0)')
        context!.fillStyle = glow
        context!.fillRect(-300, -300, 600, 600)
        for (let ring = 0; ring < rings; ring++) {
          const latitude = (ring / (rings - 1) - 0.5) * Math.PI
          const radius = Math.cos(latitude) * 188
          context!.beginPath()
          for (let p = 0; p <= points; p++) {
            const a = p / points * TAU
            const ripple = Math.sin(a * 3 + latitude * 4 + phase) * 9
            const px = Math.cos(a) * (radius + ripple)
            const py = Math.sin(latitude) * 181
            const pz = Math.sin(a) * (radius + ripple)
            const spin = phase * 0.45 + rotation * 0.01
            const rx = px * Math.cos(spin) + pz * Math.sin(spin)
            const rz = pz * Math.cos(spin) - px * Math.sin(spin)
            const tilt = 0.35
            const ry = py * Math.cos(tilt) - rz * Math.sin(tilt)
            const depth = 1 + (py * Math.sin(tilt) + rz * Math.cos(tilt)) / 850
            const waveX = (p / points - 0.5) * 475
            const waveY = Math.sin(p / points * TAU * 1.4 + ring * 0.10 + phase) * 48 + (ring / rings - 0.5) * 100
            const spreadX = Math.cos(a * 3 + ring) * scatter * 72
            const spreadY = Math.sin(a * 2 + ring * 0.7) * scatter * 80
            const dx = rx * depth * (1 - wave) + waveX * wave + spreadX
            const dy = ry * depth * (1 - wave) + waveY * wave + spreadY
            coordinates[p * 2] = dx
            coordinates[p * 2 + 1] = dy
            if (p === 0) context!.moveTo(dx, dy)
            else context!.lineTo(dx, dy)
          }
          context!.strokeStyle = `rgba(${180 + ring % 5 * 12},${155 + ring % 5 * 12},235,${0.32 + Math.cos(latitude) * 0.35})`
          context!.lineWidth = ring % 7 === 0 ? 1.3 : 0.65
          context!.globalAlpha = 1 - scatter
          context!.stroke()
          if (scatter > 0) {
            context!.globalAlpha = scatter
            context!.fillStyle = '#c9b6e4'
            for (let p = 0; p < points; p += 3) {
              context!.fillRect(coordinates[p * 2]!, coordinates[p * 2 + 1]!, 1.3, 1.3)
            }
          }
          context!.globalAlpha = 1
        }
        context!.restore()
      }

      const measure = () => {
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        const width = window.innerWidth
        const height = window.innerHeight
        const rootTop = root.getBoundingClientRect().top + window.scrollY
        landingBottom = rootTop + root.offsetHeight
        const heroSlot = root.querySelector('.hero-orb-slot')!.getBoundingClientRect()
        const baseScale = mobile ? 0.62 : Math.min(1.12, width / 1250)
        Object.assign(shape, { x: heroSlot.left + heroSlot.width / 2, y: heroSlot.top + window.scrollY + heroSlot.height / 2 - (still ? rootTop : 0), scale: baseScale, rotation: -18, wave: 0, scatter: 0, alpha: 1 })
        if (still) { draw(); return }
        const distance = Math.max(1, root.offsetHeight + rootTop - height)
        const stops = [
          { target: '.film', x: 0.20, y: 0.58, scale: 0.78, rotation: 28, wave: 0.12, scatter: 0, alpha: 0.75 },
          { target: '.made-for', x: 0.80, y: 0.35, scale: 0.85, rotation: 70, wave: 0, scatter: 0, alpha: 0.6 },
          { target: '.scene-section', x: 0.52, y: 0.58, scale: 1.25, rotation: 110, wave: 0.3, scatter: 0, alpha: 0.38 },
          { target: '.steps', x: 0.24, y: 0.57, scale: 1, rotation: 180, wave: 1, scatter: 0, alpha: 0.9 },
          { target: '.gallery', x: 0.55, y: 0.46, scale: 1.45, rotation: 200, wave: 0.3, scatter: 1, alpha: 0.55 },
          { target: '.questions', x: 0.16, y: 0.50, scale: 0.85, rotation: 250, wave: 0.15, scatter: 0.7, alpha: 0.2 },
          { target: '.about', x: 0.80, y: 0.48, scale: 0.9, rotation: 300, wave: 0, scatter: 0.4, alpha: 0.4 },
          { target: '.closing', x: 0.50, y: 0.53, scale: 1.35, rotation: 342, wave: 0, scatter: 0, alpha: 0.9 },
        ]
        timeline = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.55 }, defaults: { ease: 'sine.inOut' } })
        let previous = 0
        for (const stop of stops) {
          const element = root.querySelector<HTMLElement>(stop.target)!
          const position = Math.min(distance, Math.max(previous + 1, element.getBoundingClientRect().top + window.scrollY - rootTop - height * 0.18))
          timeline.to(shape, { x: width * (mobile ? Math.min(0.7, Math.max(0.3, stop.x)) : stop.x), y: height * stop.y, scale: stop.scale * (mobile ? 0.64 : 1), rotation: stop.rotation, wave: stop.wave, scatter: stop.scatter, alpha: stop.alpha * (mobile && stop.target !== '.closing' ? 0.45 : 1), duration: position - previous })
          previous = position
        }
        timeline.to(shape, { duration: Math.max(1, distance - previous) })
        timeline.scrollTrigger?.refresh()
        draw()
      }
      const scheduleMeasure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) }
      const visibility = () => { active = !document.hidden; lastTime = -1 }
      measure()
      if (!still) {
        gsap.ticker.add(draw)
        gsap.to(root.querySelector('.hero-copy'), {
          y: mobile ? -20 : -65, opacity: 0.28, ease: 'none',
          scrollTrigger: { trigger: root.querySelector('.hero'), start: 'top top', end: 'bottom 25%', scrub: true },
        })
        gsap.to(root.querySelector('.hero-backdrop'), {
          y: mobile ? 30 : 90, ease: 'none',
          scrollTrigger: { trigger: root.querySelector('.hero'), start: 'top top', end: 'bottom top', scrub: true },
        })
        const intro = !introPlayed.current && window.scrollY < 100
        contentMotion = createLandingMotion(root, { mobile, intro })
        if (intro) {
          contentMotion.hero.fromTo(entrance, { value: 0.15 }, { value: 1, duration: 1.1, ease: 'power2.out' }, 0.1)
          contentMotion.hero.eventCallback('onComplete', () => { introPlayed.current = true })
        }
      }
      window.addEventListener('resize', scheduleMeasure)
      document.addEventListener('visibilitychange', visibility)
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null
      observer?.observe(root)
      return () => {
        contentMotion?.cleanup()
        cancelAnimationFrame(frame)
        gsap.ticker.remove(draw)
        timeline?.scrollTrigger?.kill()
        timeline?.kill()
        observer?.disconnect()
        window.removeEventListener('resize', scheduleMeasure)
        document.removeEventListener('visibilitychange', visibility)
      }
    })
    return () => media.revert()
  }, [paused])

  return <canvas ref={canvasRef} className="sound-journey" aria-hidden="true" />
}
