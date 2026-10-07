import type { ReactNode } from 'react'
import { blur, colors, fonts, palette, radius, shadows, signature } from '../theme'
import { CARD_H, CARD_W, CX, DIAL_R, FIRE, FOREST, FOLD, H, LINE_FROM, LINE_TO, LINE_Y, LOGO_Y, RAIN, S, W, card, dial, ease, lerp, level, ramp, said, sounds } from './timeline'

const PANEL_W = 1640
const PANEL_H = 600
const PANEL_Y = 470

const glassEdge = `${S}px solid ${colors.line}`

/* Scenes 4 and 5: the mixer. The panel opens out of the ring, the cards slide
   out from the middle, and it all folds back in for the logo. */
export function Mixer({ t }: { t: number }) {
  const open = ramp(t, said.ambiancy, 15.8, ease)
  if (open <= 0 || t > FOLD + 1.4) return null
  const close = ramp(t, FOLD, FOLD + 1.1)
  const width = lerp(180, PANEL_W, open) * lerp(1, 0.3, close)
  const height = lerp(180, PANEL_H, open) * lerp(1, 0.3, close)
  const chrome = ramp(t, 15.6, 16.2) * (1 - ramp(t, FOLD - 0.2, FOLD + 0.2))
  const named = ramp(t, said.yours, said.yours + 0.5, ease)

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: CX - width / 2,
          top: lerp(PANEL_Y, LOGO_Y, close) - height / 2,
          width,
          height,
          borderRadius: radius.cardHero * S,
          background: 'rgba(26, 18, 32, 0.62)',
          border: glassEdge,
          boxShadow: `0 60px 160px rgba(0, 0, 0, 0.5), inset 0 ${S}px 0 rgba(245, 240, 250, 0.06)`,
          backdropFilter: `blur(${blur.card * S}px)`,
          opacity: open * (1 - ramp(t, FOLD + 0.5, FOLD + 1.1)),
        }}
      >
        <div style={{ position: 'absolute', left: 56, top: 40, fontSize: 40, fontWeight: fonts.weight.bold, color: palette.white, opacity: chrome }}>
          Ambian<span style={{ color: palette.lilac }}>cy.</span>
        </div>

        {/* The mix's name: unnamed until the three sounds are joined. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 36,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: 60,
            padding: '0 30px',
            borderRadius: radius.button * S,
            border: `${S}px solid ${named > 0.5 ? palette.lilac : colors.line}`,
            background: named > 0.5 ? colors.tintSelected : colors.tint,
            fontSize: 28,
            fontWeight: fonts.weight.bold,
            whiteSpace: 'nowrap',
            opacity: chrome,
          }}
        >
          <Equalizer t={t} active={named} />
          <span style={{ position: 'relative' }}>
            <span style={{ color: colors.accent, opacity: named }}>Rainy Focus</span>
            <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', color: colors.textMuted, opacity: 1 - named }}>New mix</span>
          </span>
        </div>
      </div>

      <RainWave t={t} />

      {/* Rain is drawn last so the cards that arrive later slide out from behind it. */}
      {[0, 1, 3, 4, RAIN].map((i) => (
        <SoundCard key={sounds[i].id} i={i} t={t} name={sounds[i].name} />
      ))}

      <Links t={t} />
    </>
  )
}

