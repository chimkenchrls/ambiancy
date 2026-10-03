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
