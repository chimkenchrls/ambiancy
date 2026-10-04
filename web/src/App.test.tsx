import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from './App'
import { SCENES, SOUNDS } from './catalogue'
import { renderWithEngine } from './test/renderWithEngine'

afterEach(() => {
  vi.useRealTimers()
})

describe('landing page', () => {
  it('introduces the product and links to the player', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Embrace the silence')
    const open = screen.getByRole('link', { name: 'Open the player' })
    expect(open).toHaveAttribute('href', '/play')
    expect(open).toHaveAttribute('target', '_blank')
  })

  it('stops the landing page sound when the player is opened in its own tab', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/' })
    await user.click(screen.getByRole('button', { name: `Play ${SCENES[0]!.name}` }))
    await screen.findByRole('button', { name: 'Stop' })

    fireEvent.click(screen.getByRole('link', { name: 'Open the player' }))

    expect(engine.getMix()).toEqual([])
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

describe('landing page sections', () => {
  it('suggests a scene for focus, relaxing and sleep, playable in place', async () => {
    const user = userEvent.setup()
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/' })
    const madeFor = within(screen.getByRole('region', { name: 'Made for' }))
    expect(madeFor.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Focus',
      'Relax',
      'Sleep',
    ])

    const scene = SCENES.find((candidate) => candidate.id === 'forest-night')!
    await user.click(madeFor.getByRole('button', { name: `Hear ${scene.name}` }))
    expect(engine.getMix()).toEqual(scene.layers)

    await user.click(await madeFor.findByRole('button', { name: `Stop ${scene.name}` }))
    expect(engine.getMix()).toEqual([])
  })

  it('explains how it works in three steps', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })
    const steps = within(screen.getByRole('region', { name: 'How it works' }))
    expect(steps.getAllByRole('listitem')).toHaveLength(3)
  })

  it('answers common questions', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })
    const questions = within(screen.getByRole('region', { name: 'Questions' }))
    expect(questions.getByText('Is Ambiancy free?')).toBeInTheDocument()
    expect(questions.getByText('Can I save my mixes?')).toBeInTheDocument()
    expect(questions.getByRole('link', { name: 'Licences page' })).toHaveAttribute('href', '/licences')
  })

  it('says where the project comes from and links to its code', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })
    const about = within(screen.getByRole('region', { name: 'About the project' }))
    expect(about.getByRole('link', { name: 'View the code on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/chimkenchrls/ambiancy',
    )
  })

  it('ends with a way into the player', () => {
    renderWithEngine(<AppRoutes />, { route: '/' })
    const start = screen.getByRole('link', { name: 'Start mixing' })
    expect(start).toHaveAttribute('href', '/play')
    expect(start).toHaveAttribute('target', '_blank')
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
    const sounds = within(screen.getByRole('table', { name: 'Sounds' }))
    expect(sounds.getAllByRole('row')).toHaveLength(SOUNDS.length + 1)
    expect(sounds.getByRole('row', { name: /Rain/ })).toHaveTextContent('CC0-1.0')

    const pictures = within(screen.getByRole('table', { name: 'Pictures' }))
    expect(pictures.getAllByRole('row')).toHaveLength(SOUNDS.length + 1)
    expect(pictures.getByRole('row', { name: /Rain/ })).toHaveTextContent(/CC|Public domain/)
    expect(pictures.getByRole('link', { name: /Rain/ })).toHaveAttribute(
      'href',
      expect.stringContaining('commons.wikimedia.org'),
    )
  })

  it('shows a not-found page for unknown addresses', () => {
    renderWithEngine(<AppRoutes />, { route: '/nowhere' })
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })

  it('gives the player its own page, without the site navigation', () => {
    renderWithEngine(<AppRoutes />, { route: '/play' })

    expect(screen.queryByRole('link', { name: 'Open web player' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Scenes' })).toHaveAttribute('href', '#scenes')
    expect(screen.getByRole('link', { name: 'Sounds' })).toHaveAttribute('href', '#sounds')
    expect(screen.getByRole('region', { name: 'Now playing' })).toBeInTheDocument()
  })

  it('keeps the brand and navigation on every site page', () => {
    renderWithEngine(<AppRoutes />, { route: '/licences' })

    expect(screen.getByRole('link', { name: 'Ambiancy.' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('link', { name: 'Licences' })).toHaveAttribute('href', '/licences')
    const header = within(screen.getByRole('banner'))
    expect(header.getAllByRole('link')).toHaveLength(2)
    const open = screen.getByRole('link', { name: 'Open web player' })
    expect(open).toHaveAttribute('href', '/play')
    expect(open).toHaveAttribute('target', '_blank')
  })
})

describe('things that outlive one page', () => {
  it('says so when the landing scene cannot load, and lets the visitor try again', async () => {
    const user = userEvent.setup()
    let fail = true
    const loadBuffer = async (soundId: string) => {
      if (fail) throw new Error('offline')
      return { soundId }
    }
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/', loadBuffer })

    await user.click(screen.getByRole('button', { name: `Play ${SCENES[0]!.name}` }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load")

    fail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(engine.getLayers().every((layer) => layer.status === 'playing')).toBe(true)
  })

  it('keeps a sleep timer running after the visitor leaves the player page', () => {
    vi.useFakeTimers()
    const { engine } = renderWithEngine(<AppRoutes />, { route: '/play' })
    const fadeOut = vi.spyOn(engine, 'fadeOut')

    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    fireEvent.click(screen.getByRole('link', { name: 'Licences' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Licences' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(15 * 60_000)
    })
    expect(fadeOut).toHaveBeenCalledExactlyOnceWith(30)
  })

  it('offers to resume when the browser pauses the sound', async () => {
    const user = userEvent.setup()
    const { context, setState } = renderWithEngine(<AppRoutes />, { route: '/play' })
    await user.click(screen.getByRole('button', { name: 'Rain' }))
    await screen.findByLabelText('Rain volume')
    expect(screen.queryByRole('button', { name: 'Resume sound' })).not.toBeInTheDocument()

    act(() => setState('interrupted'))
    await user.click(await screen.findByRole('button', { name: 'Resume sound' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Resume sound' })).not.toBeInTheDocument())
    expect(context.state).toBe('running')
  })
})