function SoundCard({ i, t, name }: { i: number; t: number; name: string }) {
  const c = card(i, t)
  const lv = level(i, t)
  const on = ramp(lv, 0, 0.04)
  const contents = 1 - ramp(t, FOLD + 0.1, FOLD + 0.7)
  const around = Math.PI * 2 * DIAL_R

  return (
    <div
      style={{
        position: 'absolute',
        left: c.x - CARD_W / 2,
        top: c.y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `scale(${c.scale})`,
        opacity: c.opacity,
        borderRadius: radius.card * S,
        background: on > 0 ? `rgba(54, 33, 62, ${lerp(0.55, 0.78, on)})` : 'rgba(31, 21, 39, 0.78)',
        border: `${S}px solid rgba(201, 182, 228, ${lerp(0.16, 0.5, on)})`,
        boxShadow: `0 ${24 + i * 2}px 70px rgba(0, 0, 0, 0.5), inset 0 ${S}px 0 rgba(245, 240, 250, 0.07)`,
      }}
    >
      <svg width={CARD_W} height={CARD_H} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: contents }}>
        <g transform={`translate(${CARD_W / 2} 108)`}>
          <circle r={DIAL_R} fill="none" stroke={colors.line} strokeWidth={7} />
          {lv > 0.003 && (
            <>
              <circle
                r={DIAL_R}
                fill="none"
                stroke={palette.lilac}
                strokeWidth={18}
                strokeDasharray={`${around * lv} ${around}`}
                transform="rotate(-90)"
                opacity={0.22}
              />
              <circle
                r={DIAL_R}
                fill="none"
                stroke={palette.lavender}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={`${around * lv} ${around}`}
                transform="rotate(-90)"
              />
            </>
          )}
          <g
            transform="translate(-27 -27) scale(1.125)"
            fill="none"
            stroke={on > 0.5 ? palette.lavender : palette.muted}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icons[i]}
          </g>
        </g>
      </svg>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 212, textAlign: 'center', opacity: contents }}>
        <div style={{ fontSize: 32, fontWeight: fonts.weight.bold, color: on > 0.5 ? colors.accent : palette.white }}>{name}</div>
        <div style={{ marginTop: 6, fontSize: 25, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
          {lv > 0.003 ? `${Math.round(lv * 100)}%` : 'Off'}
        </div>
      </div>
    </div>
  )
}

/* Line icons on a 48px grid, in the order of `sounds`. */
const icons: ReactNode[] = [
  <>
    <path d="M6 17c5-5 9-5 13 0s8 5 12 0 7-4 11-1" />
    <path d="M6 26c5-5 9-5 13 0s8 5 12 0 7-4 11-1" />
    <path d="M6 35c5-5 9-5 13 0s8 5 12 0 7-4 11-1" />
  </>,
  <path d="M25 5c1 8 11 12 11 23a12 12 0 0 1-24 0c0-5 2-9 5-11 0 4 1 6 4 7 0-7 0-13 4-19z" />,
  <>
    <path d="M15 28a8 8 0 0 1 0-16 11 11 0 0 1 21 3 6.5 6.5 0 0 1 0 13z" />
    <path d="M17 34l-2 7M25 34l-2 7M33 34l-2 7" />
  </>,
  <>
    <path d="M24 5l9 13h-5l9 13H11l9-13h-5z" />
    <path d="M24 31v11" />
  </>,
  <>
    <path d="M10 19h24v9a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z" />
    <path d="M34 22h2a4.5 4.5 0 0 1 0 9h-3" />
    <path d="M17 6c-2 3 2 4 0 8M26 6c-2 3 2 4 0 8" />
  </>,
]

/* The three chosen sounds joined into one ambience by thin lavender lines. */
function Links({ t }: { t: number }) {
  const fade = 1 - ramp(t, FOLD + 0.3, FOLD + 0.9)
  if (t < said.completely || fade <= 0) return null
  const pairs = [
    [FIRE, RAIN, said.completely],
    [RAIN, FOREST, said.completely + 0.2],
  ] as const
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} opacity={fade}>
      {pairs.map(([from, to, at]) => {
        const a = dial(from, t)
        const b = dial(to, t)
        const x1 = a.x + a.r + 16
        const x2 = b.x - b.r - 16
        if (x2 <= x1) return null
        const d = `M${x1} ${a.y}Q${(x1 + x2) / 2} ${(a.y + b.y) / 2 - 34} ${x2} ${b.y}`
        const drawn = ramp(t, at, at + 0.5)
        return (
          <g key={from} fill="none" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - drawn}>
            <path d={d} pathLength={1} stroke={palette.lilac} strokeWidth={10} opacity={0.2} />
            <path d={d} pathLength={1} stroke={palette.lavender} strokeWidth={2.5} />
          </g>
        )
      })}
    </svg>
  )
}

