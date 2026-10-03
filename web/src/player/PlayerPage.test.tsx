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
