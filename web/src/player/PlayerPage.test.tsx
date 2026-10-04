import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SCENES } from '../catalogue'
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

  it('lists the scenes in the sidebar library and plays one from there', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<PlayerPage />)
    const scene = SCENES.find((candidate) => candidate.id === 'forest-night')!
    const library = within(screen.getByRole('region', { name: 'Library' }))

    expect(library.getAllByRole('button')).toHaveLength(SCENES.length)
    await user.click(library.getByRole('button', { name: `Play ${scene.name}` }))

    expect(engine.getMix()).toEqual(scene.layers)
    expect(await library.findByRole('button', { name: `Play ${scene.name}`, pressed: true })).toBeInTheDocument()
  })
})
