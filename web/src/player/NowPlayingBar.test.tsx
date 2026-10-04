import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SCENES } from '../catalogue'
import { renderWithEngine } from '../test/renderWithEngine'
import { NowPlayingBar } from './NowPlayingBar'

describe('NowPlayingBar', () => {
  it('says nothing is playing and disables play while the mix is empty', () => {
    renderWithEngine(<NowPlayingBar />)
    expect(screen.getByText('Nothing playing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  })

  it('shows what is playing', async () => {
    const { engine } = renderWithEngine(<NowPlayingBar />)
    await act(async () => {
      await engine.loadMix(SCENES[0]!.layers)
    })
    expect(screen.getByText(SCENES[0]!.name)).toBeInTheDocument()
    expect(screen.getByText('2 sounds')).toBeInTheDocument()
  })

  it('pauses and plays the mix', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<NowPlayingBar />)
    await act(async () => {
      await engine.loadMix(SCENES[0]!.layers)
    })

    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(await screen.findByRole('button', { name: 'Play' })).toBeEnabled()
    expect(engine.isPaused()).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(await screen.findByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(engine.isPaused()).toBe(false)
  })
})
