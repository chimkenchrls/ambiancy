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
