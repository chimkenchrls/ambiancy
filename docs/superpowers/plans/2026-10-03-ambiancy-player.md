# Ambiancy Player (Plan 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new clean repository containing the Ambiancy player (mixer, scenes, share links, timers, landing page) running in Docker Compose on a laptop, with no backend.

**Architecture:** A React and TypeScript single-page app built by Vite. All playback goes through one audio engine module built on the Web Audio API; the UI only talks to that module's interface. Sounds and scenes are JSON files in the repo. Audio files are served from a separate media container, standing in for Azure Blob Storage.

**Tech Stack:** Node 22, Vite 8, React 19, React Router 8, TypeScript 7, Vitest 5, Testing Library, Docker Compose, nginx, FFmpeg (for placeholder sounds).

**Spec:** `docs/superpowers/specs/2026-10-03-ambiancy-redesign-design.md`

## Where this plan sits

The spec has five build stages. This is the first of several plans, each ending in working software:

| Plan | Covers |
|---|---|
| **1 (this one)** | New repo, player, scenes, share links, timers, landing page, Docker Compose |
| 2 | Go API, Postgres, sign-in, saved mixes |
| 3 | Gallery and likes |
| 4 | Install and offline support |
| 5 | Pull-request checks (spec stage 2), including lint and end-to-end tests |
| 6 | Terraform by hand (spec stage 3) |
| 7 | Deploy pipeline and domain (spec stage 4) |
| 8 | Monitoring and status page (spec stage 5) |

Deliberately left for later plans: `/gallery`, `/me`, `/status`, `/terms`, `/privacy`, linting, Playwright tests, the service worker, real licensed sounds and artwork.

## Global Constraints

- New repository lives at `/mnt/heavy-data/ambiancy-v2`. The old clone at `/mnt/heavy-data/ambiancy` is read-only reference; no media file is copied from it.
- No audio or image media is committed to git. `media/` is git-ignored.
- A mix has at most 8 layers. Volume is an integer from 0 to 100.
- Every sound in the catalogue has `source`, `licence` and `author` filled in.
- Playback must work with no API and no account.
- The UI calls the audio engine only through the `AudioEngine` interface.
- Node 22 and npm. No other package manager.
- This machine runs Fedora with SELinux enforcing: every Docker bind mount needs the `z` option.
- Every commit message ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Task 1 commits to `main`. Tasks 2 to 10 commit to the branch `feat/player`.
- Renaming the old GitHub repo, creating the new one, pushing and opening the pull request are outward-facing: confirm with the owner at each of those steps before running them.

## Review Focus

1. **A share link opened cold.** Browsers block audio until the visitor clicks. `/mix#...` must show the mix and a "Play this mix" button, not try to play and fail silently. Test in Task 9.
2. **A malformed share link.** Unknown sound IDs, non-numeric or huge volumes, duplicates, more than 8 layers, broken `%` escapes. The page must never crash; bad parts are dropped. Tests in Task 3.
3. **A layer removed while its audio is still downloading.** It must not start playing when the download finishes. Test in Task 4.
4. **A sound file that fails to load.** That layer shows an error with a retry control; other layers keep playing; retry works. Tests in Tasks 4 and 7.
5. **A timer in a background tab or a sleeping laptop.** Browser timers get throttled. The timer must finish by the clock, not by counting ticks, and fire exactly once. Test in Task 5.

## File Structure

```
ambiancy-v2/
  .gitignore
  README.md
  compose.yaml                      local stack: web + media
  deploy/media.nginx.conf           media server config (CORS, caching)
  tools/make-dev-sounds.sh          generates placeholder loops into media/
  media/                            git-ignored; audio files live here locally
  docs/
    superpowers/specs/...           the spec
    superpowers/plans/...           this plan
    stages/01-containers.md         stage note: what was added and why
  web/
    package.json, tsconfig.json, vite.config.ts, index.html
    Dockerfile, nginx.conf, .dockerignore
    src/
      main.tsx                      browser entry: creates engine, mounts app
      App.tsx                       route table
      styles.css
      mix/mix.ts                    Layer and Mix types, limits, normalising
      mix/shareLink.ts              encode and decode a mix in a link
      catalogue/sounds.json         the sounds
      catalogue/scenes.json         the scenes
      catalogue/index.ts            typed access to the catalogue
      audio/engine.ts               the audio engine
      audio/bufferLoader.ts         fetches and decodes audio, with a cache
      audio/createBrowserEngine.ts  wires the engine to the real browser
      timer/timer.ts                pure timer maths
      timer/useTimer.ts             React hook around it
      player/PlayerContext.tsx      gives components the engine and its state
      player/SoundGrid.tsx          pick sounds
      player/LayerList.tsx          the current mix: volume, remove, retry
      player/SceneList.tsx          ready-made scenes
      player/MasterControls.tsx     master volume, stop all
      player/TimerControl.tsx       sleep and focus timer
      player/ShareButton.tsx        copy a share link
      player/PlayerPage.tsx         /play
      pages/Layout.tsx              header and footer
      pages/LandingPage.tsx         /
      pages/SharedMixPage.tsx       /mix
      pages/LicencesPage.tsx        /licences
      pages/NotFoundPage.tsx
      test/setup.ts                 test setup
      test/fakeAudio.ts             fake audio context for tests
      test/renderWithEngine.tsx     render helper for component tests
```

---

### Task 1: New repository and web tooling

**Files:**
- Create: `.gitignore`, `README.md`
- Create: `docs/` (copied from the old clone)
- Create: `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts`, `web/index.html`
- Create: `web/src/main.tsx`, `web/src/App.tsx`, `web/src/test/setup.ts`
- Test: `web/src/App.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test`, `npm run typecheck` and `npm run build` in `web/`; the `main` branch on GitHub; the `feat/player` branch for later tasks.

- [ ] **Step 1: Create the repository and copy the docs**

```bash
mkdir -p /mnt/heavy-data/ambiancy-v2
cd /mnt/heavy-data/ambiancy-v2
git init -b main
cp -r /mnt/heavy-data/ambiancy/docs ./docs
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
node_modules/
dist/
coverage/
media/
.env
.env.*
!.env.example
*.log
.DS_Store
```

- [ ] **Step 3: Write `README.md`**

```markdown
# Ambiancy

A free ambient sound mixer. Layer sounds such as rain, a fireplace and a coffee shop, set each one's volume, and share the mix by link.

This repository is also a DevOps portfolio project: the app is small, and the way it is built, shipped and run is the point. See `docs/superpowers/specs/` for the design and `docs/stages/` for a plain-language note on each stage.

## Run it locally

Requirements: Docker, Node 22, FFmpeg.

    ./tools/make-dev-sounds.sh     # generate placeholder sounds into media/
    docker compose up -d --build   # web on http://localhost:8080, media on :8081

For development with hot reload:

    docker compose up -d media
    cd web && npm install && npm run dev   # http://localhost:5173

## Tests

    cd web && npm test

## Licences

Sounds and their licences are listed in `web/src/catalogue/sounds.json` and on the `/licences` page.
```

- [ ] **Step 4: Write `web/package.json`**

```json
{
  "name": "ambiancy-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 5: Install dependencies**

```bash
cd /mnt/heavy-data/ambiancy-v2/web
npm install react react-dom react-router
npm install -D vite @vitejs/plugin-react typescript vitest jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @types/react @types/react-dom
```

Expected: `found 0 vulnerabilities`, and `package-lock.json` created.

- [ ] **Step 6: Write `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 7: Write `web/vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 8: Write `web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="A free ambient sound mixer for focus, relaxation and sleep." />
    <title>Ambiancy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Write `web/src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 10: Write the failing test `web/src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the product name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ambiancy')
  })
})
```

- [ ] **Step 11: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run`
Expected: FAIL, with an error that `./App` cannot be resolved.

- [ ] **Step 12: Write `web/src/App.tsx` and `web/src/main.tsx`**

`web/src/App.tsx`:

```tsx
export function App() {
  return <h1>Ambiancy</h1>
}
```

`web/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 13: Run tests, type-check and build**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npm test && npm run build`
Expected: `1 passed`, then a `dist/` folder and `✓ built`.

- [ ] **Step 14: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add .
git commit -m "chore: new repository with web tooling and design docs" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 15: Publish to GitHub (confirm with the owner first)**

This renames the old private repo, then creates the new public one under the original name.

```bash
gh repo rename ambiancy-legacy --repo chimkenchrls/ambiancy --yes
git -C /mnt/heavy-data/ambiancy remote set-url origin https://github.com/chimkenchrls/ambiancy-legacy.git
cd /mnt/heavy-data/ambiancy-v2
gh repo create chimkenchrls/ambiancy --public --source=. --remote=origin --push \
  --description "Ambient sound mixer, built and run as a DevOps portfolio project"
```

Expected: `gh repo view chimkenchrls/ambiancy --json visibility` shows `PUBLIC`, and `gh repo view chimkenchrls/ambiancy-legacy --json visibility` shows `PRIVATE`.

- [ ] **Step 16: Create the working branch**

```bash
cd /mnt/heavy-data/ambiancy-v2
git switch -c feat/player
```

---

### Task 2: Mix rules and the sound catalogue

**Files:**
- Create: `web/src/mix/mix.ts`
- Create: `web/src/catalogue/sounds.json`, `web/src/catalogue/scenes.json`, `web/src/catalogue/index.ts`
- Test: `web/src/mix/mix.test.ts`, `web/src/catalogue/catalogue.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `MAX_LAYERS: 8`
  - `interface Layer { soundId: string; volume: number }`, `type Mix = Layer[]`
  - `clampVolume(value: number): number`
  - `normaliseMix(layers: readonly Layer[], isValidSoundId: (id: string) => boolean): Mix`
  - `interface Sound { id; name; description; audioFile; artwork: string | null; source; licence; author }`
  - `interface Scene { id: string; name: string; description: string; layers: Mix }`
  - `SOUNDS: readonly Sound[]`, `SCENES: readonly Scene[]`
  - `getSound(id: string): Sound | undefined`, `isSoundId(id: string): boolean`, `audioUrl(sound: Sound): string`

- [ ] **Step 1: Write the failing test `web/src/mix/mix.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { MAX_LAYERS, clampVolume, normaliseMix } from './mix'

const known = (id: string) => ['rain', 'wind', 'creek'].includes(id) || id.startsWith('s')

describe('clampVolume', () => {
  it('keeps values inside 0 to 100', () => {
    expect(clampVolume(40)).toBe(40)
    expect(clampVolume(-5)).toBe(0)
    expect(clampVolume(250)).toBe(100)
  })

  it('rounds to a whole number', () => {
    expect(clampVolume(40.6)).toBe(41)
  })

  it('turns NaN into 0 and Infinity into 100', () => {
    expect(clampVolume(Number.NaN)).toBe(0)
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(100)
  })
})

