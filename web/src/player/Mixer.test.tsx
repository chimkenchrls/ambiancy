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

  it("shows each sound's photo, and drops it for the drawn fallback if it fails to load", () => {
    const { container } = renderWithEngine(<Mixer />)
    const rainTile = container.querySelector('.sound-grid [data-sound="rain"]')!
    const photo = rainTile.querySelector('img')!
    expect(photo.getAttribute('src')).toMatch(/\/images\/rain\.webp$/)

    fireEvent.error(photo)

    expect(rainTile.querySelector('img')).toBeNull()
    expect(rainTile.querySelector('.tile-art')).not.toBeNull()
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
