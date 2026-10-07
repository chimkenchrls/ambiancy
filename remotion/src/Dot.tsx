import { Easing } from 'remotion'
import { palette } from '../theme'
import { BEAT, dot, ramp } from './timeline'

/* The listener: one small lavender light that every scene follows. */
export function Dot({ t }: { t: number }) {
  const at = dot(t)
  const born = ramp(t, 0.05, 0.7, Easing.out(Easing.back(2)))
  if (born <= 0) return null
  // Dimmer while it is caught in the knot; one quiet beat at the very end.
  const trapped = ramp(t, 10.2, 11.2) * (1 - ramp(t, 12.7, 13.4))
  const beat = t > BEAT ? Math.exp(-(t - BEAT) * 5) : 0
  const size = 20 * born * (1 + 0.1 * Math.sin(t * 2.2)) * (1 + 0.7 * beat)

  return (
    <>
      {/* A short tail of where it has just been. */}
      {Array.from({ length: 14 }, (_, n) => {
        const past = dot(Math.max(0, t - (n + 1) * 0.02))
        const moved = Math.hypot(past.x - at.x, past.y - at.y)
        if (moved < 1.5) return null
        const tail = size * (1 - n / 16)
        return (
          <div
            key={n}
            style={{
              position: 'absolute',
              left: past.x - tail / 2,
              top: past.y - tail / 2,
              width: tail,
              height: tail,
              borderRadius: '50%',
              background: palette.lilac,
              opacity: 0.32 * (1 - n / 14),
              filter: 'blur(3px)',
            }}
          />
        )
      })}

      {beat > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: at.x - 120,
            top: at.y - 120,
            width: 240,
            height: 240,
            borderRadius: '50%',
            border: `2px solid ${palette.lavender}`,
            opacity: beat * 0.7,
            transform: `scale(${0.15 + (1 - beat) * 0.85})`,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: at.x - size / 2,
          top: at.y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${palette.mist}, ${palette.lavender} 55%)`,
          boxShadow: `0 0 ${18 + 30 * beat}px 6px rgba(201, 182, 228, 0.75), 0 0 70px 26px rgba(142, 122, 181, ${0.4 + 0.3 * beat})`,
          opacity: 1 - 0.3 * trapped,
        }}
      />
    </>
  )
}