describe('normaliseMix', () => {
  it('drops sounds that are not in the catalogue', () => {
    const mix = normaliseMix(
      [
        { soundId: 'rain', volume: 70 },
        { soundId: 'nope', volume: 10 },
      ],
      known,
    )
    expect(mix).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('keeps the first of a repeated sound', () => {
    const mix = normaliseMix(
      [
        { soundId: 'rain', volume: 70 },
        { soundId: 'rain', volume: 20 },
      ],
      known,
    )
    expect(mix).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('clamps volumes', () => {
    expect(normaliseMix([{ soundId: 'wind', volume: 999 }], known)).toEqual([{ soundId: 'wind', volume: 100 }])
  })

  it('keeps at most MAX_LAYERS layers', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ soundId: `s${i}`, volume: 50 }))
    const mix = normaliseMix(many, known)
    expect(mix).toHaveLength(MAX_LAYERS)
    expect(mix[0]).toEqual({ soundId: 's0', volume: 50 })
  })

  it('returns a new array and does not change the input', () => {
    const input = [{ soundId: 'rain', volume: 250 }]
    normaliseMix(input, known)
    expect(input).toEqual([{ soundId: 'rain', volume: 250 }])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/mix/mix.test.ts`
Expected: FAIL, `./mix` cannot be resolved.

- [ ] **Step 3: Write `web/src/mix/mix.ts`**

```ts
export const MAX_LAYERS = 8

export interface Layer {
  soundId: string
  volume: number
}

export type Mix = Layer[]

export function clampVolume(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function normaliseMix(layers: readonly Layer[], isValidSoundId: (id: string) => boolean): Mix {
  const seen = new Set<string>()
  const result: Mix = []
  for (const layer of layers) {
    if (result.length === MAX_LAYERS) break
    if (!isValidSoundId(layer.soundId) || seen.has(layer.soundId)) continue
    seen.add(layer.soundId)
    result.push({ soundId: layer.soundId, volume: clampVolume(layer.volume) })
  }
  return result
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/mix/mix.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the failing test `web/src/catalogue/catalogue.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { SCENES, SOUNDS, audioUrl, getSound, isSoundId } from './index'
import { MAX_LAYERS } from '../mix/mix'

describe('sound catalogue', () => {
  it('has unique ids made of lowercase letters and hyphens', () => {
    const ids = SOUNDS.map((sound) => sound.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/)
  })

  it('records a source, licence and author for every sound', () => {
    for (const sound of SOUNDS) {
      expect(sound.source, sound.id).not.toBe('')
      expect(sound.licence, sound.id).not.toBe('')
      expect(sound.author, sound.id).not.toBe('')
    }
  })

  it('looks sounds up by id', () => {
    expect(getSound('rain')?.name).toBe('Rain')
    expect(getSound('nope')).toBeUndefined()
    expect(isSoundId('rain')).toBe(true)
    expect(isSoundId('nope')).toBe(false)
  })

  it('builds an audio address under the media base', () => {
    const rain = getSound('rain')!
    expect(audioUrl(rain)).toMatch(/^https?:\/\/.+\/audio\/rain\.mp3$/)
  })
})

describe('scenes', () => {
  it('has unique ids', () => {
    const ids = SCENES.map((scene) => scene.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses catalogue sounds, valid volumes and at most MAX_LAYERS layers', () => {
    for (const scene of SCENES) {
      expect(scene.layers.length, scene.id).toBeGreaterThan(0)
      expect(scene.layers.length, scene.id).toBeLessThanOrEqual(MAX_LAYERS)
      const ids = scene.layers.map((layer) => layer.soundId)
      expect(new Set(ids).size, scene.id).toBe(ids.length)
      for (const layer of scene.layers) {
        expect(isSoundId(layer.soundId), `${scene.id}/${layer.soundId}`).toBe(true)
        expect(Number.isInteger(layer.volume), `${scene.id}/${layer.soundId}`).toBe(true)
        expect(layer.volume).toBeGreaterThanOrEqual(0)
        expect(layer.volume).toBeLessThanOrEqual(100)
      }
    }
  })
})
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npx vitest run src/catalogue/catalogue.test.ts`
Expected: FAIL, `./index` cannot be resolved.

- [ ] **Step 7: Write `web/src/catalogue/sounds.json`**

The `source`, `licence` and `author` values describe the placeholder loops generated in Task 10. They are replaced per sound when real recordings are sourced.

```json
[
  {
    "id": "rain",
    "name": "Rain",
    "description": "Steady rainfall on a quiet street.",
    "audioFile": "audio/rain.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "wind",
    "name": "Wind",
    "description": "A low wind moving through open country.",
    "audioFile": "audio/wind.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "creek",
    "name": "Creek",
    "description": "Water running over stones.",
    "audioFile": "audio/creek.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "cicadas",
    "name": "Cicadas",
    "description": "A warm evening hum of insects.",
    "audioFile": "audio/cicadas.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "coffee-shop",
    "name": "Coffee Shop",
    "description": "Soft chatter and clinking cups.",
    "audioFile": "audio/coffee-shop.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "fireplace",
    "name": "Fireplace",
    "description": "A crackling fire close by.",
    "audioFile": "audio/fireplace.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "birds-chirping",
    "name": "Birds Chirping",
    "description": "Morning birdsong in the trees.",
    "audioFile": "audio/birds-chirping.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "ocean-waves",
    "name": "Ocean Waves",
    "description": "Waves rolling onto a beach.",
    "audioFile": "audio/ocean-waves.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "thunderstorm",
    "name": "Thunderstorm",
    "description": "Distant thunder behind heavy rain.",
    "audioFile": "audio/thunderstorm.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  },
  {
    "id": "night-forest",
    "name": "Night Forest",
    "description": "Rustling leaves after dark.",
    "audioFile": "audio/night-forest.mp3",
    "artwork": null,
    "source": "Placeholder noise generated with FFmpeg (tools/make-dev-sounds.sh)",
    "licence": "CC0-1.0",
    "author": "Ambiancy"
  }
]
```

- [ ] **Step 8: Write `web/src/catalogue/scenes.json`**

```json
[
  {
    "id": "rainy-cafe",
    "name": "Rainy café",
    "description": "Rain outside, a coffee shop inside.",
    "layers": [
      { "soundId": "rain", "volume": 60 },
      { "soundId": "coffee-shop", "volume": 45 }
    ]
  },
  {
    "id": "forest-night",
    "name": "Forest night",
    "description": "A still forest with cicadas and a light wind.",
    "layers": [
      { "soundId": "night-forest", "volume": 70 },
      { "soundId": "cicadas", "volume": 30 },
      { "soundId": "wind", "volume": 20 }
    ]
  },
  {
    "id": "stormy-cabin",
    "name": "Stormy cabin",
    "description": "A fire indoors while a storm passes.",
    "layers": [
      { "soundId": "thunderstorm", "volume": 60 },
      { "soundId": "fireplace", "volume": 55 },
      { "soundId": "rain", "volume": 30 }
    ]
  },
  {
    "id": "seaside-morning",
    "name": "Seaside morning",
    "description": "Waves, birds and a sea breeze.",
    "layers": [
      { "soundId": "ocean-waves", "volume": 70 },
      { "soundId": "birds-chirping", "volume": 35 },
      { "soundId": "wind", "volume": 15 }
    ]
  },
  {
    "id": "creekside",
    "name": "Creekside",
    "description": "A creek with birdsong overhead.",
    "layers": [
      { "soundId": "creek", "volume": 65 },
      { "soundId": "birds-chirping", "volume": 40 }
    ]
  }
]
```

- [ ] **Step 9: Write `web/src/catalogue/index.ts`**

```ts
import type { Mix } from '../mix/mix'
import scenesData from './scenes.json'
import soundsData from './sounds.json'

export interface Sound {
  id: string
  name: string
  description: string
  audioFile: string
  artwork: string | null
  source: string
  licence: string
  author: string
}

export interface Scene {
  id: string
  name: string
  description: string
  layers: Mix
}

export const SOUNDS: readonly Sound[] = soundsData
export const SCENES: readonly Scene[] = scenesData

const soundsById = new Map(SOUNDS.map((sound) => [sound.id, sound]))

export function getSound(id: string): Sound | undefined {
  return soundsById.get(id)
}

export function isSoundId(id: string): boolean {
  return soundsById.has(id)
}

const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL ?? 'http://localhost:8081').replace(/\/$/, '')

export function audioUrl(sound: Sound): string {
  return `${MEDIA_BASE_URL}/${sound.audioFile}`
}
```

- [ ] **Step 10: Run tests and type-check**

Run: `npm test && npm run typecheck`
Expected: PASS, all tests, no type errors.

- [ ] **Step 11: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/mix web/src/catalogue
git commit -m "feat: mix rules and the sound and scene catalogue" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Share links

**Files:**
- Create: `web/src/mix/shareLink.ts`
- Test: `web/src/mix/shareLink.test.ts`

**Interfaces:**
- Consumes: `Layer`, `Mix`, `clampVolume`, `normaliseMix` from `web/src/mix/mix.ts`.
- Produces:
  - `encodeMix(mix: Mix): string` giving `rain=70,fireplace=40`
  - `decodeMix(hash: string, isValidSoundId: (id: string) => boolean): Mix`
  - `shareUrl(mix: Mix, origin: string): string` giving `<origin>/mix#rain=70,fireplace=40`

- [ ] **Step 1: Write the failing test `web/src/mix/shareLink.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { decodeMix, encodeMix, shareUrl } from './shareLink'

const known = (id: string) =>
  ['rain', 'fireplace', 'coffee-shop', 'wind'].includes(id) || /^s\d+$/.test(id)

describe('encodeMix', () => {
  it('writes sound=volume pairs separated by commas', () => {
    expect(
      encodeMix([
        { soundId: 'rain', volume: 70 },
        { soundId: 'fireplace', volume: 40 },
      ]),
    ).toBe('rain=70,fireplace=40')
  })

  it('writes an empty string for an empty mix', () => {
    expect(encodeMix([])).toBe('')
  })
})

describe('shareUrl', () => {
  it('puts the mix after the # of /mix', () => {
    expect(shareUrl([{ soundId: 'rain', volume: 70 }], 'https://ambiancy.example')).toBe(
      'https://ambiancy.example/mix#rain=70',
    )
  })
})

describe('decodeMix', () => {
  it('reads back what encodeMix wrote', () => {
    const mix = [
      { soundId: 'rain', volume: 70 },
      { soundId: 'coffee-shop', volume: 40 },
    ]
    expect(decodeMix(encodeMix(mix), known)).toEqual(mix)
  })

  it('accepts a leading #', () => {
    expect(decodeMix('#rain=70', known)).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('returns an empty mix for an empty or bare # hash', () => {
    expect(decodeMix('', known)).toEqual([])
    expect(decodeMix('#', known)).toEqual([])
  })

  it('drops unknown sounds and keeps the rest', () => {
    expect(decodeMix('#rain=70,nope=10,fireplace=40', known)).toEqual([
      { soundId: 'rain', volume: 70 },
      { soundId: 'fireplace', volume: 40 },
    ])
  })

  it('drops parts whose volume is not a whole non-negative number', () => {
    expect(decodeMix('#rain=loud,wind=-5,fireplace=4.5,coffee-shop=', known)).toEqual([])
  })

  it('clamps volumes above 100, however large', () => {
    expect(decodeMix('#rain=250', known)).toEqual([{ soundId: 'rain', volume: 100 }])
    expect(decodeMix(`#rain=${'9'.repeat(400)}`, known)).toEqual([{ soundId: 'rain', volume: 100 }])
  })

  it('drops parts with no = or more than one =', () => {
    expect(decodeMix('#rain,wind=30=40,fireplace=20', known)).toEqual([{ soundId: 'fireplace', volume: 20 }])
  })

  it('keeps the first of a repeated sound', () => {
    expect(decodeMix('#rain=70,rain=10', known)).toEqual([{ soundId: 'rain', volume: 70 }])
  })

  it('keeps at most 8 layers', () => {
    const hash = Array.from({ length: 12 }, (_, i) => `s${i}=50`).join(',')
    expect(decodeMix(hash, known)).toHaveLength(8)
  })

  it('does not throw on broken percent escapes or junk', () => {
    expect(decodeMix('#%E0%A4%A=50,rain=70', known)).toEqual([{ soundId: 'rain', volume: 70 }])
    expect(decodeMix('#,,,===,<script>=1', known)).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/mix/shareLink.test.ts`
Expected: FAIL, `./shareLink` cannot be resolved.

- [ ] **Step 3: Write `web/src/mix/shareLink.ts`**

```ts
import { clampVolume, normaliseMix, type Layer, type Mix } from './mix'

export function encodeMix(mix: Mix): string {
  return mix.map((layer) => `${encodeURIComponent(layer.soundId)}=${clampVolume(layer.volume)}`).join(',')
}

export function decodeMix(hash: string, isValidSoundId: (id: string) => boolean): Mix {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  if (body === '') return []

  const layers: Layer[] = []
  for (const part of body.split(',')) {
    const pieces = part.split('=')
    if (pieces.length !== 2) continue
    const [rawId, rawVolume] = pieces as [string, string]
    if (!/^\d+$/.test(rawVolume)) continue
    let soundId: string
    try {
      soundId = decodeURIComponent(rawId)
    } catch {
      continue
    }
    layers.push({ soundId, volume: Number(rawVolume) })
  }
  return normaliseMix(layers, isValidSoundId)
}

export function shareUrl(mix: Mix, origin: string): string {
  return `${origin}/mix#${encodeMix(mix)}`
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/mix/shareLink.test.ts && npm run typecheck`
Expected: PASS, 13 tests, no type errors.

- [ ] **Step 5: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/mix
git commit -m "feat: encode and decode a mix in a share link" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Audio engine

**Files:**
- Create: `web/src/audio/engine.ts`
- Create: `web/src/test/fakeAudio.ts`
- Test: `web/src/audio/engine.test.ts`

**Interfaces:**
- Consumes: `MAX_LAYERS`, `Mix`, `clampVolume` from `web/src/mix/mix.ts`.
- Produces:
  - `type LayerStatus = 'loading' | 'playing' | 'error'`
  - `interface LayerState { soundId: string; volume: number; status: LayerStatus }`
  - `interface AudioContextLike`, `GainNodeLike`, `SourceNodeLike` (the small part of the Web Audio API the engine uses)
  - `interface EngineDeps { context: AudioContextLike; loadBuffer: (soundId: string) => Promise<unknown> }`
  - `createAudioEngine(deps: EngineDeps): AudioEngine`
  - `interface AudioEngine` with:
    - `addLayer(soundId: string, volume: number): Promise<void>`
    - `removeLayer(soundId: string): void`
    - `setVolume(soundId: string, volume: number): void`
    - `retryLayer(soundId: string): Promise<void>`
    - `setMasterVolume(volume: number): void`
    - `getMasterVolume(): number`
    - `fadeOut(seconds: number): Promise<void>`
    - `cancelFade(): void`
    - `stopAll(): void`
    - `getMix(): Mix`
    - `loadMix(mix: Mix): Promise<void>`
    - `getLayers(): readonly LayerState[]` (same array reference until something changes)
    - `subscribe(listener: () => void): () => void`
  - Test helpers `createFakeContext()` and `createDeferredLoader()` in `web/src/test/fakeAudio.ts`

- [ ] **Step 1: Write the test helper `web/src/test/fakeAudio.ts`**

```ts
import { vi } from 'vitest'

export function createFakeGain() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

export function createFakeSource() {
  return {
    buffer: null as unknown,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
}

/** gains[0] is always the master gain; later gains are one per started layer. */
export function createFakeContext() {
  const gains: ReturnType<typeof createFakeGain>[] = []
  const sources: ReturnType<typeof createFakeSource>[] = []
  const context = {
    currentTime: 0,
    destination: { name: 'destination' },
    state: 'suspended' as string,
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
    createGain() {
      const gain = createFakeGain()
      gains.push(gain)
      return gain
    },
    createBufferSource() {
      const source = createFakeSource()
      sources.push(source)
      return source
    },
  }
  return { context, gains, sources }
}

/** A loader whose downloads finish only when the test says so. */
export function createDeferredLoader() {
  const pending = new Map<string, { resolve: (buffer: unknown) => void; reject: (error: Error) => void }>()
  const loadBuffer = vi.fn(
    (soundId: string) =>
      new Promise<unknown>((resolve, reject) => {
        pending.set(soundId, { resolve, reject })
      }),
  )
  return {
    loadBuffer,
    resolve(soundId: string) {
      pending.get(soundId)!.resolve({ soundId })
    },
    reject(soundId: string) {
      pending.get(soundId)!.reject(new Error('load failed'))
    },
  }
}

export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
```

- [ ] **Step 2: Write the failing test `web/src/audio/engine.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDeferredLoader, createFakeContext, flush } from '../test/fakeAudio'
import { createAudioEngine } from './engine'

const instantLoader = async (soundId: string) => ({ soundId })

function setup(loadBuffer: (soundId: string) => Promise<unknown> = instantLoader) {
  const fake = createFakeContext()
  const engine = createAudioEngine({ context: fake.context, loadBuffer })
  return { engine, ...fake }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('adding layers', () => {
  it('plays a sound on a loop at the given volume', async () => {
    const { engine, gains, sources } = setup()
    await engine.addLayer('rain', 70)

    expect(sources).toHaveLength(1)
    expect(sources[0]!.loop).toBe(true)
    expect(sources[0]!.buffer).toEqual({ soundId: 'rain' })
    expect(sources[0]!.start).toHaveBeenCalledOnce()
    expect(gains[1]!.gain.value).toBeCloseTo(0.7)
    expect(gains[1]!.connect).toHaveBeenCalledWith(gains[0])
    expect(engine.getLayers()).toEqual([{ soundId: 'rain', volume: 70, status: 'playing' }])
  })

  it('wakes a suspended audio context', async () => {
    const { engine, context } = setup()
    await engine.addLayer('rain', 70)
    expect(context.resume).toHaveBeenCalledOnce()
  })

  it('reports loading until the audio has arrived', async () => {
    const deferred = createDeferredLoader()
    const { engine } = setup(deferred.loadBuffer)
    const added = engine.addLayer('rain', 70)

    expect(engine.getLayers()).toEqual([{ soundId: 'rain', volume: 70, status: 'loading' }])
    await flush()
    deferred.resolve('rain')
    await added
    expect(engine.getLayers()[0]!.status).toBe('playing')
  })

  it('only changes the volume when the sound is already in the mix', async () => {
    const { engine, sources } = setup()
    await engine.addLayer('rain', 70)
    await engine.addLayer('rain', 20)

    expect(sources).toHaveLength(1)
    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 20 }])
  })

  it('ignores a ninth layer', async () => {
    const { engine } = setup()
    for (let i = 0; i < 9; i++) await engine.addLayer(`s${i}`, 50)
    expect(engine.getLayers()).toHaveLength(8)
    expect(engine.getMix().some((layer) => layer.soundId === 's8')).toBe(false)
  })

  it('clamps the volume', async () => {
    const { engine } = setup()
    await engine.addLayer('rain', 400)
    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 100 }])
  })
})

describe('removing layers', () => {
  it('stops and disconnects the sound', async () => {
    const { engine, sources } = setup()
    await engine.addLayer('rain', 70)
    engine.removeLayer('rain')

    expect(sources[0]!.stop).toHaveBeenCalledOnce()
    expect(sources[0]!.disconnect).toHaveBeenCalledOnce()
    expect(engine.getLayers()).toEqual([])
  })

  it('never starts a layer that was removed while it was still downloading', async () => {
    const deferred = createDeferredLoader()
    const { engine, sources } = setup(deferred.loadBuffer)
    const added = engine.addLayer('rain', 70)
    await flush()

    engine.removeLayer('rain')
    deferred.resolve('rain')
    await added

    expect(sources).toHaveLength(0)
    expect(engine.getLayers()).toEqual([])
  })

  it('never starts layers that were downloading when everything was stopped', async () => {
    const deferred = createDeferredLoader()
    const { engine, sources } = setup(deferred.loadBuffer)
    const added = engine.addLayer('rain', 70)
    await flush()

    engine.stopAll()
    deferred.resolve('rain')
    await added

    expect(sources).toHaveLength(0)
  })
})

describe('load failures', () => {
  it('marks only the failed layer as an error and keeps the others playing', async () => {
    const loadBuffer = async (soundId: string) => {
      if (soundId === 'rain') throw new Error('offline')
      return { soundId }
    }
    const { engine, sources } = setup(loadBuffer)
    await engine.addLayer('wind', 50)
    await engine.addLayer('rain', 70)

    expect(engine.getLayers()).toEqual([
      { soundId: 'wind', volume: 50, status: 'playing' },
      { soundId: 'rain', volume: 70, status: 'error' },
    ])
    expect(sources).toHaveLength(1)
    expect(sources[0]!.stop).not.toHaveBeenCalled()
  })

  it('plays the layer when a retry succeeds', async () => {
    let fail = true
    const loadBuffer = async (soundId: string) => {
      if (fail) throw new Error('offline')
      return { soundId }
    }
    const { engine, sources } = setup(loadBuffer)
    await engine.addLayer('rain', 70)
    expect(engine.getLayers()[0]!.status).toBe('error')

    fail = false
    await engine.retryLayer('rain')
    expect(engine.getLayers()[0]!.status).toBe('playing')
    expect(sources).toHaveLength(1)
  })
})

describe('volume', () => {
  it('changes a layer volume while it plays', async () => {
    const { engine, gains } = setup()
    await engine.addLayer('rain', 70)
    engine.setVolume('rain', 25)

    expect(gains[1]!.gain.value).toBeCloseTo(0.25)
    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 25 }])
  })

  it('changes the master volume', () => {
    const { engine, gains } = setup()
    engine.setMasterVolume(40)
    expect(engine.getMasterVolume()).toBe(40)
    expect(gains[0]!.gain.setValueAtTime).toHaveBeenLastCalledWith(0.4, 0)
  })
})