/* A soft waveform along the foot of the panel that grows with the rain. */
function RainWave({ t }: { t: number }) {
  const opacity = ramp(t, 16, 17) * (1 - ramp(t, FOLD - 0.2, FOLD + 0.3))
  if (opacity <= 0) return null
  const height = 6 + 36 * level(RAIN, t)
  const reach = PANEL_W / 2 - 70
  let d = ''
  for (let n = 0; n <= 160; n++) {
    const u = n / 160
    const y = PANEL_Y + 256 + height * (0.6 * Math.sin(u * 26 - t * 1.8) + 0.4 * Math.sin(u * 61 + t * 2.6)) * Math.sin(Math.PI * u)
    d += `${n ? 'L' : 'M'}${(CX - reach + u * reach * 2).toFixed(1)} ${y.toFixed(1)}`
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} opacity={opacity} fill="none" strokeLinecap="round">
      <path d={d} stroke={palette.lilac} strokeWidth={10} opacity={0.16} />
      <path d={d} stroke={palette.lavender} strokeWidth={2.5} opacity={0.6} />
    </svg>
  )
}

/* The site's three bars; they only move once the mix is playing. */
function Equalizer({ t, active }: { t: number; active: number }) {
  const eq = signature.equalizer
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: eq.gap * S * 0.75, height: 26 }}>
      {Array.from({ length: eq.bars }, (_, b) => {
        const swing = 0.5 + 0.5 * Math.sin((Math.PI * (t + b * eq.barOffset)) / eq.halfCycle)
        return (
          <i
            key={b}
            style={{
              width: eq.barWidth * S * 0.75,
              height: '100%',
              borderRadius: eq.barRadius * S,
              background: active > 0.5 ? eq.color : palette.muted,
              transformOrigin: 'bottom',
              transform: `scaleY(${lerp(eq.minScale, lerp(eq.minScale, eq.maxScale, swing), active)})`,
            }}
          />
        )
      })}
    </span>
  )
}

/* Scene 6: the folded cards settle into one rounded shape, which opens into
   the wordmark. The dot draws the wave underneath. */
export function Logo({ t, dotX }: { t: number; dotX: number }) {
  const merged = ramp(t, FOLD + 0.6, FOLD + 1.3)
  if (merged <= 0) return null
  const opened = ramp(t, said.ambiancyAgain, said.ambiancyAgain + 0.8, ease)
  const shown = ramp(t, said.ambiancyAgain, said.ambiancyAgain + 0.7)
  const width = lerp(lerp(110, 230, merged), 800, opened)
  const height = lerp(lerp(150, 160, merged), 210, opened)

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: CX - 800,
          top: LOGO_Y - 330,
          width: 1600,
          height: 900,
          background: `radial-gradient(closest-side, ${palette.violet}, transparent)`,
          opacity: 0.34 * ramp(t, 25, 26.6),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CX - width / 2,
          top: LOGO_Y - height / 2,
          width,
          height,
          borderRadius: radius.cardHero * S,
          background: 'rgba(54, 33, 62, 0.8)',
          border: `${S}px solid rgba(201, 182, 228, 0.5)`,
          boxShadow: `0 0 90px rgba(142, 122, 181, 0.5), ${shadows.card}`,
          opacity: merged * (1 - opened),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: LOGO_Y - 120,
          height: 240,
          display: 'grid',
          placeItems: 'center',
          fontSize: 176,
          fontWeight: fonts.weight.bold,
          lineHeight: 1,
          color: signature.wordmark.leadColor,
          opacity: shown,
          transform: `scale(${lerp(0.9, 1, opened)})`,
          filter: `blur(${(1 - shown) * 14}px)`,
        }}
      >
        <span>
          {signature.wordmark.lead}
          <span style={{ color: signature.wordmark.accentColor }}>{signature.wordmark.accent}</span>
        </span>
      </div>
      <DrawnWave t={t} dotX={dotX} />
    </>
  )
}

/* The line the dot leaves behind, coming alive as a wave once the dot has passed. */
function DrawnWave({ t, dotX }: { t: number; dotX: number }) {
  if (t < said.mix || dotX <= LINE_FROM) return null
  let d = ''
  for (let x = LINE_FROM; x <= dotX; x += 4) {
    const u = (x - LINE_FROM) / (LINE_TO - LINE_FROM)
    const behind = Math.min(1, (dotX - x) / 170)
    const y = LINE_Y + 20 * Math.sin(u * Math.PI * 9 - t * 4.5) * Math.sin(Math.PI * u) * behind * behind
    d += `${d ? 'L' : 'M'}${x} ${y.toFixed(1)}`
  }
  d += `L${dotX.toFixed(1)} ${LINE_Y}`
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={palette.lilac} strokeWidth={12} opacity={0.2} />
      <path d={d} stroke={palette.lavender} strokeWidth={3} />
    </svg>
  )
}
