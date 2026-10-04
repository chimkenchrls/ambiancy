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

describe('browser audio state', () => {
  it('starts the download without waiting for the audio context to wake', async () => {
    const fake = createFakeContext()
    fake.context.resume = vi.fn(() => new Promise<void>(() => {})) as typeof fake.context.resume
    const engine = createAudioEngine({ context: fake.context, loadBuffer: instantLoader })

    await engine.addLayer('rain', 70)

    expect(fake.sources[0]?.start).toHaveBeenCalledOnce()
    expect(engine.getLayers()[0]!.status).toBe('playing')
  })

  it('still starts the layer when waking the audio context fails', async () => {
    const fake = createFakeContext()
    fake.context.resume = vi.fn(async () => {
      throw new Error('not allowed')
    }) as typeof fake.context.resume
    const engine = createAudioEngine({ context: fake.context, loadBuffer: instantLoader })

    await engine.addLayer('rain', 70)

    expect(engine.getLayers()[0]!.status).toBe('playing')
  })

  it('reports when the browser pauses playing audio, and recovers when resumed', async () => {
    const { engine, setState } = setup()
    await engine.addLayer('rain', 70)
    expect(engine.isAudioBlocked()).toBe(false)

    const listener = vi.fn()
    engine.subscribe(listener)
    setState('interrupted')
    expect(engine.isAudioBlocked()).toBe(true)
    expect(listener).toHaveBeenCalled()

    await engine.resumeAudio()
    expect(engine.isAudioBlocked()).toBe(false)
  })

  it('does not report blocked audio when nothing is playing', () => {
    const { engine, setState } = setup()
    setState('suspended')
    expect(engine.isAudioBlocked()).toBe(false)
  })
})

describe('pausing', () => {
  it('pauses and resumes without losing the mix', async () => {
    const { engine, context } = setup()
    await engine.addLayer('rain', 70)

    await engine.pause()
    expect(engine.isPaused()).toBe(true)
    expect(context.state).toBe('suspended')
    expect(engine.getMix()).toEqual([{ soundId: 'rain', volume: 70 }])

    await engine.resumeAudio()
    expect(engine.isPaused()).toBe(false)
    expect(context.state).toBe('running')
  })

  it('does not report a pause the visitor asked for as the browser blocking audio', async () => {
    const { engine } = setup()
    await engine.addLayer('rain', 70)
    await engine.pause()
    expect(engine.isAudioBlocked()).toBe(false)
  })

  it('starts playing again when a sound is added while paused', async () => {
    const { engine, context } = setup()
    await engine.addLayer('rain', 70)
    await engine.pause()

    await engine.addLayer('wind', 40)

    expect(engine.isPaused()).toBe(false)
    expect(context.state).toBe('running')
  })

  it('is no longer paused once everything is stopped', async () => {
    const { engine } = setup()
    await engine.addLayer('rain', 70)
    await engine.pause()
    engine.stopAll()
    expect(engine.isPaused()).toBe(false)
  })

  it('does nothing when the mix is empty', async () => {
    const { engine } = setup()
    await engine.pause()
    expect(engine.isPaused()).toBe(false)
  })
})