describe('fading out', () => {
  it('ramps the master volume to zero, then stops everything and restores the master volume', async () => {
    vi.useFakeTimers()
    const { engine, gains, sources } = setup()
    engine.setMasterVolume(80)
    await engine.addLayer('rain', 70)

    const faded = engine.fadeOut(30)
    expect(gains[0]!.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 30)
    expect(engine.getLayers()).toHaveLength(1)

    vi.advanceTimersByTime(30_000)
    await faded

    expect(sources[0]!.stop).toHaveBeenCalledOnce()
    expect(engine.getLayers()).toEqual([])
    expect(gains[0]!.gain.setValueAtTime).toHaveBeenLastCalledWith(0.8, 0)
  })

  it('keeps playing and restores the master volume when the fade is cancelled', async () => {
    vi.useFakeTimers()
    const { engine, gains, sources } = setup()
    await engine.addLayer('rain', 70)

    const faded = engine.fadeOut(30)
    vi.advanceTimersByTime(10_000)
    engine.cancelFade()
    await faded
    vi.advanceTimersByTime(60_000)

    expect(sources[0]!.stop).not.toHaveBeenCalled()
    expect(engine.getLayers()).toHaveLength(1)
    expect(gains[0]!.gain.setValueAtTime).toHaveBeenLastCalledWith(1, 0)
  })

  it('cancels a fade when a sound is added', async () => {
    vi.useFakeTimers()
    const { engine } = setup()
    await engine.addLayer('rain', 70)
    void engine.fadeOut(30)
    await engine.addLayer('wind', 50)
    vi.advanceTimersByTime(60_000)

    expect(engine.getLayers()).toHaveLength(2)
  })

  it('resolves straight away when nothing is playing', async () => {
    const { engine } = setup()
    await expect(engine.fadeOut(30)).resolves.toBeUndefined()
  })
})

