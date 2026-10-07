/* Ambiancy's design system, extracted from web/src/styles.css for use in Remotion.
   Self-contained: no imports, so it can be copied into any Remotion project.

   Sizes are the site's CSS pixels (its root font size is 17px). A 1920x1080
   composition is viewed from further away than a browser, so multiply sizes,
   radii and shadows by `videoScale` (or your own factor) rather than using them raw.

   Font: Tuffy, regular and bold only. The site loads it with
     import '@fontsource/tuffy/400.css'
     import '@fontsource/tuffy/700.css'
   and the same two imports work in a Remotion entry file. */

export const videoScale = 2

export const fonts = {
  family: "'Tuffy', system-ui, -apple-system, 'Segoe UI', sans-serif",
  weight: {
    regular: 400,
    // Headings, the brand, buttons that matter, names of sounds and scenes.
    bold: 700,
  },
  lineHeight: {
    body: 1.5,
    heading: 1.15,
  },
  // Only the hero headline is tracked.
  letterSpacing: {
    hero: '-0.01em',
  },
  size: {
    hero: 66,
    title: 41,
    greeting: 34,
    cardTitle: 31,
    section: 27,
    brand: 27,
    lead: 20,
    body: 17,
    hint: 15,
    small: 14,
  },
} as const

/* The named purples, dark to light, exactly as the site names them. */
export const palette = {
  black: '#0a070d',
  night: '#150e1a',
  panel: '#1a1220',
  ink: '#1f1527',
  plum: '#36213e',
  wash: '#4b3574',
  purple: '#554971',
  violet: '#6a4e98',
  lilac: '#8e7ab5',
  muted: '#b9aec6',
  lavender: '#c9b6e4',
  soft: '#dcd3e7',
  lead: '#e4dcee',
  mist: '#f5f0fa',
  white: '#ffffff',
  danger: '#ffb4a8',
} as const

export const colors = {
  // Filled buttons, step numbers, the second half of the wordmark.
  primary: palette.lilac,
  primaryHover: palette.violet,
  onPrimary: palette.white,
  // Whatever is playing or selected, focus rings, sliders, links.
  accent: palette.lavender,
  onAccent: palette.night,

  text: palette.mist,
  textHeading: palette.white,
  textLead: palette.lead,
  textBody: palette.soft,
  textMuted: palette.muted,
  danger: palette.danger,

  background: palette.night,
  // Behind the player's panels.
  backgroundDeep: palette.black,
  surface: palette.ink,
  surfacePanel: palette.panel,
  surfaceRaised: palette.plum,

  // Lavender at low opacity does the work of borders and tints.
  line: 'rgba(201, 182, 228, 0.16)',
  tint: 'rgba(201, 182, 228, 0.1)',
  tintStrong: 'rgba(201, 182, 228, 0.2)',
  tintSelected: 'rgba(201, 182, 228, 0.12)',
  hover: 'rgba(255, 255, 255, 0.07)',
  hoverStrong: 'rgba(255, 255, 255, 0.15)',
  // Glass: put a backdrop blur behind these.
  glass: 'rgba(31, 21, 39, 0.72)',
  glassHeader: 'rgba(21, 14, 26, 0.72)',
  shade: 'rgba(21, 14, 26, 0.9)',
} as const

export const radius = {
  // Buttons and chips are full pills; round buttons are circles.
  button: 30,
  circle: '50%',
  input: 10,
  // Cards, largest to smallest.
  cardHero: 22,
  cardPhoto: 20,
  card: 18,
  cardSmall: 14,
  panel: 12,
  tile: 10,
  artwork: 8,
  thumb: 6,
} as const

/* Shadows are soft, wide and straight down. Black at 50% under anything that
   floats; the one coloured shadow is the violet glow under a primary button. */
export const shadows = {
  primaryGlow: '0 8px 24px rgba(106, 78, 152, 0.45)',
  card: '0 30px 80px rgba(0, 0, 0, 0.5)',
  artwork: '0 8px 24px rgba(0, 0, 0, 0.5)',
  badge: '0 6px 14px rgba(0, 0, 0, 0.5)',
} as const

export const borders = {
  hairline: `1px solid ${colors.line}`,
  focusRing: `3px solid ${palette.lavender}`,
  focusOffset: 2,
} as const

export const blur = {
  header: 14,
  card: 18,
  chip: 6,
} as const

