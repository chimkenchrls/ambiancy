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