describe('whole mixes', () => {
  it('replaces the current mix', async () => {
    const { engine, sources } = setup()
    await engine.addLayer('rain', 70)
    await engine.loadMix([
      { soundId: 'wind', volume: 30 },
      { soundId: 'creek', volume: 60 },
    ])

    expect(sources[0]!.stop).toHaveBeenCalledOnce()
    expect(engine.getMix()).toEqual([
      { soundId: 'wind', volume: 30 },
      { soundId: 'creek', volume: 60 },
    ])
  })
})

describe('subscribing', () => {
  it('tells listeners about changes until they unsubscribe', async () => {
    const { engine } = setup()
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)

    await engine.addLayer('rain', 70)
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    listener.mockClear()
    engine.removeLayer('rain')
    expect(listener).not.toHaveBeenCalled()
  })

  it('returns the same layers array until something changes', async () => {
    const { engine } = setup()
    await engine.addLayer('rain', 70)
    const first = engine.getLayers()
    expect(engine.getLayers()).toBe(first)

    engine.setVolume('rain', 10)
    expect(engine.getLayers()).not.toBe(first)
  })
})
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/audio/engine.test.ts`
Expected: FAIL, `./engine` cannot be resolved.

- [ ] **Step 4: Write `web/src/audio/engine.ts`**

```ts
import { MAX_LAYERS, clampVolume, type Mix } from '../mix/mix'

export type LayerStatus = 'loading' | 'playing' | 'error'

export interface LayerState {
  soundId: string
  volume: number
  status: LayerStatus
}

export interface GainParamLike {
  value: number
  setValueAtTime(value: number, time: number): unknown
  linearRampToValueAtTime(value: number, time: number): unknown
  cancelScheduledValues(time: number): unknown
}

export interface GainNodeLike {
  gain: GainParamLike
  connect(destination: unknown): unknown
  disconnect(): void
}

export interface SourceNodeLike {
  buffer: unknown
  loop: boolean
  connect(destination: unknown): unknown
  disconnect(): void
  start(): void
  stop(): void
}

export interface AudioContextLike {
  currentTime: number
  destination: unknown
  state: string
  resume(): Promise<void>
  createGain(): GainNodeLike
  createBufferSource(): SourceNodeLike
}

export interface EngineDeps {
  context: AudioContextLike
  loadBuffer: (soundId: string) => Promise<unknown>
}

export interface AudioEngine {
  addLayer(soundId: string, volume: number): Promise<void>
  removeLayer(soundId: string): void
  setVolume(soundId: string, volume: number): void
  retryLayer(soundId: string): Promise<void>
  setMasterVolume(volume: number): void
  getMasterVolume(): number
  fadeOut(seconds: number): Promise<void>
  cancelFade(): void
  stopAll(): void
  getMix(): Mix
  loadMix(mix: Mix): Promise<void>
  getLayers(): readonly LayerState[]
  subscribe(listener: () => void): () => void
}

interface Entry {
  soundId: string
  volume: number
  status: LayerStatus
  gain: GainNodeLike | null
  source: SourceNodeLike | null
  /** Changes on every start attempt, so a stale download can tell it is stale. */
  token: number
}

