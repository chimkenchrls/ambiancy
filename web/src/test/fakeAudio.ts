import { vi } from 'vitest'

export function createFakeGain() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

export function createFakeSource() {
  return {
    buffer: null as unknown,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
}

/** gains[0] is always the master gain; later gains are one per started layer. */
export function createFakeContext() {
  const gains: ReturnType<typeof createFakeGain>[] = []
  const sources: ReturnType<typeof createFakeSource>[] = []
  const stateListeners: Array<() => void> = []
  /** Changes the context state the way a browser does, telling listeners. */
  function setState(state: string) {
    context.state = state
    stateListeners.forEach((listener) => listener())
  }
  const context = {
    currentTime: 0,
    destination: { name: 'destination' },
    state: 'suspended' as string,
    resume: vi.fn(async () => {
      setState('running')
    }),
    addEventListener(_type: 'statechange', listener: () => void) {
      stateListeners.push(listener)
    },
    createGain() {
      const gain = createFakeGain()
      gains.push(gain)
      return gain
    },
    createBufferSource() {
      const source = createFakeSource()
      sources.push(source)
      return source
    },
  }
  return { context, gains, sources, setState }
}

/** A loader whose downloads finish only when the test says so. */
export function createDeferredLoader() {
  const pending = new Map<string, { resolve: (buffer: unknown) => void; reject: (error: Error) => void }>()
  const loadBuffer = vi.fn(
    (soundId: string) =>
      new Promise<unknown>((resolve, reject) => {
        pending.set(soundId, { resolve, reject })
      }),
  )
  return {
    loadBuffer,
    resolve(soundId: string) {
      pending.get(soundId)!.resolve({ soundId })
    },
    reject(soundId: string) {
      pending.get(soundId)!.reject(new Error('load failed'))
    },
  }
}

export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