export const gradients = {
  // Placeholder behind every picture.
  artwork: `linear-gradient(135deg, ${palette.plum}, ${palette.purple})`,
  // Top of the player's main panel, fading into the panel colour.
  playerWash: `linear-gradient(180deg, ${palette.wash} 0, ${palette.panel} 323px)`,
  // Rising from the bottom of the closing call to action.
  closingGlow: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(106, 78, 152, 0.4), transparent)',
  // Over a full-bleed photo: dark on the text side, fading into the page below.
  heroScrim: `linear-gradient(0deg, ${palette.night} 0%, transparent 34%), linear-gradient(90deg, rgba(21, 14, 26, 0.94) 0%, rgba(21, 14, 26, 0.72) 48%, rgba(21, 14, 26, 0.42) 100%)`,
  // Over a photo card with text at the bottom.
  photoScrim: 'linear-gradient(0deg, rgba(21, 14, 26, 0.9) 8%, rgba(21, 14, 26, 0.55) 45%, rgba(21, 14, 26, 0.1) 80%)',
  captionScrim: 'linear-gradient(0deg, rgba(21, 14, 26, 0.9), transparent)',
} as const

/* Per-sound colours, shown while a photo loads. Keys are the sound ids. */
export const soundGradients = {
  rain: 'linear-gradient(180deg, #2f4552, #6f8b98)',
  wind: 'linear-gradient(160deg, #3b2f1c, #b58a3c)',
  creek: 'linear-gradient(160deg, #2f4a24, #8a7a2e)',
  cicadas: 'linear-gradient(140deg, #3f6a26, #9cc25a)',
  'coffee-shop': 'linear-gradient(160deg, #5a3a1c, #c9973f)',
  fireplace: 'radial-gradient(ellipse at 50% 100%, #ff8a1f, #5a2c22 60%, #2a1512)',
  'birds-chirping': 'linear-gradient(135deg, #5f7f9c, #c2a57a)',
  'ocean-waves': 'linear-gradient(180deg, #2d8f8f, #14465f)',
  thunderstorm: 'linear-gradient(180deg, #2b2350, #7a5fa8)',
  'night-forest': 'linear-gradient(180deg, #0f1f45, #24407a)',
} as const

/* Durations are in seconds: multiply by fps for frames.
   `ease` is the site's one curve; pass it to Easing.bezier(...motion.ease). */
export const motion = {
  ease: [0.2, 0.7, 0.2, 1],
  // Entrance: fade in while rising, each piece a beat after the last.
  rise: { duration: 0.8, distance: 22, stagger: 0.12 },
  // Sections arriving later.
  reveal: { duration: 0.7, distance: 26 },
  // A backdrop photo settling from slightly zoomed in.
  drift: { duration: 18, fromScale: 1.12 },
  // Photo cards zoom a little under the pointer.
  photoZoom: { duration: 0.6, toScale: 1.05 },
  // Hover and selection changes.
  quick: 0.18,
} as const

/* The details that make a frame read as Ambiancy. */
export const signature = {
  // Two-tone wordmark: "Ambian" in white, "cy." in lilac, bold, with the full stop.
  wordmark: { lead: 'Ambian', accent: 'cy.', leadColor: palette.white, accentColor: palette.lilac },
  // Three lavender bars that bounce while something plays.
  equalizer: {
    bars: 3,
    barWidth: 4,
    gap: 3,
    height: 17,
    barRadius: 2,
    color: palette.lavender,
    // Each bar scales between these heights, there and back, from the bottom.
    minScale: 0.3,
    maxScale: 1,
    halfCycle: 0.9,
    barOffset: 0.3,
  },
  // Lavender circle with a night-coloured play or pause glyph, bottom right of a picture.
  playBadge: { size: 47, inset: 8.5, background: palette.lavender, glyph: palette.night, shadow: shadows.badge },
  // The main transport button: a white circle on the black bar.
  playButton: { size: 51, background: palette.white, glyph: palette.black, hoverScale: 1.06 },
  // Overlapping thumbnails of the sounds in the mix.
  stackedThumbs: { size: 55, overlap: 27, radius: radius.artwork, border: `2px solid ${palette.black}` },
  // Numbered steps: a lilac circle with a bold white number.
  stepNumber: { size: 37, background: palette.lilac, color: palette.white },
  // The player is rounded panels on black with a narrow gap between them.
  panelGap: 8.5,
} as const

export const theme = {
  videoScale,
  fonts,
  palette,
  colors,
  radius,
  shadows,
  borders,
  blur,
  gradients,
  soundGradients,
  motion,
  signature,
} as const

export type Theme = typeof theme