export function createAudioEngine({ context, loadBuffer }: EngineDeps): AudioEngine {
  const master = context.createGain()
  master.connect(context.destination)

  const entries = new Map<string, Entry>()
  const listeners = new Set<() => void>()
  let snapshot: readonly LayerState[] = []
  let masterVolume = 100
  let nextToken = 1
  let fadeTimer: ReturnType<typeof setTimeout> | null = null
  let resolveFade: (() => void) | null = null

  function emit() {
    snapshot = [...entries.values()].map(({ soundId, volume, status }) => ({ soundId, volume, status }))
    listeners.forEach((listener) => listener())
  }

  function isCurrent(entry: Entry, token: number) {
    return entries.get(entry.soundId) === entry && entry.token === token
  }

  async function start(entry: Entry): Promise<void> {
    const token = entry.token
    entry.status = 'loading'
    emit()
    try {
      if (context.state !== 'running') await context.resume()
      const buffer = await loadBuffer(entry.soundId)
      if (!isCurrent(entry, token)) return

      const gain = context.createGain()
      gain.gain.value = entry.volume / 100
      gain.connect(master)

      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()

      entry.gain = gain
      entry.source = source
      entry.status = 'playing'
    } catch {
      if (!isCurrent(entry, token)) return
      entry.status = 'error'
    }
    emit()
  }

  function teardown(entry: Entry) {
    if (entry.source) {
      try {
        entry.source.stop()
      } catch {
        // already stopped
      }
      entry.source.disconnect()
    }
    if (entry.gain) entry.gain.disconnect()
    entry.source = null
    entry.gain = null
  }

  function applyMasterVolume() {
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(masterVolume / 100, now)
  }

  /** Ends a running fade timer and settles its promise. Returns whether a fade was running. */
  function endFade(): boolean {
    if (fadeTimer === null) return false
    clearTimeout(fadeTimer)
    fadeTimer = null
    resolveFade?.()
    resolveFade = null
    return true
  }

  function cancelFade() {
    if (endFade()) applyMasterVolume()
  }

  function setVolume(soundId: string, volume: number) {
    const entry = entries.get(soundId)
    if (!entry) return
    entry.volume = clampVolume(volume)
    if (entry.gain) entry.gain.gain.value = entry.volume / 100
    emit()
  }

  function addLayer(soundId: string, volume: number): Promise<void> {
    cancelFade()
    if (entries.has(soundId)) {
      setVolume(soundId, volume)
      return Promise.resolve()
    }
    if (entries.size >= MAX_LAYERS) return Promise.resolve()

    const entry: Entry = {
      soundId,
      volume: clampVolume(volume),
      status: 'loading',
      gain: null,
      source: null,
      token: nextToken++,
    }
    entries.set(soundId, entry)
    return start(entry)
  }

  function removeLayer(soundId: string) {
    const entry = entries.get(soundId)
    if (!entry) return
    teardown(entry)
    entries.delete(soundId)
    emit()
  }

  function retryLayer(soundId: string): Promise<void> {
    const entry = entries.get(soundId)
    if (!entry || entry.status !== 'error') return Promise.resolve()
    entry.token = nextToken++
    return start(entry)
  }

  function setMasterVolume(volume: number) {
    endFade()
    masterVolume = clampVolume(volume)
    applyMasterVolume()
    emit()
  }

  function stopAll() {
    endFade()
    entries.forEach(teardown)
    entries.clear()
    applyMasterVolume()
    emit()
  }

  function fadeOut(seconds: number): Promise<void> {
    cancelFade()
    if (entries.size === 0) return Promise.resolve()

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(masterVolume / 100, now)
    master.gain.linearRampToValueAtTime(0, now + seconds)

    return new Promise<void>((resolve) => {
      resolveFade = resolve
      fadeTimer = setTimeout(stopAll, seconds * 1000)
    })
  }

  async function loadMix(mix: Mix): Promise<void> {
    stopAll()
    await Promise.all(mix.map((layer) => addLayer(layer.soundId, layer.volume)))
  }

  return {
    addLayer,
    removeLayer,
    setVolume,
    retryLayer,
    setMasterVolume,
    getMasterVolume: () => masterVolume,
    fadeOut,
    cancelFade,
    stopAll,
    getMix: () => [...entries.values()].map(({ soundId, volume }) => ({ soundId, volume })),
    loadMix,
    getLayers: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `npx vitest run src/audio/engine.test.ts && npm run typecheck`
Expected: PASS, 20 tests, no type errors.

- [ ] **Step 6: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/audio web/src/test/fakeAudio.ts
git commit -m "feat: audio engine with layers, volumes and fade-out" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Buffer loader and browser wiring

**Files:**
- Create: `web/src/audio/bufferLoader.ts`
- Create: `web/src/audio/createBrowserEngine.ts`
- Test: `web/src/audio/bufferLoader.test.ts`

**Interfaces:**
- Consumes: `createAudioEngine`, `AudioEngine` from `web/src/audio/engine.ts`; `getSound`, `audioUrl` from `web/src/catalogue/index.ts`.
- Produces:
  - `createBufferLoader(context: Pick<BaseAudioContext, 'decodeAudioData'>, urlFor: (soundId: string) => string, fetchFn?: typeof fetch): (soundId: string) => Promise<AudioBuffer>`
  - `createBrowserEngine(): AudioEngine`

- [ ] **Step 1: Write the failing test `web/src/audio/bufferLoader.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createBufferLoader } from './bufferLoader'

function setup(responses: Array<{ ok: boolean; status: number }>) {
  const decoded = { decoded: true } as unknown as AudioBuffer
  const context = {
    decodeAudioData: vi.fn(async () => decoded),
  } as unknown as Pick<BaseAudioContext, 'decodeAudioData'>
  const fetchFn = vi.fn(async () => {
    const next = responses.shift()!
    return { ok: next.ok, status: next.status, arrayBuffer: async () => new ArrayBuffer(8) }
  }) as unknown as typeof fetch
  const loadBuffer = createBufferLoader(context, (id) => `http://media.test/audio/${id}.mp3`, fetchFn)
  return { loadBuffer, fetchFn, decoded }
}

describe('createBufferLoader', () => {
  it('fetches the sound from its address and decodes it', async () => {
    const { loadBuffer, fetchFn, decoded } = setup([{ ok: true, status: 200 }])
    await expect(loadBuffer('rain')).resolves.toBe(decoded)
    expect(fetchFn).toHaveBeenCalledWith('http://media.test/audio/rain.mp3')
  })

  it('downloads each sound only once', async () => {
    const { loadBuffer, fetchFn } = setup([{ ok: true, status: 200 }])
    await loadBuffer('rain')
    await loadBuffer('rain')
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('rejects when the server answers with an error', async () => {
    const { loadBuffer } = setup([{ ok: false, status: 404 }])
    await expect(loadBuffer('rain')).rejects.toThrow('HTTP 404')
  })

  it('tries again after a failure instead of remembering it', async () => {
    const { loadBuffer, fetchFn, decoded } = setup([
      { ok: false, status: 503 },
      { ok: true, status: 200 },
    ])
    await expect(loadBuffer('rain')).rejects.toThrow()
    await expect(loadBuffer('rain')).resolves.toBe(decoded)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('rejects when the address cannot be built', async () => {
    const context = { decodeAudioData: vi.fn() } as unknown as Pick<BaseAudioContext, 'decodeAudioData'>
    const loadBuffer = createBufferLoader(context, () => {
      throw new Error('Unknown sound "nope"')
    })
    await expect(loadBuffer('nope')).rejects.toThrow('Unknown sound')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/audio/bufferLoader.test.ts`
Expected: FAIL, `./bufferLoader` cannot be resolved.

- [ ] **Step 3: Write `web/src/audio/bufferLoader.ts`**

```ts
export function createBufferLoader(
  context: Pick<BaseAudioContext, 'decodeAudioData'>,
  urlFor: (soundId: string) => string,
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): (soundId: string) => Promise<AudioBuffer> {
  const cache = new Map<string, Promise<AudioBuffer>>()

  return function loadBuffer(soundId) {
    const cached = cache.get(soundId)
    if (cached) return cached

    const download = (async () => {
      const response = await fetchFn(urlFor(soundId))
      if (!response.ok) throw new Error(`Could not load sound "${soundId}" (HTTP ${response.status})`)
      return context.decodeAudioData(await response.arrayBuffer())
    })()

    cache.set(soundId, download)
    download.catch(() => {
      cache.delete(soundId)
    })
    return download
  }
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/audio/bufferLoader.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write `web/src/audio/createBrowserEngine.ts`**

This file touches the real browser audio API, so it has no unit test; it is exercised by hand in Task 10.

```ts
import { audioUrl, getSound } from '../catalogue'
import { createBufferLoader } from './bufferLoader'
import { createAudioEngine, type AudioEngine } from './engine'

export function createBrowserEngine(): AudioEngine {
  const context = new AudioContext()
  const loadBuffer = createBufferLoader(context, (soundId) => {
    const sound = getSound(soundId)
    if (!sound) throw new Error(`Unknown sound "${soundId}"`)
    return audioUrl(sound)
  })
  return createAudioEngine({ context, loadBuffer })
}
```

- [ ] **Step 6: Type-check and run all tests**

Run: `npm run typecheck && npm test`
Expected: no type errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/audio
git commit -m "feat: audio download cache and browser engine wiring" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Timer

**Files:**
- Create: `web/src/timer/timer.ts`, `web/src/timer/useTimer.ts`
- Test: `web/src/timer/timer.test.ts`, `web/src/timer/useTimer.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type TimerMode = 'sleep' | 'focus'`
  - `interface ActiveTimer { mode: TimerMode; endsAt: number }`
  - `SLEEP_FADE_SECONDS: 30`
  - `startTimer(mode: TimerMode, minutes: number, now: number): ActiveTimer`
  - `remainingMs(timer: ActiveTimer, now: number): number`
  - `formatRemaining(ms: number): string` giving `mm:ss`
  - `useTimer(onDone: (mode: TimerMode) => void): { timer: ActiveTimer | null; remaining: number; start(mode: TimerMode, minutes: number): void; cancel(): void }`

- [ ] **Step 1: Write the failing test `web/src/timer/timer.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { formatRemaining, remainingMs, startTimer } from './timer'

describe('timer maths', () => {
  it('ends the given number of minutes after it starts', () => {
    expect(startTimer('sleep', 30, 1_000)).toEqual({ mode: 'sleep', endsAt: 1_000 + 30 * 60_000 })
  })

  it('reports the time left, never below zero', () => {
    const timer = startTimer('focus', 1, 0)
    expect(remainingMs(timer, 15_000)).toBe(45_000)
    expect(remainingMs(timer, 999_999)).toBe(0)
  })

  it('formats as minutes and seconds, rounding part-seconds up', () => {
    expect(formatRemaining(30 * 60_000)).toBe('30:00')
    expect(formatRemaining(61_000)).toBe('01:01')
    expect(formatRemaining(500)).toBe('00:01')
    expect(formatRemaining(0)).toBe('00:00')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/timer/timer.test.ts`
Expected: FAIL, `./timer` cannot be resolved.

- [ ] **Step 3: Write `web/src/timer/timer.ts`**

```ts
export type TimerMode = 'sleep' | 'focus'

export interface ActiveTimer {
  mode: TimerMode
  /** Clock time, in milliseconds, at which the timer finishes. */
  endsAt: number
}

export const SLEEP_FADE_SECONDS = 30

export function startTimer(mode: TimerMode, minutes: number, now: number): ActiveTimer {
  return { mode, endsAt: now + minutes * 60_000 }
}

export function remainingMs(timer: ActiveTimer, now: number): number {
  return Math.max(0, timer.endsAt - now)
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/timer/timer.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the failing test `web/src/timer/useTimer.test.ts`**

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimer } from './useTimer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it('counts down and reports the mode when it finishes', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))

    act(() => result.current.start('sleep', 1))
    expect(result.current.timer?.mode).toBe('sleep')
    expect(result.current.remaining).toBe(60_000)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.remaining).toBe(30_000)
    expect(onDone).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(onDone).toHaveBeenCalledExactlyOnceWith('sleep')
    expect(result.current.timer).toBeNull()
  })

  it('finishes by the clock when the browser held its ticks back', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('focus', 25))

    // The laptop slept: an hour passed on the clock but no ticks ran.
    vi.setSystemTime(Date.now() + 60 * 60_000)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(onDone).toHaveBeenCalledExactlyOnceWith('focus')
    expect(result.current.timer).toBeNull()
  })

  it('checks the clock as soon as the tab becomes visible again', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('sleep', 5))

    vi.setSystemTime(Date.now() + 10 * 60_000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(onDone).toHaveBeenCalledExactlyOnceWith('sleep')
  })

  it('does not fire after being cancelled', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useTimer(onDone))
    act(() => result.current.start('sleep', 1))
    act(() => result.current.cancel())
    act(() => {
      vi.advanceTimersByTime(120_000)
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(result.current.timer).toBeNull()
  })
})
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npx vitest run src/timer/useTimer.test.ts`
Expected: FAIL, `./useTimer` cannot be resolved.

- [ ] **Step 7: Write `web/src/timer/useTimer.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { remainingMs, startTimer, type ActiveTimer, type TimerMode } from './timer'

export function useTimer(onDone: (mode: TimerMode) => void) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!timer) return
    let finished = false

    // Compares against the clock on every tick, so a throttled background tab
    // or a sleeping laptop still finishes at the right time, and only once.
    const check = () => {
      if (finished) return
      const current = Date.now()
      setNow(current)
      if (current >= timer.endsAt) {
        finished = true
        setTimer(null)
        onDoneRef.current(timer.mode)
      }
    }

    const interval = setInterval(check, 1000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [timer])

  const start = useCallback((mode: TimerMode, minutes: number) => {
    const current = Date.now()
    setNow(current)
    setTimer(startTimer(mode, minutes, current))
  }, [])

  const cancel = useCallback(() => {
    setTimer(null)
  }, [])

  return { timer, remaining: timer ? remainingMs(timer, now) : 0, start, cancel }
}
```

- [ ] **Step 8: Run it and confirm it passes**

Run: `npx vitest run src/timer && npm run typecheck`
Expected: PASS, 7 tests, no type errors.

- [ ] **Step 9: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/timer
git commit -m "feat: sleep and focus timer that finishes by the clock" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Mixer components

**Files:**
- Create: `web/src/player/PlayerContext.tsx`
- Create: `web/src/player/SoundGrid.tsx`, `web/src/player/LayerList.tsx`, `web/src/player/SceneList.tsx`, `web/src/player/MasterControls.tsx`
- Create: `web/src/test/renderWithEngine.tsx`
- Test: `web/src/player/Mixer.test.tsx`

**Interfaces:**
- Consumes: `AudioEngine`, `createAudioEngine`, `LayerState` from `web/src/audio/engine.ts`; `SOUNDS`, `SCENES`, `getSound` from `web/src/catalogue/index.ts`; `MAX_LAYERS` from `web/src/mix/mix.ts`; `createFakeContext` from `web/src/test/fakeAudio.ts`.
- Produces:
  - `PlayerProvider({ engine, children })`, `useEngine(): AudioEngine`, `useLayers(): readonly LayerState[]`, `useMasterVolume(): number`
  - Components `SoundGrid`, `LayerList`, `SceneList`, `MasterControls` (no props)
  - `DEFAULT_VOLUME: 60` exported from `SoundGrid.tsx`
  - `renderWithEngine(ui, options?: { loadBuffer?; route?: string })` returning the render result plus `engine`, `context`, `gains`, `sources`
- Accessible names later tasks rely on: each sound button is named exactly the sound's name (`Rain`); each scene button exactly the scene's name (`Rainy café`); sliders are `<name> volume`; remove buttons are `Remove <name>`; retry buttons are `Retry <name>`; the master slider is `Master volume`; the stop button is `Stop all`.

- [ ] **Step 1: Write `web/src/player/PlayerContext.tsx`**

```tsx
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { AudioEngine, LayerState } from '../audio/engine'

const EngineContext = createContext<AudioEngine | null>(null)

export function PlayerProvider({ engine, children }: { engine: AudioEngine; children: ReactNode }) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

export function useEngine(): AudioEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine must be used inside <PlayerProvider>')
  return engine
}

export function useLayers(): readonly LayerState[] {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getLayers)
}

export function useMasterVolume(): number {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getMasterVolume)
}
```

- [ ] **Step 2: Write the test helper `web/src/test/renderWithEngine.tsx`**

```tsx
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { createAudioEngine } from '../audio/engine'
import { PlayerProvider } from '../player/PlayerContext'
import { createFakeContext } from './fakeAudio'

interface Options {
  loadBuffer?: (soundId: string) => Promise<unknown>
  route?: string
}

export function renderWithEngine(ui: ReactElement, options: Options = {}) {
  const fake = createFakeContext()
  const loadBuffer = options.loadBuffer ?? (async (soundId: string) => ({ soundId }))
  const engine = createAudioEngine({ context: fake.context, loadBuffer })
  const view = render(
    <PlayerProvider engine={engine}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
    </PlayerProvider>,
  )
  return { engine, ...fake, ...view }
}
```

- [ ] **Step 3: Write the failing test `web/src/player/Mixer.test.tsx`**

```tsx
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SCENES, SOUNDS } from '../catalogue'
import { renderWithEngine } from '../test/renderWithEngine'
import { LayerList } from './LayerList'
import { MasterControls } from './MasterControls'
import { SceneList } from './SceneList'
import { SoundGrid } from './SoundGrid'

function Mixer() {
  return (
    <>
      <SceneList />
      <SoundGrid />
      <LayerList />
      <MasterControls />
    </>
  )
}

describe('mixer', () => {
  it('invites the visitor to start when the mix is empty', () => {
    renderWithEngine(<Mixer />)
    expect(screen.getByText('Pick a sound or a scene to start your mix.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop all' })).toBeDisabled()
  })

  it('adds a sound to the mix when its button is clicked', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)

    await user.click(screen.getByRole('button', { name: 'Rain' }))

    expect(await screen.findByLabelText('Rain volume')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rain' })).toHaveAttribute('aria-pressed', 'true')
    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 60 }])
  })

  it('removes a sound when its button is clicked again', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)

    await user.click(screen.getByRole('button', { name: 'Rain' }))
    await screen.findByLabelText('Rain volume')
    await user.click(screen.getByRole('button', { name: 'Rain' }))

    expect(engine.getMix()).toEqual([])
    expect(screen.queryByLabelText('Rain volume')).not.toBeInTheDocument()
  })

  it('changes a layer volume with its slider', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)
    await user.click(screen.getByRole('button', { name: 'Rain' }))

    fireEvent.change(await screen.findByLabelText('Rain volume'), { target: { value: '25' } })

    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 25 }])
  })

  it('removes a layer with its remove button', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)
    await user.click(screen.getByRole('button', { name: 'Rain' }))
    await user.click(await screen.findByRole('button', { name: 'Remove Rain' }))

    expect(engine.getMix()).toEqual([])
  })

  it('loads a scene as the whole mix', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)
    const scene = SCENES.find((candidate) => candidate.id === 'rainy-cafe')!

    await user.click(screen.getByRole('button', { name: 'Wind' }))
    await user.click(screen.getByRole('button', { name: scene.name }))

    expect(await screen.findByLabelText('Coffee Shop volume')).toBeInTheDocument()
    expect(engine.getMix()).toEqual(scene.layers)
  })

  it('blocks further sounds once the mix is full', async () => {
    const { engine } = renderWithEngine(<Mixer />)
    const firstEight = SOUNDS.slice(0, 8).map((sound) => ({ soundId: sound.id, volume: 50 }))
    await act(async () => {
      await engine.loadMix(firstEight)
    })

    expect(screen.getByRole('button', { name: SOUNDS[8]!.name })).toBeDisabled()
    expect(screen.getByRole('button', { name: SOUNDS[0]!.name })).toBeEnabled()
    expect(screen.getByText('A mix can have up to 8 sounds.')).toBeInTheDocument()
  })

  it('shows a failed sound with a retry, and keeps the others playing', async () => {
    const user = userEvent.setup()
    let fail = true
    const loadBuffer = async (soundId: string) => {
      if (soundId === 'rain' && fail) throw new Error('offline')
      return { soundId }
    }
    const { engine } = renderWithEngine(<Mixer />, { loadBuffer })

    await user.click(screen.getByRole('button', { name: 'Wind' }))
    await user.click(screen.getByRole('button', { name: 'Rain' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load")
    expect(engine.getLayers().find((layer) => layer.soundId === 'wind')?.status).toBe('playing')

    fail = false
    await user.click(screen.getByRole('button', { name: 'Retry Rain' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(engine.getLayers().find((layer) => layer.soundId === 'rain')?.status).toBe('playing')
  })

  it('changes the master volume and stops everything', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<Mixer />)
    await user.click(screen.getByRole('button', { name: 'Rain' }))
    await screen.findByLabelText('Rain volume')

    fireEvent.change(screen.getByLabelText('Master volume'), { target: { value: '40' } })
    expect(engine.getMasterVolume()).toBe(40)

    await user.click(screen.getByRole('button', { name: 'Stop all' }))
    expect(engine.getMix()).toEqual([])
  })
})
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/player/Mixer.test.tsx`
Expected: FAIL, `./LayerList` cannot be resolved.

- [ ] **Step 5: Write `web/src/player/SoundGrid.tsx`**

```tsx
import { SOUNDS } from '../catalogue'
import { MAX_LAYERS } from '../mix/mix'
import { useEngine, useLayers } from './PlayerContext'

export const DEFAULT_VOLUME = 60

export function SoundGrid() {
  const engine = useEngine()
  const layers = useLayers()
  const active = new Set(layers.map((layer) => layer.soundId))
  const full = layers.length >= MAX_LAYERS

  return (
    <section aria-labelledby="sounds-heading">
      <h2 id="sounds-heading">Sounds</h2>
      <ul className="tile-grid">
        {SOUNDS.map((sound) => {
          const isActive = active.has(sound.id)
          return (
            <li key={sound.id} className="tile">
              <button
                type="button"
                className="tile-button"
                aria-pressed={isActive}
                aria-describedby={`sound-${sound.id}-description`}
                disabled={full && !isActive}
                onClick={() => {
                  if (isActive) engine.removeLayer(sound.id)
                  else void engine.addLayer(sound.id, DEFAULT_VOLUME)
                }}
              >
                {sound.name}
              </button>
              <p id={`sound-${sound.id}-description`} className="tile-description">
                {sound.description}
              </p>
            </li>
          )
        })}
      </ul>
      {full && <p role="status">A mix can have up to {MAX_LAYERS} sounds.</p>}
    </section>
  )
}
```

- [ ] **Step 6: Write `web/src/player/LayerList.tsx`**

```tsx
import { getSound } from '../catalogue'
import { useEngine, useLayers } from './PlayerContext'

export function LayerList() {
  const engine = useEngine()
  const layers = useLayers()

  if (layers.length === 0) {
    return <p className="empty">Pick a sound or a scene to start your mix.</p>
  }

  return (
    <ul className="layer-list" aria-label="Current mix">
      {layers.map((layer) => {
        const name = getSound(layer.soundId)?.name ?? layer.soundId
        return (
          <li key={layer.soundId} className="layer">
            <span className="layer-name">{name}</span>
            {layer.status === 'loading' && <span role="status">Loading…</span>}
            {layer.status === 'error' && (
              <span role="alert">
                Couldn't load.{' '}
                <button type="button" onClick={() => void engine.retryLayer(layer.soundId)}>
                  Retry {name}
                </button>
              </span>
            )}
            <input
              type="range"
              min={0}
              max={100}
              value={layer.volume}
              aria-label={`${name} volume`}
              onChange={(event) => engine.setVolume(layer.soundId, Number(event.target.value))}
            />
            <button type="button" onClick={() => engine.removeLayer(layer.soundId)}>
              Remove {name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 7: Write `web/src/player/SceneList.tsx`**

```tsx
import { SCENES } from '../catalogue'
import { useEngine } from './PlayerContext'

export function SceneList() {
  const engine = useEngine()

  return (
    <section aria-labelledby="scenes-heading">
      <h2 id="scenes-heading">Scenes</h2>
      <ul className="tile-grid">
        {SCENES.map((scene) => (
          <li key={scene.id} className="tile">
            <button
              type="button"
              className="tile-button"
              aria-describedby={`scene-${scene.id}-description`}
              onClick={() => void engine.loadMix(scene.layers)}
            >
              {scene.name}
            </button>
            <p id={`scene-${scene.id}-description`} className="tile-description">
              {scene.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 8: Write `web/src/player/MasterControls.tsx`**

```tsx
import { useEngine, useLayers, useMasterVolume } from './PlayerContext'

export function MasterControls() {
  const engine = useEngine()
  const layers = useLayers()
  const masterVolume = useMasterVolume()

  return (
    <div className="master">
      <label>
        Master volume
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(event) => engine.setMasterVolume(Number(event.target.value))}
        />
      </label>
      <button type="button" disabled={layers.length === 0} onClick={() => engine.stopAll()}>
        Stop all
      </button>
    </div>
  )
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npx vitest run src/player/Mixer.test.tsx && npm run typecheck`
Expected: PASS, 9 tests, no type errors.

- [ ] **Step 10: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/player web/src/test/renderWithEngine.tsx
git commit -m "feat: mixer components for sounds, scenes, layers and master volume" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Timer control, share button and the player page

**Files:**
- Create: `web/src/player/TimerControl.tsx`, `web/src/player/ShareButton.tsx`, `web/src/player/PlayerPage.tsx`
- Test: `web/src/player/TimerControl.test.tsx`, `web/src/player/ShareButton.test.tsx`, `web/src/player/PlayerPage.test.tsx`

**Interfaces:**
- Consumes: `useEngine`, `useLayers` from `web/src/player/PlayerContext.tsx`; `useTimer` from `web/src/timer/useTimer.ts`; `formatRemaining`, `SLEEP_FADE_SECONDS`, `TimerMode` from `web/src/timer/timer.ts`; `shareUrl` from `web/src/mix/shareLink.ts`; `SceneList`, `SoundGrid`, `LayerList`, `MasterControls`; `renderWithEngine`.
- Produces: components `TimerControl`, `ShareButton`, `PlayerPage` (no props). `PlayerPage` renders an `<h1>` reading `Player`.

- [ ] **Step 1: Write the failing test `web/src/player/TimerControl.test.tsx`**

```tsx
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithEngine } from '../test/renderWithEngine'
import { TimerControl } from './TimerControl'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function startTimer(type: 'sleep' | 'focus', minutes: string) {
  fireEvent.change(screen.getByLabelText('Timer type'), { target: { value: type } })
  fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: minutes } })
  fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
}

describe('TimerControl', () => {
  it('shows the countdown once started', () => {
    renderWithEngine(<TimerControl />)
    startTimer('sleep', '15')
    expect(screen.getByRole('timer')).toHaveTextContent('15:00')

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('13:59')
  })

  it('fades the sound out when a sleep timer finishes', () => {
    const { engine } = renderWithEngine(<TimerControl />)
    const fadeOut = vi.spyOn(engine, 'fadeOut')
    startTimer('sleep', '15')

    act(() => {
      vi.advanceTimersByTime(15 * 60_000)
    })

    expect(fadeOut).toHaveBeenCalledExactlyOnceWith(30)
    expect(screen.getByRole('status')).toHaveTextContent('Sleep timer finished')
    expect(screen.getByRole('button', { name: 'Start timer' })).toBeInTheDocument()
  })

  it('leaves the sound playing when a focus timer finishes', () => {
    const { engine } = renderWithEngine(<TimerControl />)
    const fadeOut = vi.spyOn(engine, 'fadeOut')
    startTimer('focus', '30')

    act(() => {
      vi.advanceTimersByTime(30 * 60_000)
    })

    expect(fadeOut).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Focus session complete')
  })

  it('can be cancelled', () => {
    const { engine } = renderWithEngine(<TimerControl />)
    const fadeOut = vi.spyOn(engine, 'fadeOut')
    startTimer('sleep', '15')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel timer' }))

    act(() => {
      vi.advanceTimersByTime(60 * 60_000)
    })

    expect(fadeOut).not.toHaveBeenCalled()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/player/TimerControl.test.tsx`
Expected: FAIL, `./TimerControl` cannot be resolved.

- [ ] **Step 3: Write `web/src/player/TimerControl.tsx`**

```tsx
import { useState } from 'react'
import { SLEEP_FADE_SECONDS, formatRemaining, type TimerMode } from '../timer/timer'
import { useTimer } from '../timer/useTimer'
import { useEngine } from './PlayerContext'

const MINUTE_OPTIONS = [15, 30, 45, 60]

export function TimerControl() {
  const engine = useEngine()
  const [mode, setMode] = useState<TimerMode>('sleep')
  const [minutes, setMinutes] = useState(30)
  const [message, setMessage] = useState<string | null>(null)

  const { timer, remaining, start, cancel } = useTimer((finished) => {
    if (finished === 'sleep') {
      void engine.fadeOut(SLEEP_FADE_SECONDS)
      setMessage('Sleep timer finished. Fading out.')
    } else {
      setMessage('Focus session complete.')
    }
  })

  return (
    <section aria-labelledby="timer-heading">
      <h2 id="timer-heading">Timer</h2>
      {timer ? (
        <p>
          {timer.mode === 'sleep' ? 'Sleep timer' : 'Focus timer'}: <span role="timer">{formatRemaining(remaining)}</span>{' '}
          <button type="button" onClick={cancel}>
            Cancel timer
          </button>
        </p>
      ) : (
        <form
          className="timer-form"
          onSubmit={(event) => {
            event.preventDefault()
            setMessage(null)
            start(mode, minutes)
          }}
        >
          <label>
            Timer type
            <select value={mode} onChange={(event) => setMode(event.target.value as TimerMode)}>
              <option value="sleep">Sleep (fades out)</option>
              <option value="focus">Focus</option>
            </select>
          </label>
          <label>
            Minutes
            <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              {MINUTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Start timer</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/player/TimerControl.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing test `web/src/player/ShareButton.test.tsx`**

```tsx
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithEngine } from '../test/renderWithEngine'
import { ShareButton } from './ShareButton'

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
})

describe('ShareButton', () => {
  it('is disabled while the mix is empty', () => {
    renderWithEngine(<ShareButton />)
    expect(screen.getByRole('button', { name: 'Share this mix' })).toBeDisabled()
  })

  it('copies a link that holds the current mix', async () => {
    const writeText = vi.fn(async () => {})
    stubClipboard(writeText)
    const { engine } = renderWithEngine(<ShareButton />)
    await act(async () => {
      await engine.loadMix([
        { soundId: 'rain', volume: 70 },
        { soundId: 'fireplace', volume: 40 },
      ])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Share this mix' }))

    const expected = `${window.location.origin}/mix#rain=70,fireplace=40`
    expect(await screen.findByText(/Link copied/)).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(expected)
    expect(screen.getByLabelText('Share link')).toHaveValue(expected)
  })

  it('shows the link to copy by hand when the clipboard is unavailable', async () => {
    stubClipboard(async () => {
      throw new Error('denied')
    })
    const { engine } = renderWithEngine(<ShareButton />)
    await act(async () => {
      await engine.loadMix([{ soundId: 'rain', volume: 70 }])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Share this mix' }))

    expect(await screen.findByText(/Copy this link/)).toBeInTheDocument()
    expect(screen.getByLabelText('Share link')).toHaveValue(`${window.location.origin}/mix#rain=70`)
  })
})
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npx vitest run src/player/ShareButton.test.tsx`
Expected: FAIL, `./ShareButton` cannot be resolved.

- [ ] **Step 7: Write `web/src/player/ShareButton.tsx`**

```tsx
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
```

- [ ] **Step 8: Run it and confirm it passes**

Run: `npx vitest run src/player/ShareButton.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 9: Write the failing test `web/src/player/PlayerPage.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithEngine } from '../test/renderWithEngine'
import { PlayerPage } from './PlayerPage'

describe('PlayerPage', () => {
  it('brings the scenes, sounds, mix and timer together', () => {
    renderWithEngine(<PlayerPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Player' })).toBeInTheDocument()
    for (const name of ['Scenes', 'Sounds', 'Your mix', 'Timer']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Share this mix' })).toBeInTheDocument()
    expect(screen.getByLabelText('Master volume')).toBeInTheDocument()
  })
})
```

- [ ] **Step 10: Run it and confirm it fails**

Run: `npx vitest run src/player/PlayerPage.test.tsx`
Expected: FAIL, `./PlayerPage` cannot be resolved.

- [ ] **Step 11: Write `web/src/player/PlayerPage.tsx`**

```tsx
import { LayerList } from './LayerList'
import { MasterControls } from './MasterControls'
import { SceneList } from './SceneList'
import { ShareButton } from './ShareButton'
import { SoundGrid } from './SoundGrid'
import { TimerControl } from './TimerControl'

export function PlayerPage() {
  return (
    <main className="page player">
      <h1>Player</h1>
      <SceneList />
      <SoundGrid />
      <section aria-labelledby="mix-heading">
        <h2 id="mix-heading">Your mix</h2>
        <LayerList />
        <MasterControls />
        <ShareButton />
      </section>
      <TimerControl />
    </main>
  )
}
```

- [ ] **Step 12: Run all tests and type-check**

Run: `npm test && npm run typecheck`
Expected: all tests pass, no type errors.

- [ ] **Step 13: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src/player
git commit -m "feat: timer control, share button and the player page" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Pages, routing and styles

**Files:**
- Create: `web/src/pages/Layout.tsx`, `web/src/pages/LandingPage.tsx`, `web/src/pages/SharedMixPage.tsx`, `web/src/pages/LicencesPage.tsx`, `web/src/pages/NotFoundPage.tsx`
- Create: `web/src/styles.css`
- Modify: `web/src/App.tsx` (replace whole file), `web/src/main.tsx` (replace whole file), `web/src/App.test.tsx` (replace whole file)

**Interfaces:**
- Consumes: `PlayerPage`; `PlayerProvider`, `useEngine`, `useLayers`; `SCENES`, `SOUNDS`, `getSound`, `isSoundId`; `decodeMix`; `createBrowserEngine`; `renderWithEngine`.
- Produces: `AppRoutes()` exported from `web/src/App.tsx`, with routes `/`, `/play`, `/mix`, `/licences` and a not-found page. The old `App` export is removed.

- [ ] **Step 1: Replace `web/src/App.test.tsx` with the failing tests**

```tsx
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { SCENES, SOUNDS } from './catalogue'
import { renderWithEngine } from './test/renderWithEngine'

describe('landing page', () => {
  it('introduces the product and links to the player', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Embrace the silence')
    expect(screen.getByRole('link', { name: 'Open the player' })).toHaveAttribute('href', '/play')
  })

  it('plays a scene in place and can stop it', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/' })
    const featured = SCENES[0]!

    await user.click(screen.getByRole('button', { name: `Play ${featured.name}` }))
    expect(await screen.findByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(engine.getMix()).toEqual(featured.layers)

    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(engine.getMix()).toEqual([])
  })
})

describe('shared mix page', () => {
  it('shows the mix from the link without playing it until the visitor clicks', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/mix#rain=70,nope=10,fireplace=40' })

    const list = screen.getByRole('list', { name: 'Sounds in this mix' })
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Rain 70%',
      'Fireplace 40%',
    ])
    expect(engine.getMix()).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Play this mix' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Player' })).toBeInTheDocument()
    expect(engine.getMix()).toEqual([
      { soundId: 'rain', volume: 70 },
      { soundId: 'fireplace', volume: 40 },
    ])
  })

  it('explains when the link holds no playable mix', () => {
    renderWithEngine(<AppRoutes />, { route: '/mix#nope=10,===' })

    expect(screen.getByText(/doesn't contain a mix/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play this mix' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the player' })).toHaveAttribute('href', '/play')
  })
})

describe('other pages', () => {
  it('shows the player at /play', () => {
    renderWithEngine(<AppRoutes />, { route: '/play' })
    expect(screen.getByRole('heading', { level: 1, name: 'Player' })).toBeInTheDocument()
  })

  it('lists every sound with its licence at /licences', () => {
    renderWithEngine(<AppRoutes />, { route: '/licences' })

    expect(screen.getByRole('heading', { level: 1, name: 'Licences' })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(SOUNDS.length + 1)
    expect(screen.getByRole('row', { name: /Rain/ })).toHaveTextContent('CC0-1.0')
  })

  it('shows a not-found page for unknown addresses', () => {
    renderWithEngine(<AppRoutes />, { route: '/nowhere' })
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })

  it('keeps the brand and navigation on every page', () => {
    renderWithEngine(<AppRoutes />, { route: '/licences' })

    expect(screen.getByRole('link', { name: 'Ambiancy.' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Player' })).toHaveAttribute('href', '/play')
    expect(screen.getByRole('link', { name: 'Licences' })).toHaveAttribute('href', '/licences')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd /mnt/heavy-data/ambiancy-v2/web && npx vitest run src/App.test.tsx`
Expected: FAIL, `AppRoutes` is not exported from `./App`.

- [ ] **Step 3: Write `web/src/pages/Layout.tsx`**

```tsx
import { Link, Outlet } from 'react-router'

export function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          Ambian<span className="brand-accent">cy.</span>
        </Link>
        <nav aria-label="Main">
          <Link to="/play">Player</Link>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <Link to="/licences">Licences</Link>
      </footer>
    </>
  )
}
```

- [ ] **Step 4: Write `web/src/pages/LandingPage.tsx`**

```tsx
import { Link } from 'react-router'
import { SCENES } from '../catalogue'
import { useEngine, useLayers } from '../player/PlayerContext'

export function LandingPage() {
  const engine = useEngine()
  const layers = useLayers()
  const featured = SCENES[0]!
  const playing = layers.length > 0

  return (
    <main className="page landing">
      <h1>Embrace the silence, feel the ambiance.</h1>
      <p className="lead">
        Ambiancy is a free ambient sound mixer. Layer rain, a fireplace or a coffee shop, set each one's volume, and
        share the mix with a link.
      </p>
      <div className="landing-actions">
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
        <Link to="/play" className="button-link">
          Open the player
        </Link>
      </div>
      <p className="hint">{featured.description} No account needed.</p>
    </main>
  )
}
```

- [ ] **Step 5: Write `web/src/pages/SharedMixPage.tsx`**

```tsx
import { Link, useLocation, useNavigate } from 'react-router'
import { getSound, isSoundId } from '../catalogue'
import { decodeMix } from '../mix/shareLink'
import { useEngine } from '../player/PlayerContext'

export function SharedMixPage() {
  const engine = useEngine()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const mix = decodeMix(hash, isSoundId)

  if (mix.length === 0) {
    return (
      <main className="page">
        <h1>Shared mix</h1>
        <p>This link doesn't contain a mix we can play.</p>
        <Link to="/play" className="button-link">
          Open the player
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>Shared mix</h1>
      <ul aria-label="Sounds in this mix" className="shared-mix">
        {mix.map((layer) => (
          <li key={layer.soundId}>
            {getSound(layer.soundId)?.name} {layer.volume}%
          </li>
        ))}
      </ul>
      {/* Browsers only allow audio to start from a click, so the mix waits for one. */}
      <button
        type="button"
        className="primary"
        onClick={() => {
          void engine.loadMix(mix)
          navigate('/play')
        }}
      >
        Play this mix
      </button>
    </main>
  )
}
```

- [ ] **Step 6: Write `web/src/pages/LicencesPage.tsx`**

```tsx
import { SOUNDS } from '../catalogue'

export function LicencesPage() {
  return (
    <main className="page">
      <h1>Licences</h1>
      <p>Every sound in Ambiancy is listed here with where it came from and the licence it is used under.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Sound</th>
            <th scope="col">Author</th>
            <th scope="col">Licence</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {SOUNDS.map((sound) => (
            <tr key={sound.id}>
              <th scope="row">{sound.name}</th>
              <td>{sound.author}</td>
              <td>{sound.licence}</td>
              <td>{sound.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
```

- [ ] **Step 7: Write `web/src/pages/NotFoundPage.tsx`**

```tsx
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>There is nothing at this address.</p>
      <Link to="/" className="button-link">
        Back to the start
      </Link>
    </main>
  )
}
```

- [ ] **Step 8: Replace `web/src/App.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { LandingPage } from './pages/LandingPage'
import { Layout } from './pages/Layout'
import { LicencesPage } from './pages/LicencesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SharedMixPage } from './pages/SharedMixPage'
import { PlayerPage } from './player/PlayerPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="play" element={<PlayerPage />} />
        <Route path="mix" element={<SharedMixPage />} />
        <Route path="licences" element={<LicencesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 10: Write `web/src/styles.css`**

The palette is carried over from the original project. Fonts are system fonts, so no request goes to a third-party font service.

```css
:root {
  --primary: #554971;
  --primary-dark: #36213e;
  --accent: #8e7ab5;
  --accent-light: #c9b6e4;
  --accent-lightest: #f5f0fa;
  --accent-dark: #6a4e98;
  --text: #f5f0fa;
  --text-muted: #c9b6e4;
  --surface: rgba(255, 255, 255, 0.08);
  --surface-strong: rgba(255, 255, 255, 0.16);
  --danger: #ffb4a8;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: var(--text);
  background: var(--primary-dark);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(160deg, var(--primary-dark), var(--primary));
  background-attachment: fixed;
}

a {
  color: var(--accent-light);
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3rem);
  line-height: 1.15;
  margin: 0 0 1rem;
}

h2 {
  font-size: 1.2rem;
  margin: 2rem 0 0.75rem;
}

.site-header,
.site-footer,
.page {
  width: 100%;
  max-width: 60rem;
  margin: 0 auto;
  padding: 1rem;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}

.brand-accent {
  color: var(--accent-light);
}

.site-footer {
  margin-top: 3rem;
  font-size: 0.9rem;
}

.lead {
  font-size: 1.15rem;
  max-width: 40rem;
  color: var(--text-muted);
}

.hint,
.empty,
.tile-description {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.landing {
  padding-top: 4rem;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0 0.75rem;
}

button,
.button-link,
select {
  font: inherit;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--surface-strong);
  border-radius: 0.5rem;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

button:hover:not(:disabled),
.button-link:hover {
  background: var(--surface-strong);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent-light);
  outline-offset: 2px;
}

button.primary {
  background: var(--accent-dark);
  border-color: var(--accent);
}

.tile-grid,
.layer-list,
.shared-mix {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.tile-button {
  width: 100%;
  text-align: left;
  font-weight: 600;
}

.tile-button[aria-pressed='true'] {
  background: var(--accent-dark);
  border-color: var(--accent-light);
}

.tile-description {
  margin: 0.35rem 0 0;
}

.layer {
  display: grid;
  grid-template-columns: 9rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface);
}

.layer [role='alert'] {
  grid-column: 1 / -1;
  color: var(--danger);
}

input[type='range'] {
  width: 100%;
  accent-color: var(--accent-light);
}

.master,
.timer-form {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;
  margin: 1rem 0;
}

.master label,
.timer-form label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.share input {
  width: min(100%, 28rem);
  font: inherit;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--surface-strong);
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
}

.shared-mix li {
  padding: 0.35rem 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--surface);
  vertical-align: top;
}

@media (max-width: 34rem) {
  .layer {
    grid-template-columns: 1fr auto;
  }

  .layer input[type='range'] {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
```

- [ ] **Step 11: Replace `web/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from './App'
import { createBrowserEngine } from './audio/createBrowserEngine'
import { PlayerProvider } from './player/PlayerContext'
import './styles.css'

// One engine for the whole visit, above the router, so a mix keeps playing
// while the visitor moves between pages.
const engine = createBrowserEngine()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayerProvider engine={engine}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PlayerProvider>
  </StrictMode>,
)
```

- [ ] **Step 12: Run all tests, type-check and build**

Run: `npm test && npm run build`
Expected: all tests pass, no type errors, `✓ built`.

- [ ] **Step 13: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add web/src
git commit -m "feat: landing page, shared mix page, licences page, routing and styles" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Placeholder sounds, containers and the stage note

**Files:**
- Create: `tools/make-dev-sounds.sh`
- Create: `deploy/media.nginx.conf`
- Create: `web/Dockerfile`, `web/nginx.conf`, `web/.dockerignore`
- Create: `compose.yaml`
- Create: `docs/stages/01-containers.md`

**Interfaces:**
- Consumes: the sound ids in `web/src/catalogue/sounds.json`; the `VITE_MEDIA_BASE_URL` build variable read by `web/src/catalogue/index.ts`; `npm run build` from Task 1.
- Produces: `docker compose up -d --build` serving the app on `http://localhost:8080` and audio on `http://localhost:8081/audio/<id>.mp3`.

- [ ] **Step 1: Write `tools/make-dev-sounds.sh`**

These are generated noise loops, not recordings. They exist so the app can be run and heard before real licensed sounds are sourced.

```bash
#!/usr/bin/env bash
# Generates placeholder ambient loops into media/audio/ using FFmpeg.
# Usage: ./tools/make-dev-sounds.sh
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p media/audio

# make <id> <noise colour> <low-cut Hz> <high-cut Hz> <swell rate Hz> <swell depth 0-1>
make() {
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "anoisesrc=color=$2:duration=20:sample_rate=44100:amplitude=0.4" \
    -af "highpass=f=$3,lowpass=f=$4,tremolo=f=$5:d=$6" \
    -ac 2 -b:a 128k "media/audio/$1.mp3"
  echo "made media/audio/$1.mp3"
}

make rain            white  400  6000 0.3 0.2
make wind            pink   80   900  0.1 0.7
make creek           white  900  4500 2.0 0.3
make cicadas         white  3500 8000 6.0 0.5
make coffee-shop     pink   200  2500 0.7 0.3
make fireplace       brown  100  3000 4.0 0.6
make birds-chirping  white  2500 7000 3.0 0.8
make ocean-waves     brown  40   1200 0.1 0.9
make thunderstorm    brown  30   500  0.2 0.8
make night-forest    pink   150  1800 0.2 0.4
```

- [ ] **Step 2: Make it executable, run it, and check the output**

```bash
cd /mnt/heavy-data/ambiancy-v2
chmod +x tools/make-dev-sounds.sh
./tools/make-dev-sounds.sh
ls media/audio | wc -l
git status --short media
```

Expected: ten `made media/audio/...` lines, then `10`, then no output from `git status` (the folder is ignored).

- [ ] **Step 3: Check that the script and the catalogue agree**

```bash
cd /mnt/heavy-data/ambiancy-v2
node -e '
const fs = require("fs");
const sounds = require("./web/src/catalogue/sounds.json");
const missing = sounds.filter((s) => !fs.existsSync("media/" + s.audioFile)).map((s) => s.id);
if (missing.length) { console.error("missing audio for:", missing.join(", ")); process.exit(1); }
console.log("all", sounds.length, "sounds have audio");
'
```

Expected: `all 10 sounds have audio`.

- [ ] **Step 4: Write `deploy/media.nginx.conf`**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  location / {
    # The web app runs on another address, and the browser only lets it read
    # audio from here if this server says so.
    add_header Access-Control-Allow-Origin "*" always;
    add_header Cache-Control "public, max-age=3600" always;
    try_files $uri =404;
  }
}
```

- [ ] **Step 5: Write `web/nginx.conf`**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Built files have a fingerprint in their name, so they can be cached for a long time.
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  # Every other address is handled by the app itself (/play, /mix, ...).
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
  }
}
```

- [ ] **Step 6: Write `web/.dockerignore`**

```
node_modules
dist
coverage
*.log
```

- [ ] **Step 7: Write `web/Dockerfile`**

```dockerfile
# Stage 1: build the static files with Node.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_MEDIA_BASE_URL=http://localhost:8081
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL
RUN npm run build

# Stage 2: serve them with nginx. Node and the source code are left behind.
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 8: Write `compose.yaml`**

The `z` on each volume is required on Fedora, where SELinux otherwise blocks the container from reading the files.

```yaml
services:
  web:
    build:
      context: ./web
      args:
        VITE_MEDIA_BASE_URL: http://localhost:8081
    ports:
      - "8080:80"
    depends_on:
      - media

  media:
    image: nginx:stable-alpine
    ports:
      - "8081:80"
    volumes:
      - ./media:/usr/share/nginx/html:ro,z
      - ./deploy/media.nginx.conf:/etc/nginx/conf.d/default.conf:ro,z
```

- [ ] **Step 9: Build and start the stack**

```bash
cd /mnt/heavy-data/ambiancy-v2
docker compose up -d --build
docker compose ps
```

Expected: both `web` and `media` show as running.

- [ ] **Step 10: Check it from the command line**

```bash
curl -s -o /dev/null -w "home %{http_code}\n" http://localhost:8080/
curl -s -o /dev/null -w "play %{http_code}\n" http://localhost:8080/play
curl -s -o /dev/null -w "mix  %{http_code}\n" "http://localhost:8080/mix"
curl -s http://localhost:8080/ | grep -c '<div id="root">'
curl -s -o /dev/null -D - -H "Origin: http://localhost:8080" http://localhost:8081/audio/rain.mp3 | grep -iE "^HTTP|access-control-allow-origin|content-type"
curl -s -o /dev/null -w "missing %{http_code}\n" http://localhost:8081/audio/nope.mp3
```

Expected: `home 200`, `play 200`, `mix  200`, `1`, then `HTTP/1.1 200 OK`, `Content-Type: audio/mpeg` and `Access-Control-Allow-Origin: *`, then `missing 404`.

- [ ] **Step 11: Check it in a browser (the owner does this)**

Open `http://localhost:8080` and confirm each of these:

1. "Play Rainy café" on the landing page produces sound; "Stop" silences it.
2. "Open the player" shows the player; clicking Rain, then Fireplace, layers two sounds.
3. Each slider changes only its own sound; the master slider changes everything.
4. "Share this mix" gives a link; opening it in a new tab shows the mix and plays it after "Play this mix".
5. Stop the media container with `docker compose stop media`, reload, and click a sound: it shows "Couldn't load" with a retry. Run `docker compose start media` and the retry works.
6. Start a sleep timer; cancel it. (The shortest option is 15 minutes; the fade itself is covered by tests.)

- [ ] **Step 12: Write `docs/stages/01-containers.md`**

```markdown
# Stage 1: the player, in containers

## What was added

- The player itself: a React app that mixes ambient sounds in the browser.
- A `Dockerfile` that turns the app into a container image.
- A `compose.yaml` that runs two containers together: the app and a media server.

## Why containers

A container image holds the app together with everything it needs to run. The image built on this laptop is the same one that will later run in Azure, so "it works on my machine" and "it works in production" become the same statement.

## How the Dockerfile works

It has two stages:

1. **Build.** Starts from an image with Node installed, installs the dependencies, and runs `npm run build`. The result is a folder of plain HTML, CSS and JavaScript files.
2. **Serve.** Starts again from a small nginx image and copies in only that folder. Node, the source code and the dependencies are left behind, which keeps the final image small and gives an attacker less to work with.

`package.json` and `package-lock.json` are copied before the rest of the code. Docker caches each step, so the slow dependency install only reruns when those two files change.

## How Compose works

`compose.yaml` describes containers that belong together, so one command starts them all.

- **web** is built from `web/Dockerfile` and published on port 8080.
- **media** is a stock nginx image serving the `media/` folder on port 8081.

The media server is separate on purpose. In production the audio comes from Azure Blob Storage, a different address from the app. Running it separately locally means the cross-origin rules (the `Access-Control-Allow-Origin` header) are exercised here too, instead of being discovered for the first time in production.

## Things worth knowing

- **`VITE_MEDIA_BASE_URL` is a build-time setting.** The address of the media server is baked into the JavaScript when the image is built, because static files cannot read environment variables when they run. A different media address means a rebuild.
- **The `z` on the volume mounts** is for Fedora. SELinux blocks containers from reading host folders unless the mount is labelled, and `z` applies that label.
- **`try_files $uri /index.html`** in `web/nginx.conf` sends addresses such as `/play` to the app, which decides what to show. Without it, reloading `/play` would return a 404.
- **`media/` is not in git.** Audio is large and will live in object storage. The sounds here are generated noise from `tools/make-dev-sounds.sh`, standing in until licensed recordings are sourced.

## Commands

    docker compose up -d --build   # build and start
    docker compose ps              # what is running
    docker compose logs -f web     # follow the web container's logs
    docker compose down            # stop and remove the containers
```

- [ ] **Step 13: Stop the stack and run the full check once more**

```bash
cd /mnt/heavy-data/ambiancy-v2
docker compose down
cd web && npm test && npm run build
```

Expected: containers removed, all tests pass, `✓ built`.

- [ ] **Step 14: Commit**

```bash
cd /mnt/heavy-data/ambiancy-v2
git add tools deploy compose.yaml web/Dockerfile web/nginx.conf web/.dockerignore docs/stages
git commit -m "feat: placeholder sounds, container image and local Compose stack" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 15: Push and open a pull request (confirm with the owner first)**

```bash
cd /mnt/heavy-data/ambiancy-v2
git push -u origin feat/player
gh pr create --base main --head feat/player \
  --title "Player: mixer, scenes, share links, timers, in containers" \
  --body "$(cat <<'EOF'
## What this adds

- Audio engine on the Web Audio API: layered looping sounds, per-layer and master volume, fade-out
- Sound and scene catalogue as JSON, with source and licence recorded per sound
- Share links that carry the mix in the address (`/mix#rain=70,fireplace=40`)
- Sleep and focus timers that finish by the clock
- Landing page, player, shared-mix page and licences page
- Dockerfile and Compose stack: web on :8080, media on :8081

## How to check it

    ./tools/make-dev-sounds.sh
    docker compose up -d --build
    cd web && npm test

Then follow the browser checklist in the plan, Task 10 Step 11.

## Not in this change

Accounts, saved mixes, gallery, offline support, CI. See the plan table in `docs/superpowers/plans/2026-10-03-ambiancy-player.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: a pull-request URL is printed.
