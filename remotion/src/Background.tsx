import { AbsoluteFill } from 'remotion'
import { palette } from '../theme'
import { CX, CY, FIRE, FOLD, FOREST, H, RAIN, W, level, rand, ramp } from './timeline'

/* The deep-night base, three slow glows and drifting dust. It darkens while
   the noise builds and opens up again when the mixer appears. */
export function Background({ t, cam }: { t: number; cam: number }) {
  const noisy = ramp(t, 5.05, 9.7) * (1 - ramp(t, 14.4, 15.6))
  const calm = ramp(t, 14.5, 17)
  const dust = ramp(t, 0.4, 2.4)

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${palette.night}, ${palette.black})` }}>
      <AbsoluteFill style={{ transform: `scale(${1 + (cam - 1) * 0.35})` }}>
        <Glow x={0.28 + 0.03 * Math.sin(t * 0.21)} y={0.3} size={1300} color={palette.plum} opacity={0.75} />
        <Glow x={0.76} y={0.62 + 0.04 * Math.cos(t * 0.17)} size={1100} color={palette.purple} opacity={0.22 + 0.14 * calm} />
        <Glow x={0.5} y={1.08} size={1500} color={palette.violet} opacity={0.2 + 0.2 * calm} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: palette.black, opacity: 0.6 * noisy }} />

      <AbsoluteFill style={{ transform: `scale(${1 + (cam - 1) * 0.6})` }}>
        {Array.from({ length: 70 }, (_, i) => {
          const size = 2 + rand(i) * 4
          const x = rand(i + 100) * W + 30 * Math.sin(t * 0.3 + i)
          const y = (((rand(i + 200) * H - t * (6 + rand(i + 300) * 14)) % H) + H) % H
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                background: i % 3 ? palette.lavender : palette.mist,
                opacity: dust * (0.08 + rand(i + 400) * 0.3) * (0.7 + 0.3 * Math.sin(t * 1.3 + i)),
                filter: size > 4.5 ? 'blur(2px)' : undefined,
              }}
            />
          )
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function Glow({ x, y, size, color, opacity }: { x: number; y: number; size: number; color: string; opacity: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x * W - size / 2,
        top: y * H - size / 2,
        width: size,
        height: size,
        background: `radial-gradient(closest-side, ${color}, transparent)`,
        opacity,
      }}
    />
  )
}

/* Scene 5: the space answers each sound that is turned up. Rain falls as thin
   streaks, the fireplace warms one corner, the forest drifts soft shapes past. */
export function Atmosphere({ t }: { t: number }) {
  const leaving = 1 - ramp(t, FOLD, FOLD + 1.4)
  const rain = (level(RAIN, t) / 0.6) * leaving
  const fire = (level(FIRE, t) / 0.35) * leaving
  const forest = (level(FOREST, t) / 0.2) * leaving
  if (rain + fire + forest <= 0) return null
  const flicker = 1 + 0.07 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23.7)

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: -500,
          top: H - 760,
          width: 1700,
          height: 1300,
          background: `radial-gradient(closest-side, ${palette.plum}, transparent)`,
          opacity: fire * flicker,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -250,
          top: H - 420,
          width: 1100,
          height: 800,
          background: `radial-gradient(closest-side, ${palette.danger}, transparent)`,
          opacity: 0.13 * fire * flicker,
        }}
      />

      {Array.from({ length: 9 }, (_, i) => {
        const size = 150 + rand(i + 500) * 220
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ((rand(i + 600) * (W + 600) + t * (10 + rand(i + 700) * 16)) % (W + 600)) - 300,
              top: rand(i + 800) * H - size / 2 + 26 * Math.sin(t * 0.5 + i),
              width: size,
              height: size * 0.55,
              borderRadius: '60% 40% 55% 45% / 70% 45% 55% 30%',
              background: i % 2 ? palette.lilac : palette.purple,
              opacity: 0.26 * forest,
              filter: 'blur(26px)',
              transform: `rotate(${rand(i + 900) * 180 + t * 5}deg)`,
            }}
          />
        )
      })}

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 80 }, (_, i) => {
          const length = 36 + rand(i + 1000) * 70
          const fall = (rand(i + 1100) + t * (0.45 + rand(i + 1200) * 0.4)) % 1
          const x = rand(i + 1300) * (W + 200) - 100
          const y = fall * (H + 300) - 150
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - length * 0.12}
              y2={y + length}
              stroke={palette.lavender}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={rain * (0.08 + rand(i + 1400) * 0.26)}
            />
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}

/* Faint film grain and a soft vignette over the whole frame. */
export function Finish({ frame }: { frame: number }) {
  return (
    <>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at ${CX}px ${CY}px, transparent 55%, rgba(10, 7, 13, 0.6) 100%)` }}
      />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay' }}>
        <svg width={W} height={H}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W} height={H} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  )
}
