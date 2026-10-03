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
